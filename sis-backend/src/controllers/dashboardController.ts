import { Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma';
import { startOfDay, endOfDay } from 'date-fns';

const prisma = new PrismaClient();

export const dashboardController = {
  // Get dashboard stats based on user role
  async getDashboardStats(req: Request, res: Response): Promise<Response> {
    try {
      const user = (req as any).user;
      const today = new Date();
      const startOfToday = startOfDay(today);
      const endOfToday = endOfDay(today);

      let stats = {};

      switch (user.role) {
        case 'ADMIN':
          const [totalStudents, totalStaff, activeCourses, todayAttendance] = await Promise.all([
            prisma.student.count({ where: { enrollmentStatus: 'Active' } }),
            prisma.staff.count(),
            prisma.course.count(),
            prisma.attendance.findMany({
              where: {
                date: {
                  gte: startOfToday,
                  lte: endOfToday
                }
              }
            })
          ]);

          const presentCount = todayAttendance.filter((a: any) => a.attendanceCode === 'PRESENT').length;
          const attendanceRate = todayAttendance.length > 0 
            ? ((presentCount / todayAttendance.length) * 100).toFixed(1)
            : '0';

          stats = {
            totalStudents,
            totalStaff,
            attendanceToday: `${attendanceRate}%`,
            activeCourses
          };
          break;

        case 'TEACHER':
          const teacher = await prisma.staff.findUnique({
            where: { userId: user.id },
            include: {
              courseSections: {
                include: {
                  enrollments: {
                    where: {
                      status: 'Active'
                    },
                    include: {
                      student: true
                    }
                  }
                }
              }
            }
          });

          if (!teacher) {
            return res.status(404).json({ message: 'Teacher profile not found' });
          }

          // Get unique students across all sections
          const studentIds = new Set<string>();
          teacher.courseSections.forEach((section: any) => {
            section.enrollments.forEach((enrollment: any) => {
              studentIds.add(enrollment.studentId);
            });
          });

          const todaySections = teacher.courseSections.length; // Simplified - would need schedule logic

          const [assignmentsDue, teacherAttendance] = await Promise.all([
            prisma.assignment.count({
              where: {
                courseSectionId: {
                  in: teacher.courseSections.map((s: any) => s.id)
                },
                dueDate: {
                  gte: today,
                  lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
                }
              }
            }),
            prisma.attendance.findMany({
              where: {
                courseSectionId: {
                  in: teacher.courseSections.map((s: any) => s.id)
                },
                date: {
                  gte: startOfToday,
                  lte: endOfToday
                }
              }
            })
          ]);

          const teacherPresentCount = teacherAttendance.filter((a: any) => a.attendanceCode === 'PRESENT').length;
          const teacherAttendanceRate = teacherAttendance.length > 0
            ? ((teacherPresentCount / teacherAttendance.length) * 100).toFixed(1)
            : '0';

          stats = {
            myStudents: studentIds.size,
            classesToday: todaySections,
            assignmentsDue,
            attendanceRate: `${teacherAttendanceRate}%`
          };
          break;

        case 'PARENT':
          const parent = await prisma.parent.findUnique({
            where: { userId: user.id },
            include: {
              studentParents: {
                include: {
                  student: {
                    include: {
                      grades: true,
                      attendances: {
                        where: {
                          date: {
                            gte: new Date(today.getFullYear(), today.getMonth(), 1) // Start of month
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          });

          if (!parent) {
            return res.status(404).json({ message: 'Parent profile not found' });
          }

          const children = parent.studentParents.map((sp: any) => sp.student);
          
          // Calculate average attendance
          const totalAttendances = children.reduce((acc: number, child: any) => acc + child.attendances.length, 0);
          const totalPresent = children.reduce((acc: number, child: any) =>
            acc + child.attendances.filter((a: any) => a.attendanceCode === 'PRESENT').length, 0
          );
          const parentAttendanceRate = totalAttendances > 0
            ? ((totalPresent / totalAttendances) * 100).toFixed(0)
            : '0';

          // Calculate average grade (simplified)
          const allGrades = children.flatMap((child: any) => child.grades);
          const avgGrade = allGrades.length > 0
            ? (allGrades.reduce((acc: number, g: any) => acc + (g.gradePercent || 0), 0) / allGrades.length)
            : 0;

          const gradeToLetter = (percent: number) => {
            if (percent >= 93) return 'A';
            if (percent >= 90) return 'A-';
            if (percent >= 87) return 'B+';
            if (percent >= 83) return 'B';
            if (percent >= 80) return 'B-';
            if (percent >= 77) return 'C+';
            if (percent >= 73) return 'C';
            if (percent >= 70) return 'C-';
            if (percent >= 67) return 'D+';
            if (percent >= 63) return 'D';
            if (percent >= 60) return 'D-';
            return 'F';
          };

          stats = {
            myChildren: children.length,
            attendanceRate: `${parentAttendanceRate}%`,
            upcomingEvents: 3, // Placeholder - would need events system
            averageGrade: gradeToLetter(avgGrade)
          };
          break;

        case 'STUDENT':
          const student = await prisma.student.findUnique({
            where: { userId: user.id },
            include: {
              enrollments: {
                where: {
                  status: 'Active',
                  courseSectionId: {
                    not: null
                  }
                },
                include: {
                  courseSection: {
                    include: {
                      course: true,
                      assignments: {
                        where: {
                          dueDate: {
                            gte: today,
                            lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
                          }
                        }
                      }
                    }
                  }
                }
              },
              attendances: {
                where: {
                  date: {
                    gte: new Date(today.getFullYear(), today.getMonth(), 1)
                  }
                }
              },
              grades: {
                include: {
                  assignment: true
                }
              }
            }
          });

          if (!student) {
            return res.status(404).json({ message: 'Student profile not found' });
          }

          const studentPresentCount = student.attendances.filter((a: any) => a.attendanceCode === 'PRESENT').length;
          const studentAttendanceRate = student.attendances.length > 0
            ? ((studentPresentCount / student.attendances.length) * 100).toFixed(0)
            : '0';

          // Calculate GPA (simplified)
          const courseGrades = student.grades.filter((g: any) => g.gradePercent !== null);
          const gpa = courseGrades.length > 0
            ? (courseGrades.reduce((acc: number, g: any) => {
                const gradePoint = (g.gradePercent || 0) / 25; // Simplified 4.0 scale
                return acc + gradePoint;
              }, 0) / courseGrades.length).toFixed(1)
            : '0.0';

          // Count assignments due
          let totalAssignmentsDue = 0;
          student.enrollments.forEach((enrollment: any) => {
            if (enrollment.courseSection && enrollment.courseSection.assignments) {
              totalAssignmentsDue += enrollment.courseSection.assignments.length;
            }
          });

          stats = {
            myCourses: student.enrollments.length,
            attendance: `${studentAttendanceRate}%`,
            currentGPA: gpa,
            assignmentsDue: totalAssignmentsDue
          };
          break;

        default:
          return res.status(403).json({ message: 'Invalid user role' });
      }

      return res.json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
    }
  },

  // Get recent announcements
  async getAnnouncements(req: Request, res: Response): Promise<Response> {
    try {
      // This would need an Announcement model in the database
      // For now, returning static data
      const announcements = [
        {
          id: '1',
          title: 'School Holiday - Presidents Day',
          content: 'School will be closed for Presidents Day',
          date: new Date('2024-02-19'),
          priority: 'normal'
        },
        {
          id: '2',
          title: 'Parent-Teacher Conferences',
          content: 'Sign up for your conference slot',
          date: new Date('2024-02-23'),
          priority: 'high'
        },
        {
          id: '3',
          title: 'Spring Break Reminder',
          content: 'Have a safe and enjoyable break!',
          date: new Date('2024-03-11'),
          priority: 'normal'
        }
      ];

      return res.json(announcements);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      return res.status(500).json({ message: 'Failed to fetch announcements' });
    }
  },

  // Get upcoming events for user
  async getUpcomingEvents(req: Request, res: Response): Promise<Response> {
    try {
      const user = (req as any).user;
      
      // This would need an Event model and logic based on user role
      // For now, returning role-specific placeholder data
      let events: any[] = [];

      switch (user.role) {
        case 'TEACHER':
        case 'ADMIN':
          events = [
            {
              id: '1',
              title: 'Staff Meeting',
              date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
              type: 'meeting'
            },
            {
              id: '2',
              title: 'Grade Submission Deadline',
              date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
              type: 'deadline'
            }
          ];
          break;
        
        case 'PARENT':
        case 'STUDENT':
          events = [
            {
              id: '1',
              title: 'Science Fair',
              date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              type: 'event'
            },
            {
              id: '2',
              title: 'End of Quarter',
              date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
              type: 'academic'
            }
          ];
          break;
      }

      return res.json(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      return res.status(500).json({ message: 'Failed to fetch upcoming events' });
    }
  }
};