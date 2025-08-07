import { Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma';
import { AuthRequest } from '../middleware/auth';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, format } from 'date-fns';

const prisma = new PrismaClient();

export const attendanceController = {
  // Record attendance for a single student
  async recordAttendance(req: AuthRequest, res: Response) {
    try {
      const { studentId, courseSectionId, date, attendanceCode, notes } = req.body;

      // Verify attendance code exists
      const code = await prisma.attendanceCode.findUnique({
        where: { code: attendanceCode }
      });

      if (!code) {
        res.status(400).json({ message: 'Invalid attendance code' });
        return;
      }

      // Create or update attendance record
      const attendance = await prisma.attendance.upsert({
        where: {
          studentId_courseSectionId_date: {
            studentId,
            courseSectionId: courseSectionId || '',
            date: new Date(date)
          }
        },
        update: {
          attendanceCode,
          notes,
          updatedAt: new Date()
        },
        create: {
          studentId,
          courseSectionId,
          date: new Date(date),
          attendanceCode,
          notes
        }
      });

      res.json(attendance);
    } catch (error) {
      console.error('Error recording attendance:', error);
      res.status(500).json({ message: 'Failed to record attendance' });
    }
  },

  // Bulk attendance entry for a class
  async recordBulkAttendance(req: AuthRequest, res: Response) {
    try {
      const { courseSectionId, date, attendanceRecords } = req.body;

      // Validate all attendance codes first
      const codes = await prisma.attendanceCode.findMany({
        where: {
          code: {
            in: attendanceRecords.map((r: any) => r.attendanceCode)
          }
        }
      });

      if (codes.length !== attendanceRecords.length) {
        res.status(400).json({ message: 'Invalid attendance codes detected' });
        return;
      }

      // Process all attendance records in a transaction
      const results = await prisma.$transaction(
        attendanceRecords.map((record: any) =>
          prisma.attendance.upsert({
            where: {
              studentId_courseSectionId_date: {
                studentId: record.studentId,
                courseSectionId: courseSectionId || '',
                date: new Date(date)
              }
            },
            update: {
              attendanceCode: record.attendanceCode,
              notes: record.notes,
              minutes: record.minutes
            },
            create: {
              studentId: record.studentId,
              courseSectionId,
              date: new Date(date),
              attendanceCode: record.attendanceCode,
              notes: record.notes,
              minutes: record.minutes
            }
          })
        )
      );

      res.json({
        message: 'Bulk attendance recorded successfully',
        recordsProcessed: results.length
      });
    } catch (error) {
      console.error('Error recording bulk attendance:', error);
      res.status(500).json({ message: 'Failed to record bulk attendance' });
    }
  },

  // Get attendance for a specific date and class/homeroom
  async getClassAttendance(req: Request, res: Response) {
    try {
      const { date, courseSectionId, homeroomId } = req.query;

      const where: any = {
        date: new Date(date as string)
      };

      if (courseSectionId) {
        where.courseSectionId = courseSectionId;
      }

      // Get all students in the class/homeroom
      let enrolledStudents;
      if (courseSectionId) {
        enrolledStudents = await prisma.enrollment.findMany({
          where: {
            courseSectionId: courseSectionId as string,
            status: 'Active'
          },
          include: {
            student: true
          }
        });
      } else if (homeroomId) {
        enrolledStudents = await prisma.enrollment.findMany({
          where: {
            homeroomId: homeroomId as string,
            status: 'Active'
          },
          include: {
            student: true
          }
        });
      } else {
        res.status(400).json({ message: 'Must provide either courseSectionId or homeroomId' });
        return;
      }

      // Get attendance records
      const attendanceRecords = await prisma.attendance.findMany({
        where,
        include: {
          student: true
        }
      });

      // Map attendance to students
      const attendanceMap = new Map(
        attendanceRecords.map(a => [a.studentId, a])
      );

      // Combine enrolled students with their attendance
      const classAttendance = enrolledStudents.map(enrollment => ({
        studentId: enrollment.student.id,
        studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
        studentUniqueId: enrollment.student.studentUniqueId,
        gradeLevel: enrollment.student.gradeLevel,
        attendance: attendanceMap.get(enrollment.student.id) || null
      }));

      res.json(classAttendance);
    } catch (error) {
      console.error('Error fetching class attendance:', error);
      res.status(500).json({ message: 'Failed to fetch class attendance' });
    }
  },

  // Get attendance report for a student
  async getStudentAttendanceReport(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      const { startDate, endDate } = req.query;

      const where: any = { studentId };
      if (startDate && endDate) {
        where.date = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        };
      }

      const attendanceRecords = await prisma.attendance.findMany({
        where,
        include: {
          courseSection: {
            include: {
              course: true
            }
          }
        },
        orderBy: { date: 'desc' }
      });

      // Get attendance codes for summary
      const attendanceCodes = await prisma.attendanceCode.findMany({
        where: { isActive: true }
      });

      // Calculate summary statistics
      const summary = {
        totalDays: attendanceRecords.length,
        present: 0,
        absent: 0,
        tardy: 0,
        excused: 0,
        attendanceRate: 0
      };

      attendanceRecords.forEach(record => {
        const code = attendanceCodes.find(c => c.code === record.attendanceCode);
        if (code) {
          if (code.countsAsPresent) summary.present++;
          if (code.countsAsAbsent) summary.absent++;
          if (code.countsAsTardy) summary.tardy++;
          if (code.isExcused) summary.excused++;
        }
      });

      summary.attendanceRate = summary.totalDays > 0
        ? parseFloat(((summary.present / summary.totalDays) * 100).toFixed(1))
        : 0;

      res.json({
        student: await prisma.student.findUnique({ where: { id: studentId } }),
        summary,
        records: attendanceRecords,
        period: {
          startDate: startDate || 'All time',
          endDate: endDate || 'All time'
        }
      });
    } catch (error) {
      console.error('Error generating student attendance report:', error);
      res.status(500).json({ message: 'Failed to generate attendance report' });
    }
  },

  // Get school-wide attendance report
  async getSchoolAttendanceReport(req: Request, res: Response) {
    try {
      const { date, gradeLevel, period } = req.query;
      
      let startDate: Date;
      let endDate: Date;

      // Determine date range based on period
      if (period === 'day') {
        startDate = startOfDay(new Date(date as string));
        endDate = endOfDay(new Date(date as string));
      } else if (period === 'week') {
        startDate = startOfWeek(new Date(date as string));
        endDate = endOfWeek(new Date(date as string));
      } else if (period === 'month') {
        startDate = startOfMonth(new Date(date as string));
        endDate = endOfMonth(new Date(date as string));
      } else {
        startDate = startOfDay(new Date(date as string));
        endDate = endOfDay(new Date(date as string));
      }

      // Build query
      const where: any = {
        date: {
          gte: startDate,
          lte: endDate
        }
      };

      if (gradeLevel && gradeLevel !== 'all') {
        const students = await prisma.student.findMany({
          where: { gradeLevel: gradeLevel as string },
          select: { id: true }
        });
        where.studentId = { in: students.map(s => s.id) };
      }

      // Get attendance records
      const attendanceRecords = await prisma.attendance.findMany({
        where,
        include: {
          student: true
        }
      });

      // Get attendance codes
      const attendanceCodes = await prisma.attendanceCode.findMany({
        where: { isActive: true }
      });

      // Calculate statistics
      const totalStudents = await prisma.student.count({
        where: gradeLevel && gradeLevel !== 'all' ? { gradeLevel: gradeLevel as string } : {}
      });

      const stats = {
        totalStudents,
        totalRecords: attendanceRecords.length,
        presentCount: 0,
        absentCount: 0,
        tardyCount: 0,
        excusedCount: 0,
        attendanceRate: 0,
        byGrade: {} as Record<string, any>,
        byDate: {} as Record<string, any>
      };

      // Process records
      attendanceRecords.forEach(record => {
        const code = attendanceCodes.find(c => c.code === record.attendanceCode);
        if (code) {
          if (code.countsAsPresent) stats.presentCount++;
          if (code.countsAsAbsent) stats.absentCount++;
          if (code.countsAsTardy) stats.tardyCount++;
          if (code.isExcused) stats.excusedCount++;
        }

        // Group by grade
        const grade = record.student.gradeLevel;
        if (!stats.byGrade[grade]) {
          stats.byGrade[grade] = {
            total: 0,
            present: 0,
            absent: 0,
            tardy: 0
          };
        }
        stats.byGrade[grade].total++;
        if (code?.countsAsPresent) stats.byGrade[grade].present++;
        if (code?.countsAsAbsent) stats.byGrade[grade].absent++;
        if (code?.countsAsTardy) stats.byGrade[grade].tardy++;

        // Group by date
        const dateKey = format(record.date, 'yyyy-MM-dd');
        if (!stats.byDate[dateKey]) {
          stats.byDate[dateKey] = {
            total: 0,
            present: 0,
            absent: 0,
            tardy: 0
          };
        }
        stats.byDate[dateKey].total++;
        if (code?.countsAsPresent) stats.byDate[dateKey].present++;
        if (code?.countsAsAbsent) stats.byDate[dateKey].absent++;
        if (code?.countsAsTardy) stats.byDate[dateKey].tardy++;
      });

      stats.attendanceRate = stats.totalRecords > 0
        ? parseFloat(((stats.presentCount / stats.totalRecords) * 100).toFixed(1))
        : 0;

      res.json({
        period: {
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
          type: period || 'day'
        },
        statistics: stats,
        gradeLevel: gradeLevel || 'all'
      });
    } catch (error) {
      console.error('Error generating school attendance report:', error);
      res.status(500).json({ message: 'Failed to generate school attendance report' });
    }
  },

  // Get attendance trends and analytics
  async getAttendanceAnalytics(req: Request, res: Response) {
    try {
      const { days = 30 } = req.query;
      const endDate = new Date();
      const startDate = subDays(endDate, Number(days));

      // Get attendance records for the period
      const attendanceRecords = await prisma.attendance.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          student: true
        }
      });

      // Get attendance codes
      const attendanceCodes = await prisma.attendanceCode.findMany({
        where: { isActive: true }
      });

      // Calculate daily trends
      const dailyTrends: any[] = [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dayRecords = attendanceRecords.filter(
          r => format(r.date, 'yyyy-MM-dd') === format(d, 'yyyy-MM-dd')
        );

        if (dayRecords.length > 0) {
          const presentCount = dayRecords.filter(r => {
            const code = attendanceCodes.find(c => c.code === r.attendanceCode);
            return code?.countsAsPresent;
          }).length;

          dailyTrends.push({
            date: format(d, 'yyyy-MM-dd'),
            total: dayRecords.length,
            present: presentCount,
            absent: dayRecords.length - presentCount,
            rate: parseFloat(((presentCount / dayRecords.length) * 100).toFixed(1))
          });
        }
      }

      // Identify chronic absenteeism (students missing >10% of days)
      const studentAttendance = new Map<string, { present: number; total: number }>();
      
      attendanceRecords.forEach(record => {
        const code = attendanceCodes.find(c => c.code === record.attendanceCode);
        const studentId = record.studentId;
        
        if (!studentAttendance.has(studentId)) {
          studentAttendance.set(studentId, { present: 0, total: 0 });
        }
        
        const stats = studentAttendance.get(studentId)!;
        stats.total++;
        if (code?.countsAsPresent) stats.present++;
      });

      const chronicAbsentees = Array.from(studentAttendance.entries())
        .filter(([_, stats]) => {
          const absentRate = ((stats.total - stats.present) / stats.total) * 100;
          return absentRate > 10;
        })
        .map(([studentId, stats]) => ({
          studentId,
          attendanceRate: parseFloat(((stats.present / stats.total) * 100).toFixed(1)),
          daysAbsent: stats.total - stats.present,
          totalDays: stats.total
        }));

      // Get students with chronic absenteeism details
      const chronicallyAbsentStudents = await prisma.student.findMany({
        where: {
          id: { in: chronicAbsentees.map(a => a.studentId) }
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          gradeLevel: true,
          studentUniqueId: true
        }
      });

      const chronicAbsenteeDetails = chronicAbsentees.map(absence => {
        const student = chronicallyAbsentStudents.find(s => s.id === absence.studentId);
        return {
          ...absence,
          studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown',
          gradeLevel: student?.gradeLevel,
          studentUniqueId: student?.studentUniqueId
        };
      });

      res.json({
        period: {
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
          days: Number(days)
        },
        trends: dailyTrends,
        chronicAbsenteeism: {
          count: chronicAbsentees.length,
          students: chronicAbsenteeDetails
        },
        averageAttendanceRate: dailyTrends.length > 0
          ? parseFloat((dailyTrends.reduce((sum, d) => sum + d.rate, 0) / dailyTrends.length).toFixed(1))
          : 0
      });
    } catch (error) {
      console.error('Error generating attendance analytics:', error);
      res.status(500).json({ message: 'Failed to generate attendance analytics' });
    }
  },

  // Send attendance notifications to parents
  async sendAttendanceNotifications(req: AuthRequest, res: Response) {
    try {
      const { studentId, type, message } = req.body;

      // Get student and parent information
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          studentParents: {
            include: {
              parent: true
            }
          }
        }
      });

      if (!student) {
        res.status(404).json({ message: 'Student not found' });
        return;
      }

      // Here you would integrate with an email/SMS service
      // For now, we'll just log the notification
      const notifications = student.studentParents.map(sp => ({
        parentName: `${sp.parent.firstName} ${sp.parent.lastName}`,
        parentEmail: sp.parent.email,
        studentName: `${student.firstName} ${student.lastName}`,
        notificationType: type,
        message,
        sentAt: new Date()
      }));

      console.log('Attendance notifications:', notifications);

      res.json({
        message: 'Notifications sent successfully',
        notificationsSent: notifications.length,
        recipients: notifications.map(n => n.parentEmail)
      });
    } catch (error) {
      console.error('Error sending attendance notifications:', error);
      res.status(500).json({ message: 'Failed to send notifications' });
    }
  },

  // Get attendance summary for dashboard
  async getAttendanceSummary(req: Request, res: Response) {
    try {
      const today = new Date();
      const startOfToday = startOfDay(today);
      const endOfToday = endOfDay(today);

      // Get today's attendance
      const todayAttendance = await prisma.attendance.findMany({
        where: {
          date: {
            gte: startOfToday,
            lte: endOfToday
          }
        }
      });

      // Get attendance codes
      const attendanceCodes = await prisma.attendanceCode.findMany({
        where: { isActive: true }
      });

      // Calculate summary
      const summary = {
        date: format(today, 'yyyy-MM-dd'),
        totalStudents: await prisma.student.count({ where: { enrollmentStatus: 'Active' } }),
        recordedToday: todayAttendance.length,
        presentToday: 0,
        absentToday: 0,
        tardyToday: 0,
        attendanceRate: 0
      };

      todayAttendance.forEach(record => {
        const code = attendanceCodes.find(c => c.code === record.attendanceCode);
        if (code) {
          if (code.countsAsPresent) summary.presentToday++;
          if (code.countsAsAbsent) summary.absentToday++;
          if (code.countsAsTardy) summary.tardyToday++;
        }
      });

      summary.attendanceRate = summary.recordedToday > 0
        ? parseFloat(((summary.presentToday / summary.recordedToday) * 100).toFixed(1))
        : 0;

      res.json(summary);
    } catch (error) {
      console.error('Error fetching attendance summary:', error);
      res.status(500).json({ message: 'Failed to fetch attendance summary' });
    }
  }
};