import type { Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

export const courseSectionController = {
  // Get all course sections
  async getAllSections(req: Request, res: Response) {
    try {
      const sections = await prisma.courseSection.findMany({
        include: {
          course: true,
          teacher: true,
          session: true,
          _count: {
            select: { enrollments: true }
          }
        }
      });
      res.json(sections);
    } catch (error) {
      console.error('Error fetching course sections:', error);
      res.status(500).json({ error: 'Failed to fetch course sections' });
    }
  },

  // Get sections for a specific teacher
  async getTeacherSections(req: Request, res: Response) {
    try {
      const { teacherId } = req.params;
      
      // First check if this is a user ID and find the teacher
      const teacher = await prisma.staff.findFirst({
        where: {
          OR: [
            { id: teacherId },
            { userId: teacherId }
          ]
        }
      });

      if (!teacher) {
        res.status(404).json({ error: 'Teacher not found' });
        return;
      }

      const sections = await prisma.courseSection.findMany({
        where: { teacherId: teacher.id },
        include: {
          course: true,
          session: true,
          _count: {
            select: { enrollments: true }
          }
        }
      });

      res.json(sections);
    } catch (error) {
      console.error('Error fetching teacher sections:', error);
      res.status(500).json({ error: 'Failed to fetch teacher sections' });
    }
  },

  // Get sections for a specific student
  async getStudentSections(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      
      const enrollments = await prisma.enrollment.findMany({
        where: { 
          studentId,
          status: 'Active'
        },
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

      const sections = enrollments.map(e => e.courseSection).filter(Boolean);
      res.json(sections);
    } catch (error) {
      console.error('Error fetching student sections:', error);
      res.status(500).json({ error: 'Failed to fetch student sections' });
    }
  },

  // Get a specific section
  async getSection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const section = await prisma.courseSection.findUnique({
        where: { id },
        include: {
          course: true,
          teacher: true,
          session: true,
          enrollments: {
            include: {
              student: true
            }
          },
          _count: {
            select: { 
              enrollments: true,
              assignments: true
            }
          }
        }
      });

      if (!section) {
        res.status(404).json({ error: 'Section not found' });
        return;
      }

      res.json(section);
    } catch (error) {
      console.error('Error fetching section:', error);
      res.status(500).json({ error: 'Failed to fetch section' });
    }
  },

  // Create a new section
  async createSection(req: Request, res: Response) {
    try {
      const {
        courseId,
        schoolId,
        sessionId,
        sectionIdentifier,
        teacherId,
        roomNumber,
        period,
        time,
        days,
        maxStudents
      } = req.body;

      const section = await prisma.courseSection.create({
        data: {
          courseId,
          schoolId,
          sessionId,
          sectionIdentifier,
          teacherId,
          roomNumber,
          period,
          time,
          days,
          maxStudents,
          currentEnrollment: 0
        },
        include: {
          course: true,
          teacher: true,
          session: true
        }
      });

      res.status(201).json(section);
    } catch (error) {
      console.error('Error creating section:', error);
      res.status(500).json({ error: 'Failed to create section' });
    }
  },

  // Update a section
  async updateSection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const section = await prisma.courseSection.update({
        where: { id },
        data: updates,
        include: {
          course: true,
          teacher: true,
          session: true
        }
      });

      res.json(section);
    } catch (error) {
      console.error('Error updating section:', error);
      res.status(500).json({ error: 'Failed to update section' });
    }
  },

  // Delete a section
  async deleteSection(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if there are enrollments
      const enrollmentCount = await prisma.enrollment.count({
        where: { courseSectionId: id }
      });

      if (enrollmentCount > 0) {
        res.status(400).json({ 
          error: 'Cannot delete section with active enrollments' 
        });
        return;
      }

      await prisma.courseSection.delete({
        where: { id }
      });

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting section:', error);
      res.status(500).json({ error: 'Failed to delete section' });
    }
  },

  // Get section enrollment
  async getSectionEnrollment(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const enrollments = await prisma.enrollment.findMany({
        where: { 
          courseSectionId: id,
          status: 'Active'
        },
        include: {
          student: true
        }
      });

      res.json(enrollments);
    } catch (error) {
      console.error('Error fetching section enrollment:', error);
      res.status(500).json({ error: 'Failed to fetch section enrollment' });
    }
  }
};