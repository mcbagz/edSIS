import { Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

// Get all courses
export const getCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { schoolId, gradeLevel, department, search } = req.query;
    
    const where: any = {};
    
    if (schoolId) {
      where.schoolId = schoolId as string;
    }
    
    if (gradeLevel) {
      where.gradeLevel = { has: gradeLevel as string };
    }
    
    if (department) {
      where.department = department as string;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { courseCode: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    
    const courses = await prisma.course.findMany({
      where,
      include: {
        school: true,
        _count: {
          select: { courseSections: true }
        }
      },
      orderBy: { courseCode: 'asc' }
    });
    
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};

// Get single course
export const getCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        school: true,
        courseSections: {
          include: {
            teacher: true,
            session: true,
            _count: {
              select: { enrollments: true }
            }
          }
        }
      }
    });
    
    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }
    
    res.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
};

// Create course
export const createCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      schoolId,
      courseCode,
      name,
      description,
      credits,
      department,
      gradeLevel,
      prerequisites,
      capacity
    } = req.body;
    
    // Check if course code already exists
    const existingCourse = await prisma.course.findUnique({
      where: { courseCode }
    });
    
    if (existingCourse) {
      res.status(400).json({ error: 'Course code already exists' });
      return;
    }
    
    const course = await prisma.course.create({
      data: {
        schoolId,
        courseCode,
        name,
        description,
        credits: credits || 1.0,
        department,
        gradeLevel: gradeLevel || [],
        prerequisites: prerequisites || [],
        capacity
      },
      include: {
        school: true
      }
    });
    
    res.status(201).json(course);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
};

// Update course
export const updateCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // If updating course code, check uniqueness
    if (updateData.courseCode) {
      const existingCourse = await prisma.course.findFirst({
        where: {
          courseCode: updateData.courseCode,
          NOT: { id }
        }
      });
      
      if (existingCourse) {
        res.status(400).json({ error: 'Course code already exists' });
        return;
      }
    }
    
    const course = await prisma.course.update({
      where: { id },
      data: updateData,
      include: {
        school: true
      }
    });
    
    res.json(course);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
};

// Delete course
export const deleteCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Check if course has sections
    const sectionsCount = await prisma.courseSection.count({
      where: { courseId: id }
    });
    
    if (sectionsCount > 0) {
      res.status(400).json({ 
        error: 'Cannot delete course with existing sections. Please delete all sections first.' 
      });
      return;
    }
    
    await prisma.course.delete({
      where: { id }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
};

// Get course sections
export const getCourseSections = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId, sessionId, teacherId, schoolId } = req.query;
    
    const where: any = {};
    
    if (courseId) where.courseId = courseId as string;
    if (sessionId) where.sessionId = sessionId as string;
    if (teacherId) where.teacherId = teacherId as string;
    if (schoolId) where.schoolId = schoolId as string;
    
    const sections = await prisma.courseSection.findMany({
      where,
      include: {
        course: true,
        teacher: true,
        session: true,
        school: true,
        _count: {
          select: { enrollments: true }
        }
      },
      orderBy: [
        { course: { courseCode: 'asc' } },
        { sectionIdentifier: 'asc' }
      ]
    });
    
    res.json(sections);
  } catch (error) {
    console.error('Error fetching course sections:', error);
    res.status(500).json({ error: 'Failed to fetch course sections' });
  }
};

// Get single section
export const getCourseSection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const section = await prisma.courseSection.findUnique({
      where: { id },
      include: {
        course: true,
        teacher: true,
        session: true,
        school: true,
        enrollments: {
          include: {
            student: true
          }
        },
        _count: {
          select: { enrollments: true }
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
};

// Create course section
export const createCourseSection = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Creating section with body:', req.body);
    
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
    
    // Check if section identifier is unique for this course and session
    const existingSection = await prisma.courseSection.findFirst({
      where: {
        courseId,
        sessionId,
        sectionIdentifier
      }
    });
    
    if (existingSection) {
      res.status(400).json({ 
        error: 'Section identifier already exists for this course and session' 
      });
      return;
    }
    
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
        days: days || [],
        maxStudents,
        currentEnrollment: 0
      },
      include: {
        course: true,
        teacher: true,
        session: true,
        school: true
      }
    });
    
    res.status(201).json(section);
  } catch (error: any) {
    console.error('Error creating section:', error);
    
    // Provide more specific error messages
    if (error.code === 'P2003') {
      res.status(400).json({ 
        error: 'Invalid foreign key. Please ensure the course, school, session, and teacher exist.' 
      });
      return;
    }
    
    res.status(500).json({ 
      error: 'Failed to create section',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update course section
export const updateCourseSection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // If updating section identifier, check uniqueness
    if (updateData.sectionIdentifier) {
      const currentSection = await prisma.courseSection.findUnique({
        where: { id }
      });
      
      if (currentSection) {
        const existingSection = await prisma.courseSection.findFirst({
          where: {
            courseId: currentSection.courseId,
            sessionId: currentSection.sessionId,
            sectionIdentifier: updateData.sectionIdentifier,
            NOT: { id }
          }
        });
        
        if (existingSection) {
          res.status(400).json({ 
            error: 'Section identifier already exists for this course and session' 
          });
          return;
        }
      }
    }
    
    const section = await prisma.courseSection.update({
      where: { id },
      data: updateData,
      include: {
        course: true,
        teacher: true,
        session: true,
        school: true
      }
    });
    
    res.json(section);
  } catch (error) {
    console.error('Error updating section:', error);
    res.status(500).json({ error: 'Failed to update section' });
  }
};

// Delete course section
export const deleteCourseSection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Check if section has enrollments
    const enrollmentsCount = await prisma.enrollment.count({
      where: { courseSectionId: id }
    });
    
    if (enrollmentsCount > 0) {
      res.status(400).json({ 
        error: 'Cannot delete section with existing enrollments. Please remove all enrollments first.' 
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
};