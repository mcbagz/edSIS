"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasTimeConflict = hasTimeConflict;
exports.detectScheduleConflicts = detectScheduleConflicts;
exports.getTeacherSchedule = getTeacherSchedule;
exports.getStudentSchedule = getStudentSchedule;
exports.generateStudentSchedule = generateStudentSchedule;
exports.checkTeacherAvailability = checkTeacherAvailability;
exports.checkRoomAvailability = checkRoomAvailability;
const prisma_1 = require("../generated/prisma");
const prisma = new prisma_1.PrismaClient();
// Parse time string like "8:00 AM - 8:50 AM" to get start and end times
function parseTimeRange(timeStr) {
    if (!timeStr)
        return null;
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match)
        return null;
    const [, startHour, startMin, startPeriod, endHour, endMin, endPeriod] = match;
    let startHours = parseInt(startHour);
    let endHours = parseInt(endHour);
    if (startPeriod.toUpperCase() === 'PM' && startHours !== 12)
        startHours += 12;
    if (startPeriod.toUpperCase() === 'AM' && startHours === 12)
        startHours = 0;
    if (endPeriod.toUpperCase() === 'PM' && endHours !== 12)
        endHours += 12;
    if (endPeriod.toUpperCase() === 'AM' && endHours === 12)
        endHours = 0;
    const startTime = startHours * 60 + parseInt(startMin);
    const endTime = endHours * 60 + parseInt(endMin);
    return { start: startTime, end: endTime };
}
// Check if two time slots conflict
function hasTimeConflict(sectionA, sectionB) {
    // If either section doesn't have time/days info, no conflict
    if (!sectionA.time || !sectionB.time || !sectionA.days.length || !sectionB.days.length) {
        return false;
    }
    // Check if they share any days
    const sharedDays = sectionA.days.filter(day => sectionB.days.includes(day));
    if (sharedDays.length === 0) {
        return false;
    }
    // Parse time ranges
    const timeA = parseTimeRange(sectionA.time);
    const timeB = parseTimeRange(sectionB.time);
    if (!timeA || !timeB) {
        // If we can't parse times, check if periods match (for period-based scheduling)
        if (sectionA.period && sectionB.period) {
            return sectionA.period === sectionB.period;
        }
        return false;
    }
    // Check if times overlap
    return timeA.start < timeB.end && timeB.start < timeA.end;
}
// Detect all conflicts in a schedule
async function detectScheduleConflicts(sectionIds) {
    if (sectionIds.length < 2) {
        return { hasConflicts: false, conflicts: [] };
    }
    // Fetch all sections with their details
    const sections = await prisma.courseSection.findMany({
        where: {
            id: { in: sectionIds }
        },
        include: {
            course: {
                select: { name: true }
            }
        }
    });
    const sectionsWithTime = sections.map(s => ({
        id: s.id,
        courseId: s.courseId,
        days: s.days,
        time: s.time,
        period: s.period,
        courseName: s.course.name,
        sectionIdentifier: s.sectionIdentifier
    }));
    const conflicts = [];
    // Check all pairs for conflicts
    for (let i = 0; i < sectionsWithTime.length; i++) {
        for (let j = i + 1; j < sectionsWithTime.length; j++) {
            if (hasTimeConflict(sectionsWithTime[i], sectionsWithTime[j])) {
                conflicts.push({
                    sectionA: sectionsWithTime[i],
                    sectionB: sectionsWithTime[j]
                });
            }
        }
    }
    return {
        hasConflicts: conflicts.length > 0,
        conflicts
    };
}
// Get teacher's schedule
async function getTeacherSchedule(teacherId, sessionId) {
    const where = { teacherId };
    if (sessionId)
        where.sessionId = sessionId;
    const sections = await prisma.courseSection.findMany({
        where,
        include: {
            course: true,
            session: true,
            _count: {
                select: { enrollments: true }
            }
        },
        orderBy: [
            { period: 'asc' },
            { time: 'asc' }
        ]
    });
    return sections;
}
// Get student's schedule
async function getStudentSchedule(studentId, sessionId) {
    const where = {
        studentId,
        status: 'Active'
    };
    if (sessionId) {
        where.courseSection = { sessionId };
    }
    const enrollments = await prisma.enrollment.findMany({
        where,
        include: {
            courseSection: {
                include: {
                    course: true,
                    teacher: true,
                    session: true
                }
            }
        }
    });
    return enrollments.map(e => e.courseSection).filter(Boolean);
}
// Automatic scheduler - find non-conflicting schedule for student
async function generateStudentSchedule(studentId, requestedCourseIds, sessionId) {
    try {
        // Get all available sections for requested courses
        const availableSections = await prisma.courseSection.findMany({
            where: {
                courseId: { in: requestedCourseIds },
                sessionId,
                currentEnrollment: { lt: prisma.courseSection.fields.maxStudents }
            },
            include: {
                course: true
            }
        });
        // Group sections by course
        const sectionsByCourse = new Map();
        for (const section of availableSections) {
            const courseSections = sectionsByCourse.get(section.courseId) || [];
            courseSections.push(section);
            sectionsByCourse.set(section.courseId, courseSections);
        }
        // Check if all requested courses have available sections
        const unavailableCourses = requestedCourseIds.filter(courseId => !sectionsByCourse.has(courseId) || sectionsByCourse.get(courseId).length === 0);
        if (unavailableCourses.length > 0) {
            return {
                success: false,
                message: `No available sections for some courses`,
                conflicts: unavailableCourses
            };
        }
        // Try to find a valid schedule using backtracking
        const schedule = findValidSchedule(Array.from(sectionsByCourse.values()), [], 0);
        if (schedule) {
            return {
                success: true,
                schedule: schedule.map(s => s.id)
            };
        }
        else {
            return {
                success: false,
                message: 'Unable to create a conflict-free schedule with the requested courses'
            };
        }
    }
    catch (error) {
        console.error('Error generating schedule:', error);
        return {
            success: false,
            message: 'Failed to generate schedule'
        };
    }
}
// Recursive backtracking to find valid schedule
function findValidSchedule(courseGroups, currentSchedule, courseIndex) {
    // Base case: all courses scheduled
    if (courseIndex >= courseGroups.length) {
        return currentSchedule;
    }
    const currentCourseSections = courseGroups[courseIndex];
    // Try each section for the current course
    for (const section of currentCourseSections) {
        // Check if this section conflicts with any already scheduled
        let hasConflict = false;
        for (const scheduledSection of currentSchedule) {
            if (hasTimeConflict(section, scheduledSection)) {
                hasConflict = true;
                break;
            }
        }
        if (!hasConflict) {
            // Try this section and continue with next course
            const result = findValidSchedule(courseGroups, [...currentSchedule, section], courseIndex + 1);
            if (result) {
                return result;
            }
        }
    }
    // No valid schedule found with current path
    return null;
}
// Check teacher availability for a time slot
async function checkTeacherAvailability(teacherId, timeSlot, sessionId, excludeSectionId) {
    const where = {
        teacherId,
        sessionId
    };
    if (excludeSectionId) {
        where.NOT = { id: excludeSectionId };
    }
    const teacherSections = await prisma.courseSection.findMany({
        where,
        select: {
            days: true,
            time: true,
            period: true
        }
    });
    for (const section of teacherSections) {
        const sectionData = {
            id: '',
            courseId: '',
            days: section.days,
            time: section.time,
            period: section.period
        };
        const newSectionData = {
            id: '',
            courseId: '',
            days: timeSlot.days,
            time: timeSlot.time,
            period: timeSlot.period
        };
        if (hasTimeConflict(sectionData, newSectionData)) {
            return false;
        }
    }
    return true;
}
// Check room availability for a time slot
async function checkRoomAvailability(roomNumber, timeSlot, sessionId, excludeSectionId) {
    const where = {
        roomNumber,
        sessionId
    };
    if (excludeSectionId) {
        where.NOT = { id: excludeSectionId };
    }
    const roomSections = await prisma.courseSection.findMany({
        where,
        select: {
            days: true,
            time: true,
            period: true
        }
    });
    for (const section of roomSections) {
        const sectionData = {
            id: '',
            courseId: '',
            days: section.days,
            time: section.time,
            period: section.period
        };
        const newSectionData = {
            id: '',
            courseId: '',
            days: timeSlot.days,
            time: timeSlot.time,
            period: timeSlot.period
        };
        if (hasTimeConflict(sectionData, newSectionData)) {
            return false;
        }
    }
    return true;
}
//# sourceMappingURL=schedulingService.js.map