"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRoomAvailabilityHandler = exports.checkTeacherAvailabilityHandler = exports.generateSchedule = exports.getStudentScheduleHandler = exports.getTeacherScheduleHandler = exports.checkConflicts = void 0;
const schedulingService_1 = require("../services/schedulingService");
// Check for conflicts in a set of sections
const checkConflicts = async (req, res) => {
    try {
        const { sectionIds } = req.body;
        if (!Array.isArray(sectionIds) || sectionIds.length === 0) {
            res.status(400).json({ error: 'Please provide an array of section IDs' });
            return;
        }
        const result = await (0, schedulingService_1.detectScheduleConflicts)(sectionIds);
        res.json({
            hasConflicts: result.hasConflicts,
            conflicts: result.conflicts.map(c => ({
                sectionA: {
                    id: c.sectionA.id,
                    courseName: c.sectionA.courseName,
                    sectionIdentifier: c.sectionA.sectionIdentifier,
                    days: c.sectionA.days,
                    time: c.sectionA.time,
                    period: c.sectionA.period
                },
                sectionB: {
                    id: c.sectionB.id,
                    courseName: c.sectionB.courseName,
                    sectionIdentifier: c.sectionB.sectionIdentifier,
                    days: c.sectionB.days,
                    time: c.sectionB.time,
                    period: c.sectionB.period
                }
            }))
        });
    }
    catch (error) {
        console.error('Error checking conflicts:', error);
        res.status(500).json({ error: 'Failed to check conflicts' });
    }
};
exports.checkConflicts = checkConflicts;
// Get teacher's schedule
const getTeacherScheduleHandler = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const { sessionId } = req.query;
        const schedule = await (0, schedulingService_1.getTeacherSchedule)(teacherId, sessionId);
        res.json({
            teacherId,
            sessionId,
            sections: schedule.map(s => ({
                id: s.id,
                courseCode: s.course.courseCode,
                courseName: s.course.name,
                sectionIdentifier: s.sectionIdentifier,
                roomNumber: s.roomNumber,
                period: s.period,
                time: s.time,
                days: s.days,
                sessionName: s.session.name,
                enrollmentCount: s._count.enrollments,
                maxStudents: s.maxStudents
            }))
        });
    }
    catch (error) {
        console.error('Error fetching teacher schedule:', error);
        res.status(500).json({ error: 'Failed to fetch teacher schedule' });
    }
};
exports.getTeacherScheduleHandler = getTeacherScheduleHandler;
// Get student's schedule
const getStudentScheduleHandler = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { sessionId } = req.query;
        const schedule = await (0, schedulingService_1.getStudentSchedule)(studentId, sessionId);
        res.json({
            studentId,
            sessionId,
            sections: schedule.filter(s => s !== null).map(s => ({
                id: s.id,
                courseCode: s.course.courseCode,
                courseName: s.course.name,
                sectionIdentifier: s.sectionIdentifier,
                teacherName: `${s.teacher.firstName} ${s.teacher.lastName}`,
                roomNumber: s.roomNumber,
                period: s.period,
                time: s.time,
                days: s.days,
                sessionName: s.session.name,
                credits: s.course.credits
            }))
        });
    }
    catch (error) {
        console.error('Error fetching student schedule:', error);
        res.status(500).json({ error: 'Failed to fetch student schedule' });
    }
};
exports.getStudentScheduleHandler = getStudentScheduleHandler;
// Generate automatic schedule for student
const generateSchedule = async (req, res) => {
    try {
        const { studentId, courseIds, sessionId } = req.body;
        if (!studentId || !Array.isArray(courseIds) || !sessionId) {
            res.status(400).json({
                error: 'Please provide studentId, courseIds array, and sessionId'
            });
            return;
        }
        const result = await (0, schedulingService_1.generateStudentSchedule)(studentId, courseIds, sessionId);
        if (result.success) {
            res.json({
                success: true,
                message: 'Schedule generated successfully',
                sectionIds: result.schedule
            });
        }
        else {
            res.status(400).json({
                success: false,
                message: result.message,
                conflicts: result.conflicts
            });
        }
    }
    catch (error) {
        console.error('Error generating schedule:', error);
        res.status(500).json({ error: 'Failed to generate schedule' });
    }
};
exports.generateSchedule = generateSchedule;
// Check teacher availability
const checkTeacherAvailabilityHandler = async (req, res) => {
    try {
        const { teacherId, days, time, period, sessionId, excludeSectionId } = req.body;
        if (!teacherId || !sessionId || (!time && !period)) {
            res.status(400).json({
                error: 'Please provide teacherId, sessionId, and either time or period'
            });
            return;
        }
        const isAvailable = await (0, schedulingService_1.checkTeacherAvailability)(teacherId, { days: days || [], time, period }, sessionId, excludeSectionId);
        res.json({ available: isAvailable });
    }
    catch (error) {
        console.error('Error checking teacher availability:', error);
        res.status(500).json({ error: 'Failed to check teacher availability' });
    }
};
exports.checkTeacherAvailabilityHandler = checkTeacherAvailabilityHandler;
// Check room availability
const checkRoomAvailabilityHandler = async (req, res) => {
    try {
        const { roomNumber, days, time, period, sessionId, excludeSectionId } = req.body;
        if (!roomNumber || !sessionId || (!time && !period)) {
            res.status(400).json({
                error: 'Please provide roomNumber, sessionId, and either time or period'
            });
            return;
        }
        const isAvailable = await (0, schedulingService_1.checkRoomAvailability)(roomNumber, { days: days || [], time, period }, sessionId, excludeSectionId);
        res.json({ available: isAvailable });
    }
    catch (error) {
        console.error('Error checking room availability:', error);
        res.status(500).json({ error: 'Failed to check room availability' });
    }
};
exports.checkRoomAvailabilityHandler = checkRoomAvailabilityHandler;
//# sourceMappingURL=schedulingController.js.map