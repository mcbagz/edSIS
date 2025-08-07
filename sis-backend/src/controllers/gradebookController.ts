import type { Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

export const gradebookController = {
  // Assignment endpoints
  async getAssignments(req: Request, res: Response) {
    try {
      const { courseSectionId } = req.params;
      const assignments = await prisma.assignment.findMany({
        where: { courseSectionId },
        orderBy: { dueDate: 'asc' }
      });
      res.json(assignments);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      res.status(500).json({ error: 'Failed to fetch assignments' });
    }
  },

  async getAssignment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const assignment = await prisma.assignment.findUnique({
        where: { id },
        include: {
          grades: {
            include: {
              student: true
            }
          }
        }
      });
      
      if (!assignment) {
        res.status(404).json({ error: 'Assignment not found' });
        return;
      }
      
      res.json(assignment);
    } catch (error) {
      console.error('Error fetching assignment:', error);
      res.status(500).json({ error: 'Failed to fetch assignment' });
    }
  },

  async createAssignment(req: Request, res: Response) {
    try {
      const {
        courseSectionId,
        title,
        description,
        type,
        dueDate,
        maxPoints,
        weight,
        category
      } = req.body;

      const assignment = await prisma.assignment.create({
        data: {
          courseSectionId,
          title,
          description,
          type,
          dueDate: new Date(dueDate),
          maxPoints,
          weight: weight || 1.0,
          category
        }
      });

      res.status(201).json(assignment);
    } catch (error) {
      console.error('Error creating assignment:', error);
      res.status(500).json({ error: 'Failed to create assignment' });
    }
  },

  async updateAssignment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        title,
        description,
        type,
        dueDate,
        maxPoints,
        weight,
        category
      } = req.body;

      const assignment = await prisma.assignment.update({
        where: { id },
        data: {
          title,
          description,
          type,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          maxPoints,
          weight,
          category
        }
      });

      res.json(assignment);
    } catch (error) {
      console.error('Error updating assignment:', error);
      res.status(500).json({ error: 'Failed to update assignment' });
    }
  },

  async deleteAssignment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Delete related grades first
      await prisma.grade.deleteMany({
        where: { assignmentId: id }
      });
      
      await prisma.assignment.delete({
        where: { id }
      });
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      res.status(500).json({ error: 'Failed to delete assignment' });
    }
  },

  // Grade endpoints
  async getGrades(req: Request, res: Response) {
    try {
      const { courseSectionId, studentId, assignmentId, gradingPeriodId } = req.query;
      
      const where: any = {};
      if (courseSectionId) where.courseSectionId = courseSectionId;
      if (studentId) where.studentId = studentId;
      if (assignmentId) where.assignmentId = assignmentId;
      if (gradingPeriodId) where.gradingPeriodId = gradingPeriodId;

      const grades = await prisma.grade.findMany({
        where,
        include: {
          student: true,
          assignment: true,
          gradingPeriod: true
        }
      });

      res.json(grades);
    } catch (error) {
      console.error('Error fetching grades:', error);
      res.status(500).json({ error: 'Failed to fetch grades' });
    }
  },

  async getStudentGrades(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      const { courseSectionId, gradingPeriodId } = req.query;
      
      const where: any = { studentId };
      if (courseSectionId) where.courseSectionId = courseSectionId;
      if (gradingPeriodId) where.gradingPeriodId = gradingPeriodId;

      const grades = await prisma.grade.findMany({
        where,
        include: {
          assignment: true,
          courseSection: {
            include: {
              course: true
            }
          },
          gradingPeriod: true
        }
      });

      res.json(grades);
    } catch (error) {
      console.error('Error fetching student grades:', error);
      res.status(500).json({ error: 'Failed to fetch student grades' });
    }
  },

  async createGrade(req: Request, res: Response) {
    try {
      const {
        studentId,
        courseSectionId,
        assignmentId,
        gradingPeriodId,
        gradeType,
        numericGrade,
        letterGrade,
        points,
        comment
      } = req.body;

      const grade = await prisma.grade.create({
        data: {
          studentId,
          courseSectionId,
          assignmentId,
          gradingPeriodId,
          gradeType: gradeType || 'Assignment',
          numericGrade,
          letterGrade,
          points,
          comment
        }
      });

      res.status(201).json(grade);
    } catch (error) {
      console.error('Error creating grade:', error);
      res.status(500).json({ error: 'Failed to create grade' });
    }
  },

  async updateGrade(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        numericGrade,
        letterGrade,
        points,
        comment
      } = req.body;

      const grade = await prisma.grade.update({
        where: { id },
        data: {
          numericGrade,
          letterGrade,
          points,
          comment
        }
      });

      res.json(grade);
    } catch (error) {
      console.error('Error updating grade:', error);
      res.status(500).json({ error: 'Failed to update grade' });
    }
  },

  async upsertGrade(req: Request, res: Response) {
    try {
      const {
        studentId,
        courseSectionId,
        assignmentId,
        numericGrade,
        letterGrade,
        points,
        comment
      } = req.body;

      const grade = await prisma.grade.upsert({
        where: {
          studentId_courseSectionId_assignmentId: {
            studentId,
            courseSectionId,
            assignmentId
          }
        },
        update: {
          numericGrade,
          letterGrade,
          points,
          comment
        },
        create: {
          studentId,
          courseSectionId,
          assignmentId,
          gradeType: 'Assignment',
          numericGrade,
          letterGrade,
          points,
          comment
        }
      });

      res.json(grade);
    } catch (error) {
      console.error('Error upserting grade:', error);
      res.status(500).json({ error: 'Failed to upsert grade' });
    }
  },

  async deleteGrade(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      await prisma.grade.delete({
        where: { id }
      });
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting grade:', error);
      res.status(500).json({ error: 'Failed to delete grade' });
    }
  },

  // Gradebook view for teachers
  async getGradebook(req: Request, res: Response) {
    try {
      const { courseSectionId } = req.params;
      
      // Get all students enrolled in this section
      const enrollments = await prisma.enrollment.findMany({
        where: { 
          courseSectionId,
          status: 'Active'
        },
        include: {
          student: true
        }
      });

      // Get all assignments for this section
      const assignments = await prisma.assignment.findMany({
        where: { courseSectionId },
        orderBy: { dueDate: 'asc' }
      });

      // Get all grades for this section
      const grades = await prisma.grade.findMany({
        where: { courseSectionId }
      });

      // Create a gradebook matrix
      const gradebook = enrollments.map(enrollment => {
        const studentGrades = grades.filter(g => g.studentId === enrollment.studentId);
        const gradesByAssignment: Record<string, any> = {};
        
        assignments.forEach(assignment => {
          const grade = studentGrades.find(g => g.assignmentId === assignment.id);
          gradesByAssignment[assignment.id] = grade || null;
        });

        return {
          student: enrollment.student,
          grades: gradesByAssignment
        };
      });

      res.json({
        assignments,
        students: gradebook
      });
    } catch (error) {
      console.error('Error fetching gradebook:', error);
      res.status(500).json({ error: 'Failed to fetch gradebook' });
    }
  },

  // Calculate weighted grades for a student in a course
  async calculateWeightedGrade(req: Request, res: Response) {
    try {
      const { studentId, courseSectionId } = req.params;
      const { gradingPeriodId } = req.query;

      const where: any = {
        studentId,
        courseSectionId,
        assignmentId: { not: null }
      };
      
      if (gradingPeriodId) {
        where.gradingPeriodId = gradingPeriodId;
      }

      const grades = await prisma.grade.findMany({
        where,
        include: {
          assignment: true
        }
      });

      // Group grades by category
      const gradesByCategory: Record<string, { earned: number; possible: number; weight: number }> = {};
      
      grades.forEach(grade => {
        if (!grade.assignment || !grade.points) return;
        
        const category = grade.assignment.category;
        if (!gradesByCategory[category]) {
          gradesByCategory[category] = {
            earned: 0,
            possible: 0,
            weight: grade.assignment.weight
          };
        }
        
        gradesByCategory[category].earned += grade.points;
        gradesByCategory[category].possible += grade.assignment.maxPoints;
      });

      // Calculate weighted average
      let totalWeightedScore = 0;
      let totalWeight = 0;

      Object.values(gradesByCategory).forEach(category => {
        if (category.possible > 0) {
          const categoryPercentage = (category.earned / category.possible) * 100;
          totalWeightedScore += categoryPercentage * category.weight;
          totalWeight += category.weight;
        }
      });

      const finalGrade = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
      const letterGrade = getLetterGrade(finalGrade);

      res.json({
        studentId,
        courseSectionId,
        numericGrade: finalGrade,
        letterGrade,
        gradesByCategory
      });
    } catch (error) {
      console.error('Error calculating weighted grade:', error);
      res.status(500).json({ error: 'Failed to calculate weighted grade' });
    }
  },

  // Report card generation
  async getReportCard(req: Request, res: Response) {
    try {
      const { studentId, gradingPeriodId } = req.params;

      // Get student info
      const student = await prisma.student.findUnique({
        where: { id: studentId }
      });

      if (!student) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      // Get all enrollments for the student
      const enrollments = await prisma.enrollment.findMany({
        where: { 
          studentId,
          status: 'Active'
        },
        include: {
          courseSection: {
            include: {
              course: true,
              teacher: true
            }
          }
        }
      });

      // Get grades for each course
      const courseGrades = await Promise.all(
        enrollments.map(async (enrollment) => {
          if (!enrollment.courseSectionId) return null;

          const grades = await prisma.grade.findMany({
            where: {
              studentId,
              courseSectionId: enrollment.courseSectionId,
              gradingPeriodId
            },
            include: {
              assignment: true
            }
          });

          // Calculate course grade
          const gradesByCategory: Record<string, { earned: number; possible: number }> = {};
          
          grades.forEach(grade => {
            if (!grade.assignment || !grade.points) return;
            
            const category = grade.assignment.category;
            if (!gradesByCategory[category]) {
              gradesByCategory[category] = { earned: 0, possible: 0 };
            }
            
            gradesByCategory[category].earned += grade.points;
            gradesByCategory[category].possible += grade.assignment.maxPoints;
          });

          let totalScore = 0;
          let totalPossible = 0;

          Object.values(gradesByCategory).forEach(category => {
            totalScore += category.earned;
            totalPossible += category.possible;
          });

          const percentage = totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0;
          const letterGrade = getLetterGrade(percentage);

          return {
            course: enrollment.courseSection?.course,
            teacher: enrollment.courseSection?.teacher,
            numericGrade: percentage,
            letterGrade
          };
        })
      );

      // Filter out null values
      const validCourseGrades = courseGrades.filter(cg => cg !== null);

      // Get grading period info
      const gradingPeriod = await prisma.gradingPeriod.findUnique({
        where: { id: gradingPeriodId }
      });

      res.json({
        student,
        gradingPeriod,
        courses: validCourseGrades,
        generatedAt: new Date()
      });
    } catch (error) {
      console.error('Error generating report card:', error);
      res.status(500).json({ error: 'Failed to generate report card' });
    }
  },

  // GPA calculation
  async calculateGPA(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      const { scale = '4.0' } = req.query;

      // Get all completed enrollments with grades
      const enrollments = await prisma.enrollment.findMany({
        where: {
          studentId,
          status: 'Completed'
        },
        include: {
          courseSection: {
            include: {
              course: true
            }
          }
        }
      });

      let totalQualityPoints = 0;
      let totalCredits = 0;

      for (const enrollment of enrollments) {
        if (!enrollment.courseSectionId || !enrollment.grade) continue;

        const course = enrollment.courseSection?.course;
        if (!course) continue;

        const gradePoints = getGradePoints(enrollment.grade, scale as string);
        const credits = course.credits;

        totalQualityPoints += gradePoints * credits;
        totalCredits += credits;
      }

      const gpa = totalCredits > 0 ? totalQualityPoints / totalCredits : 0;

      res.json({
        studentId,
        gpa: Math.round(gpa * 100) / 100, // Round to 2 decimal places
        totalCredits,
        totalQualityPoints,
        scale
      });
    } catch (error) {
      console.error('Error calculating GPA:', error);
      res.status(500).json({ error: 'Failed to calculate GPA' });
    }
  }
};

// Helper functions
function getLetterGrade(percentage: number): string {
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 67) return 'D+';
  if (percentage >= 63) return 'D';
  if (percentage >= 60) return 'D-';
  return 'F';
}

function getGradePoints(letterGrade: string, scale: string): number {
  const gradePointMap: Record<string, number> = {
    'A': 4.0,
    'A-': 3.7,
    'B+': 3.3,
    'B': 3.0,
    'B-': 2.7,
    'C+': 2.3,
    'C': 2.0,
    'C-': 1.7,
    'D+': 1.3,
    'D': 1.0,
    'D-': 0.7,
    'F': 0.0
  };

  if (scale === '5.0') {
    // Add 1 point for honors/AP courses (simplified)
    return (gradePointMap[letterGrade] || 0) + 1;
  }

  return gradePointMap[letterGrade] || 0;
}