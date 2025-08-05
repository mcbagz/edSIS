import { Request, Response } from 'express';
import {
  detectScheduleConflicts,
  getTeacherSchedule,
  getStudentSchedule,
  generateStudentSchedule,
  checkTeacherAvailability,
  checkRoomAvailability
} from '../services/schedulingService';

// Check for conflicts in a set of sections
export const checkConflicts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sectionIds } = req.body;
    
    if (!Array.isArray(sectionIds) || sectionIds.length === 0) {
      res.status(400).json({ error: 'Please provide an array of section IDs' });
      return;
    }
    
    const result = await detectScheduleConflicts(sectionIds);
    
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
  } catch (error) {
    console.error('Error checking conflicts:', error);
    res.status(500).json({ error: 'Failed to check conflicts' });
  }
};

// Get teacher's schedule
export const getTeacherScheduleHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teacherId } = req.params;
    const { sessionId } = req.query;
    
    const schedule = await getTeacherSchedule(teacherId, sessionId as string);
    
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
  } catch (error) {
    console.error('Error fetching teacher schedule:', error);
    res.status(500).json({ error: 'Failed to fetch teacher schedule' });
  }
};

// Get student's schedule
export const getStudentScheduleHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const { sessionId } = req.query;
    
    const schedule = await getStudentSchedule(studentId, sessionId as string);
    
    res.json({
      studentId,
      sessionId,
      sections: schedule.filter(s => s !== null).map(s => ({
        id: s!.id,
        courseCode: s!.course.courseCode,
        courseName: s!.course.name,
        sectionIdentifier: s!.sectionIdentifier,
        teacherName: `${s!.teacher.firstName} ${s!.teacher.lastName}`,
        roomNumber: s!.roomNumber,
        period: s!.period,
        time: s!.time,
        days: s!.days,
        sessionName: s!.session.name,
        credits: s!.course.credits
      }))
    });
  } catch (error) {
    console.error('Error fetching student schedule:', error);
    res.status(500).json({ error: 'Failed to fetch student schedule' });
  }
};

// Generate automatic schedule for student
export const generateSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId, courseIds, sessionId } = req.body;
    
    if (!studentId || !Array.isArray(courseIds) || !sessionId) {
      res.status(400).json({ 
        error: 'Please provide studentId, courseIds array, and sessionId' 
      });
      return;
    }
    
    const result = await generateStudentSchedule(studentId, courseIds, sessionId);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Schedule generated successfully',
        sectionIds: result.schedule
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        conflicts: result.conflicts
      });
    }
  } catch (error) {
    console.error('Error generating schedule:', error);
    res.status(500).json({ error: 'Failed to generate schedule' });
  }
};

// Check teacher availability
export const checkTeacherAvailabilityHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teacherId, days, time, period, sessionId, excludeSectionId } = req.body;
    
    if (!teacherId || !sessionId || (!time && !period)) {
      res.status(400).json({ 
        error: 'Please provide teacherId, sessionId, and either time or period' 
      });
      return;
    }
    
    const isAvailable = await checkTeacherAvailability(
      teacherId,
      { days: days || [], time, period },
      sessionId,
      excludeSectionId
    );
    
    res.json({ available: isAvailable });
  } catch (error) {
    console.error('Error checking teacher availability:', error);
    res.status(500).json({ error: 'Failed to check teacher availability' });
  }
};

// Check room availability
export const checkRoomAvailabilityHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomNumber, days, time, period, sessionId, excludeSectionId } = req.body;
    
    if (!roomNumber || !sessionId || (!time && !period)) {
      res.status(400).json({ 
        error: 'Please provide roomNumber, sessionId, and either time or period' 
      });
      return;
    }
    
    const isAvailable = await checkRoomAvailability(
      roomNumber,
      { days: days || [], time, period },
      sessionId,
      excludeSectionId
    );
    
    res.json({ available: isAvailable });
  } catch (error) {
    console.error('Error checking room availability:', error);
    res.status(500).json({ error: 'Failed to check room availability' });
  }
};