import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const studentController = {
  // List all students with pagination and search
  async listStudents(req: Request, res: Response) {
    try {
      const { 
        q, // search query
        limit = 10, 
        offset = 0,
        gradeLevel,
        enrollmentStatus = 'Active'
      } = req.query;

      const where: any = {
        enrollmentStatus,
      };

      // Search by name or student ID
      if (q) {
        where.OR = [
          { firstName: { contains: q as string, mode: 'insensitive' } },
          { lastName: { contains: q as string, mode: 'insensitive' } },
          { studentUniqueId: { contains: q as string, mode: 'insensitive' } },
        ];
      }

      if (gradeLevel) {
        where.gradeLevel = gradeLevel;
      }

      const [students, totalCount] = await Promise.all([
        prisma.student.findMany({
          where,
          skip: Number(offset),
          take: Number(limit),
          include: {
            user: {
              select: {
                email: true,
                isActive: true,
              },
            },
            enrollments: {
              where: { status: 'Active' },
              include: {
                homeroom: {
                  include: {
                    teacher: {
                      select: {
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: [
            { lastName: 'asc' },
            { firstName: 'asc' },
          ],
        }),
        prisma.student.count({ where }),
      ]);

      // Transform data to match frontend expectations
      const transformedStudents = students.map(student => ({
        id: student.id,
        studentUniqueId: student.studentUniqueId,
        firstName: student.firstName,
        lastName: student.lastName,
        lastSurname: student.lastName, // Include both for compatibility
        middleName: student.middleName,
        birthDate: student.birthDate,
        birthSex: student.gender,
        gradeLevel: student.gradeLevel,
        enrollmentDate: student.enrollmentDate,
        enrollmentStatus: student.enrollmentStatus,
        email: student.email || student.user?.email,
        phone: student.phone,
        address: student.address,
        city: student.city,
        state: student.state,
        zipCode: student.zipCode,
        homeroom: student.enrollments[0]?.homeroom ? {
          name: student.enrollments[0].homeroom.name,
          teacher: `${student.enrollments[0].homeroom.teacher.firstName} ${student.enrollments[0].homeroom.teacher.lastName}`,
        } : null,
      }));

      res.json({
        students: transformedStudents,
        totalCount,
      });
    } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({ message: 'Failed to fetch students' });
    }
  },

  // Get single student by ID
  async getStudent(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const student = await prisma.student.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              email: true,
              isActive: true,
            },
          },
          studentParents: {
            include: {
              parent: {
                include: {
                  user: {
                    select: {
                      email: true,
                    },
                  },
                },
              },
            },
          },
          enrollments: {
            where: { status: 'Active' },
            include: {
              courseSection: {
                include: {
                  course: true,
                  teacher: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
              homeroom: {
                include: {
                  teacher: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
          attendances: {
            orderBy: { date: 'desc' },
            take: 10,
          },
          grades: {
            include: {
              courseSection: {
                include: {
                  course: true,
                },
              },
              assignment: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
      });

      if (!student) {
        res.status(404).json({ message: 'Student not found' });
        return;
      }

      // Transform to match frontend expectations
      const transformed = {
        id: student.id,
        studentUniqueId: student.studentUniqueId,
        firstName: student.firstName,
        lastName: student.lastName,
        lastSurname: student.lastName, // Include both for compatibility
        middleName: student.middleName,
        birthDate: student.birthDate,
        birthSex: student.gender,
        gender: student.gender,
        ethnicity: student.ethnicity,
        gradeLevel: student.gradeLevel,
        enrollmentDate: student.enrollmentDate,
        enrollmentStatus: student.enrollmentStatus,
        email: student.email || student.user?.email,
        phone: student.phone,
        address: student.address,
        city: student.city,
        state: student.state,
        zipCode: student.zipCode,
        emergencyContact: {
          name: student.emergencyContactName,
          phone: student.emergencyContactPhone,
          relationship: student.emergencyContactRelation,
        },
        medical: {
          conditions: student.medicalConditions,
          medications: student.medications,
          allergies: student.allergies,
          instructions: student.emergencyMedicalInstructions,
        },
        parents: student.studentParents.map(sp => ({
          id: sp.parent.id,
          name: `${sp.parent.firstName} ${sp.parent.lastName}`,
          email: sp.parent.email || sp.parent.user?.email,
          phone: sp.parent.phone,
          relationship: sp.relationship,
          isPrimary: sp.isPrimary,
        })),
        enrollments: student.enrollments,
        recentAttendance: student.attendances,
        recentGrades: student.grades,
      };

      res.json(transformed);
    } catch (error) {
      console.error('Error fetching student:', error);
      res.status(500).json({ message: 'Failed to fetch student' });
    }
  },

  // Create new student
  async createStudent(req: AuthRequest, res: Response) {
    try {
      const studentData = req.body;

      // Generate unique student ID
      const studentCount = await prisma.student.count();
      const studentUniqueId = `STU${String(studentCount + 1).padStart(6, '0')}`;

      // Map frontend field names to database field names
      const mappedData: any = {
        studentUniqueId,
        firstName: studentData.firstName,
        lastName: studentData.lastName || studentData.lastSurname,
        middleName: studentData.middleName,
        birthDate: new Date(studentData.birthDate),
        gender: studentData.gender || studentData.birthSex,
        ethnicity: studentData.ethnicity,
        gradeLevel: studentData.gradeLevel,
        enrollmentStatus: studentData.enrollmentStatus || 'Active',
        email: studentData.email,
        phone: studentData.phone,
        address: studentData.address,
        city: studentData.city,
        state: studentData.state,
        zipCode: studentData.zipCode,
        emergencyContactName: studentData.emergencyContactName,
        emergencyContactPhone: studentData.emergencyContactPhone,
        emergencyContactRelation: studentData.emergencyContactRelation,
        medicalConditions: studentData.medicalConditions,
        medications: studentData.medications,
        allergies: studentData.allergies,
        emergencyMedicalInstructions: studentData.emergencyMedicalInstructions,
      };

      const student = await prisma.student.create({
        data: mappedData,
      });

      res.status(201).json(student);
    } catch (error) {
      console.error('Error creating student:', error);
      res.status(500).json({ message: 'Failed to create student' });
    }
  },

  // Update student
  async updateStudent(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Map frontend field names to database field names
      const mappedData: any = {};
      
      if (updateData.firstName !== undefined) mappedData.firstName = updateData.firstName;
      if (updateData.lastName !== undefined) mappedData.lastName = updateData.lastName || updateData.lastSurname;
      if (updateData.middleName !== undefined) mappedData.middleName = updateData.middleName;
      if (updateData.birthDate !== undefined) mappedData.birthDate = new Date(updateData.birthDate);
      if (updateData.gender !== undefined || updateData.birthSex !== undefined) {
        mappedData.gender = updateData.gender || updateData.birthSex;
      }
      if (updateData.ethnicity !== undefined) mappedData.ethnicity = updateData.ethnicity;
      if (updateData.gradeLevel !== undefined) mappedData.gradeLevel = updateData.gradeLevel;
      if (updateData.enrollmentStatus !== undefined) mappedData.enrollmentStatus = updateData.enrollmentStatus;
      if (updateData.email !== undefined) mappedData.email = updateData.email;
      if (updateData.phone !== undefined) mappedData.phone = updateData.phone;
      if (updateData.address !== undefined) mappedData.address = updateData.address;
      if (updateData.city !== undefined) mappedData.city = updateData.city;
      if (updateData.state !== undefined) mappedData.state = updateData.state;
      if (updateData.zipCode !== undefined) mappedData.zipCode = updateData.zipCode;
      if (updateData.emergencyContactName !== undefined) mappedData.emergencyContactName = updateData.emergencyContactName;
      if (updateData.emergencyContactPhone !== undefined) mappedData.emergencyContactPhone = updateData.emergencyContactPhone;
      if (updateData.emergencyContactRelation !== undefined) mappedData.emergencyContactRelation = updateData.emergencyContactRelation;
      if (updateData.medicalConditions !== undefined) mappedData.medicalConditions = updateData.medicalConditions;
      if (updateData.medications !== undefined) mappedData.medications = updateData.medications;
      if (updateData.allergies !== undefined) mappedData.allergies = updateData.allergies;
      if (updateData.emergencyMedicalInstructions !== undefined) mappedData.emergencyMedicalInstructions = updateData.emergencyMedicalInstructions;

      const student = await prisma.student.update({
        where: { id },
        data: mappedData,
      });

      res.json(student);
    } catch (error) {
      console.error('Error updating student:', error);
      res.status(500).json({ message: 'Failed to update student' });
    }
  },

  // Delete student (soft delete by changing enrollment status)
  async deleteStudent(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      await prisma.student.update({
        where: { id },
        data: {
          enrollmentStatus: 'Inactive',
        },
      });

      res.json({ message: 'Student deactivated successfully' });
    } catch (error) {
      console.error('Error deleting student:', error);
      res.status(500).json({ message: 'Failed to delete student' });
    }
  },

  // Get student grades
  async getStudentGrades(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { courseSectionId, gradingPeriodId } = req.query;

      const where: any = { studentId: id };
      if (courseSectionId) where.courseSectionId = courseSectionId;
      if (gradingPeriodId) where.gradingPeriodId = gradingPeriodId;

      const grades = await prisma.grade.findMany({
        where,
        include: {
          courseSection: {
            include: {
              course: true,
              teacher: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          assignment: true,
          gradingPeriod: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(grades);
    } catch (error) {
      console.error('Error fetching student grades:', error);
      res.status(500).json({ message: 'Failed to fetch grades' });
    }
  },

  // Get student attendance
  async getStudentAttendance(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;

      const where: any = { studentId: id };
      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate as string);
        if (endDate) where.date.lte = new Date(endDate as string);
      }

      const attendance = await prisma.attendance.findMany({
        where,
        include: {
          courseSection: {
            include: {
              course: true,
            },
          },
        },
        orderBy: { date: 'desc' },
      });

      res.json(attendance);
    } catch (error) {
      console.error('Error fetching student attendance:', error);
      res.status(500).json({ message: 'Failed to fetch attendance' });
    }
  },

  // Get student enrollment history
  async getStudentEnrollmentHistory(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: id },
        include: {
          courseSection: {
            include: {
              course: true,
              teacher: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
              session: true,
            },
          },
          homeroom: {
            include: {
              school: true,
              teacher: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: { enrollmentDate: 'desc' },
      });

      // Group enrollments by school year/session
      const enrollmentHistory = enrollments.reduce((acc: any[], enrollment) => {
        const sessionName = enrollment.courseSection?.session?.name || 'Homeroom Only';
        const existingSession = acc.find(s => s.sessionName === sessionName);
        
        if (existingSession) {
          existingSession.enrollments.push(enrollment);
        } else {
          acc.push({
            sessionName,
            enrollments: [enrollment],
          });
        }
        
        return acc;
      }, []);

      res.json(enrollmentHistory);
    } catch (error) {
      console.error('Error fetching enrollment history:', error);
      res.status(500).json({ message: 'Failed to fetch enrollment history' });
    }
  },

  // Update student medical information
  async updateStudentMedicalInfo(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { conditions, medications, allergies, instructions } = req.body;

      const student = await prisma.student.update({
        where: { id },
        data: {
          medicalConditions: conditions,
          medications,
          allergies,
          emergencyMedicalInstructions: instructions,
        },
      });

      res.json({
        id: student.id,
        medical: {
          conditions: student.medicalConditions,
          medications: student.medications,
          allergies: student.allergies,
          instructions: student.emergencyMedicalInstructions,
        },
      });
    } catch (error) {
      console.error('Error updating medical information:', error);
      res.status(500).json({ message: 'Failed to update medical information' });
    }
  },

  // Update student emergency contacts
  async updateStudentEmergencyContact(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, phone, relationship } = req.body;

      const student = await prisma.student.update({
        where: { id },
        data: {
          emergencyContactName: name,
          emergencyContactPhone: phone,
          emergencyContactRelation: relationship,
        },
      });

      res.json({
        id: student.id,
        emergencyContact: {
          name: student.emergencyContactName,
          phone: student.emergencyContactPhone,
          relationship: student.emergencyContactRelation,
        },
      });
    } catch (error) {
      console.error('Error updating emergency contact:', error);
      res.status(500).json({ message: 'Failed to update emergency contact' });
    }
  },

  // Manage student-parent associations
  async addStudentParent(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { parentId, relationship, isPrimary, hasLegalCustody } = req.body;

      const studentParent = await prisma.studentParent.create({
        data: {
          studentId: id,
          parentId,
          relationship,
          isPrimary: isPrimary || false,
          hasLegalCustody: hasLegalCustody !== false,
        },
        include: {
          parent: {
            include: {
              user: {
                select: {
                  email: true,
                },
              },
            },
          },
        },
      });

      res.status(201).json(studentParent);
    } catch (error) {
      console.error('Error adding parent association:', error);
      res.status(500).json({ message: 'Failed to add parent association' });
    }
  },

  async removeStudentParent(req: AuthRequest, res: Response) {
    try {
      const { id, parentId } = req.params;

      await prisma.studentParent.delete({
        where: {
          studentId_parentId: {
            studentId: id,
            parentId,
          },
        },
      });

      res.json({ message: 'Parent association removed successfully' });
    } catch (error) {
      console.error('Error removing parent association:', error);
      res.status(500).json({ message: 'Failed to remove parent association' });
    }
  },

  // Advanced search with multiple filters
  async searchStudents(req: Request, res: Response) {
    try {
      const {
        q,
        gradeLevel,
        enrollmentStatus,
        homeroom,
        hasIEP,
        ethnicity,
        gender,
        limit = 50,
        offset = 0,
      } = req.query;

      const where: any = {};

      if (q) {
        where.OR = [
          { firstName: { contains: q as string, mode: 'insensitive' } },
          { lastName: { contains: q as string, mode: 'insensitive' } },
          { studentUniqueId: { contains: q as string, mode: 'insensitive' } },
          { email: { contains: q as string, mode: 'insensitive' } },
        ];
      }

      if (gradeLevel) where.gradeLevel = gradeLevel;
      if (enrollmentStatus) where.enrollmentStatus = enrollmentStatus;
      if (ethnicity) where.ethnicity = ethnicity;
      if (gender) where.gender = gender;

      if (homeroom) {
        where.enrollments = {
          some: {
            homeroomId: homeroom,
            status: 'Active',
          },
        };
      }

      const [students, totalCount] = await Promise.all([
        prisma.student.findMany({
          where,
          skip: Number(offset),
          take: Number(limit),
          include: {
            customFields: {
              include: {
                field: true,
              },
            },
            enrollments: {
              where: { status: 'Active' },
              include: {
                homeroom: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: [
            { lastName: 'asc' },
            { firstName: 'asc' },
          ],
        }),
        prisma.student.count({ where }),
      ]);

      // Transform students to include both lastName and lastSurname
      const transformedStudents = students.map(student => ({
        ...student,
        lastSurname: student.lastName, // Add lastSurname for frontend compatibility
      }));

      res.json({
        students: transformedStudents,
        totalCount,
        hasMore: Number(offset) + students.length < totalCount,
      });
    } catch (error) {
      console.error('Error searching students:', error);
      res.status(500).json({ message: 'Failed to search students' });
    }
  },
};