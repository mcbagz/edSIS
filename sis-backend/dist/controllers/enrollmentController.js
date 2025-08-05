"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrollmentController = void 0;
const database_1 = __importDefault(require("../config/database"));
exports.enrollmentController = {
    // Get available courses for enrollment
    async getAvailableCourses(req, res) {
        try {
            const { gradeLevel, sessionId } = req.query;
            const courseSections = await database_1.default.courseSection.findMany({
                where: {
                    sessionId: sessionId,
                    course: {
                        gradeLevel: {
                            has: gradeLevel,
                        },
                    },
                    // Only show sections with available seats
                    currentEnrollment: {
                        lt: database_1.default.courseSection.fields.maxStudents,
                    },
                },
                include: {
                    course: true,
                    teacher: true,
                    session: true,
                },
            });
            // Group by course
            const coursesByCode = courseSections.reduce((acc, section) => {
                const courseCode = section.course.courseCode;
                if (!acc[courseCode]) {
                    acc[courseCode] = {
                        course: section.course,
                        sections: [],
                    };
                }
                acc[courseCode].sections.push({
                    id: section.id,
                    sectionIdentifier: section.sectionIdentifier,
                    teacher: `${section.teacher.firstName} ${section.teacher.lastName}`,
                    time: section.time,
                    days: section.days,
                    roomNumber: section.roomNumber,
                    availableSeats: section.maxStudents - section.currentEnrollment,
                });
                return acc;
            }, {});
            res.json(Object.values(coursesByCode));
        }
        catch (error) {
            console.error('Error fetching available courses:', error);
            res.status(500).json({ message: 'Failed to fetch available courses' });
        }
    },
    // Get available homerooms
    async getAvailableHomerooms(req, res) {
        try {
            const { gradeLevel } = req.query;
            const homerooms = await database_1.default.homeroom.findMany({
                where: {
                    gradeLevel: gradeLevel,
                    // Find homerooms with available capacity
                },
                include: {
                    teacher: true,
                    _count: {
                        select: { enrollments: true },
                    },
                },
            });
            const availableHomerooms = homerooms
                .filter((hr) => hr._count.enrollments < hr.capacity)
                .map((hr) => ({
                id: hr.id,
                name: hr.name,
                teacher: `${hr.teacher.firstName} ${hr.teacher.lastName}`,
                roomNumber: hr.roomNumber,
                availableSeats: hr.capacity - hr._count.enrollments,
            }));
            res.json(availableHomerooms);
        }
        catch (error) {
            console.error('Error fetching homerooms:', error);
            res.status(500).json({ message: 'Failed to fetch homerooms' });
        }
    },
    // Enroll student in courses and homeroom
    async enrollStudent(req, res) {
        try {
            const { studentId, courseSectionIds, homeroomId } = req.body;
            // Validate student exists
            const student = await database_1.default.student.findUnique({
                where: { id: studentId },
            });
            if (!student) {
                res.status(404).json({ message: 'Student not found' });
                return;
            }
            // Validate all course sections exist and have capacity
            const courseSections = await database_1.default.courseSection.findMany({
                where: {
                    id: { in: courseSectionIds },
                },
            });
            if (courseSections.length !== courseSectionIds.length) {
                res.status(400).json({ message: 'Invalid course section(s)' });
                return;
            }
            // Check capacity for each section
            for (const section of courseSections) {
                if (section.currentEnrollment >= section.maxStudents) {
                    res.status(400).json({
                        message: `Course section ${section.sectionIdentifier} is full`,
                    });
                    return;
                }
            }
            // Check for time conflicts
            const timeConflicts = this.checkTimeConflicts(courseSections);
            if (timeConflicts.length > 0) {
                res.status(400).json({
                    message: 'Time conflicts detected',
                    conflicts: timeConflicts,
                });
                return;
            }
            // Validate homeroom
            const homeroom = await database_1.default.homeroom.findUnique({
                where: { id: homeroomId },
                include: {
                    _count: {
                        select: { enrollments: true },
                    },
                },
            });
            if (!homeroom) {
                res.status(404).json({ message: 'Homeroom not found' });
                return;
            }
            if (homeroom._count.enrollments >= homeroom.capacity) {
                res.status(400).json({ message: 'Homeroom is full' });
                return;
            }
            // Create enrollments in a transaction
            const enrollments = await database_1.default.$transaction(async (tx) => {
                // Create course enrollments
                const courseEnrollments = await Promise.all(courseSectionIds.map((sectionId) => tx.enrollment.create({
                    data: {
                        studentId,
                        courseSectionId: sectionId,
                    },
                })));
                // Create homeroom enrollment
                const homeroomEnrollment = await tx.enrollment.create({
                    data: {
                        studentId,
                        homeroomId,
                    },
                });
                // Update course section enrollment counts
                await Promise.all(courseSectionIds.map((sectionId) => tx.courseSection.update({
                    where: { id: sectionId },
                    data: {
                        currentEnrollment: {
                            increment: 1,
                        },
                    },
                })));
                return [...courseEnrollments, homeroomEnrollment];
            });
            res.status(201).json({
                message: 'Student enrolled successfully',
                enrollments,
            });
        }
        catch (error) {
            console.error('Error enrolling student:', error);
            res.status(500).json({ message: 'Failed to enroll student' });
        }
    },
    // Get student's current enrollments
    async getStudentEnrollments(req, res) {
        try {
            const { studentId } = req.params;
            const enrollments = await database_1.default.enrollment.findMany({
                where: {
                    studentId,
                    status: 'Active',
                },
                include: {
                    courseSection: {
                        include: {
                            course: true,
                            teacher: true,
                        },
                    },
                    homeroom: {
                        include: {
                            teacher: true,
                        },
                    },
                },
            });
            res.json(enrollments);
        }
        catch (error) {
            console.error('Error fetching enrollments:', error);
            res.status(500).json({ message: 'Failed to fetch enrollments' });
        }
    },
    // Drop a course
    async dropCourse(req, res) {
        try {
            const { enrollmentId } = req.params;
            const enrollment = await database_1.default.enrollment.findUnique({
                where: { id: enrollmentId },
                include: {
                    courseSection: true,
                },
            });
            if (!enrollment) {
                res.status(404).json({ message: 'Enrollment not found' });
                return;
            }
            // Update enrollment status and decrement course enrollment count
            await database_1.default.$transaction(async (tx) => {
                await tx.enrollment.update({
                    where: { id: enrollmentId },
                    data: {
                        status: 'Dropped',
                        exitDate: new Date(),
                    },
                });
                if (enrollment.courseSectionId) {
                    await tx.courseSection.update({
                        where: { id: enrollment.courseSectionId },
                        data: {
                            currentEnrollment: {
                                decrement: 1,
                            },
                        },
                    });
                }
            });
            res.json({ message: 'Course dropped successfully' });
        }
        catch (error) {
            console.error('Error dropping course:', error);
            res.status(500).json({ message: 'Failed to drop course' });
        }
    },
    // Helper method to check time conflicts
    checkTimeConflicts(sections) {
        const conflicts = [];
        for (let i = 0; i < sections.length; i++) {
            for (let j = i + 1; j < sections.length; j++) {
                const section1 = sections[i];
                const section2 = sections[j];
                // Check if sections have overlapping days
                const commonDays = section1.days.filter((day) => section2.days.includes(day));
                if (commonDays.length > 0 && section1.period === section2.period) {
                    conflicts.push({
                        section1: section1.id,
                        section2: section2.id,
                        conflictingDays: commonDays,
                        period: section1.period,
                    });
                }
            }
        }
        return conflicts;
    },
};
//# sourceMappingURL=enrollmentController.js.map