import { Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Grade category configuration type
interface GradeCategory {
  name: string;
  weight: number;
}

// GPA scale configuration
interface GPAScale {
  grade: string;
  minPercent: number;
  maxPercent: number;
  gpa: number;
}

const defaultGPAScale: GPAScale[] = [
  { grade: 'A+', minPercent: 97, maxPercent: 100, gpa: 4.0 },
  { grade: 'A', minPercent: 93, maxPercent: 96.99, gpa: 4.0 },
  { grade: 'A-', minPercent: 90, maxPercent: 92.99, gpa: 3.7 },
  { grade: 'B+', minPercent: 87, maxPercent: 89.99, gpa: 3.3 },
  { grade: 'B', minPercent: 83, maxPercent: 86.99, gpa: 3.0 },
  { grade: 'B-', minPercent: 80, maxPercent: 82.99, gpa: 2.7 },
  { grade: 'C+', minPercent: 77, maxPercent: 79.99, gpa: 2.3 },
  { grade: 'C', minPercent: 73, maxPercent: 76.99, gpa: 2.0 },
  { grade: 'C-', minPercent: 70, maxPercent: 72.99, gpa: 1.7 },
  { grade: 'D+', minPercent: 67, maxPercent: 69.99, gpa: 1.3 },
  { grade: 'D', minPercent: 63, maxPercent: 66.99, gpa: 1.0 },
  { grade: 'D-', minPercent: 60, maxPercent: 62.99, gpa: 0.7 },
  { grade: 'F', minPercent: 0, maxPercent: 59.99, gpa: 0.0 },
];

export const gradebookController = {
  // Get or create gradebook configuration for a course section
  async getGradebookConfig(req: Request, res: Response) {
    try {
      const { courseSectionId } = req.params;

      // For now, store config in memory or as JSON in database
      // In production, this would be a separate GradebookConfig model
      const defaultCategories: GradeCategory[] = [
        { name: 'Tests', weight: 40 },
        { name: 'Quizzes', weight: 30 },
        { name: 'Homework', weight: 20 },
        { name: 'Participation', weight: 10 }
      ];

      res.json({
        courseSectionId,
        categories: defaultCategories,
        gradeScale: defaultGPAScale,
        allowExtraCredit: true,
        dropLowestScore: false
      });
    } catch (error) {
      console.error('Error fetching gradebook config:', error);
      res.status(500).json({ message: 'Failed to fetch gradebook configuration' });
    }
  },

  // Update gradebook configuration
  async updateGradebookConfig(req: AuthRequest, res: Response) {
    try {
      const { courseSectionId } = req.params;
      const { categories, allowExtraCredit, dropLowestScore } = req.body;

      // Validate that category weights sum to 100
      if (categories) {
        const totalWeight = categories.reduce((sum: number, cat: GradeCategory) => sum + cat.weight, 0);
        if (Math.abs(totalWeight - 100) > 0.01) {
          res.status(400).json({ message: 'Category weights must sum to 100%' });
          return;
        }
      }

      // In production, save to database
      res.json({
        courseSectionId,
        categories,
        gradeScale: defaultGPAScale,
        allowExtraCredit,
        dropLowestScore,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating gradebook config:', error);
      res.status(500).json({ message: 'Failed to update gradebook configuration' });
    }
  },

  // Calculate weighted grade for a student in a course
  async calculateWeightedGrade(req: Request, res: Response) {
    try {
      const { studentId, courseSectionId } = req.params;

      // Get all grades for the student in this course
      const grades = await prisma.grade.findMany({
        where: {
          studentId,
          courseSectionId,
          assignmentId: { not: null }
        },
        include: {
          assignment: true
        }
      });

      if (grades.length === 0) {
        res.json({
          studentId,
          courseSectionId,
          overallGrade: 0,
          letterGrade: 'N/A',
          gpa: 0,
          categoryBreakdown: []
        });
        return;
      }

      // Get gradebook config (simplified - using default categories)
      const categories: GradeCategory[] = [
        { name: 'Tests', weight: 40 },
        { name: 'Quizzes', weight: 30 },
        { name: 'Homework', weight: 20 },
        { name: 'Participation', weight: 10 }
      ];

      // Group grades by category
      const gradesByCategory = new Map<string, Array<{ points: number; maxPoints: number }>>();
      
      grades.forEach(grade => {
        if (!grade.assignment) return;
        
        const category = grade.assignment.category;
        if (!gradesByCategory.has(category)) {
          gradesByCategory.set(category, []);
        }
        
        gradesByCategory.get(category)!.push({
          points: grade.points || 0,
          maxPoints: grade.assignment.maxPoints
        });
      });

      // Calculate weighted grade
      let totalWeightedScore = 0;
      let totalWeightUsed = 0;
      const categoryBreakdown: any[] = [];

      categories.forEach(category => {
        const categoryGrades = gradesByCategory.get(category.name) || [];
        
        if (categoryGrades.length > 0) {
          const totalPoints = categoryGrades.reduce((sum, g) => sum + g.points, 0);
          const totalMaxPoints = categoryGrades.reduce((sum, g) => sum + g.maxPoints, 0);
          const categoryPercent = (totalPoints / totalMaxPoints) * 100;
          const weightedScore = (categoryPercent * category.weight) / 100;
          
          totalWeightedScore += weightedScore;
          totalWeightUsed += category.weight;
          
          categoryBreakdown.push({
            category: category.name,
            weight: category.weight,
            rawPercent: categoryPercent.toFixed(2),
            weightedPercent: weightedScore.toFixed(2),
            assignmentCount: categoryGrades.length
          });
        }
      });

      // Adjust for unused weight
      const overallGrade = totalWeightUsed > 0
        ? (totalWeightedScore / totalWeightUsed) * 100
        : 0;

      // Calculate letter grade and GPA
      const gradeInfo = defaultGPAScale.find(
        scale => overallGrade >= scale.minPercent && overallGrade <= scale.maxPercent
      );

      res.json({
        studentId,
        courseSectionId,
        overallGrade: overallGrade.toFixed(2),
        letterGrade: gradeInfo?.grade || 'F',
        gpa: gradeInfo?.gpa || 0,
        categoryBreakdown
      });
    } catch (error) {
      console.error('Error calculating weighted grade:', error);
      res.status(500).json({ message: 'Failed to calculate weighted grade' });
    }
  },

  // Calculate GPA for a student
  async calculateGPA(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      const { gradingPeriodId, cumulative } = req.query;

      // Get all final grades for the student
      const where: any = {
        studentId,
        gradeType: 'Final'
      };

      if (!cumulative && gradingPeriodId) {
        where.gradingPeriodId = gradingPeriodId;
      }

      const grades = await prisma.grade.findMany({
        where,
        include: {
          courseSection: {
            include: {
              course: true
            }
          }
        }
      });

      if (grades.length === 0) {
        res.json({
          studentId,
          gpa: 0,
          totalCredits: 0,
          totalGradePoints: 0,
          courses: []
        });
        return;
      }

      // Calculate GPA
      let totalGradePoints = 0;
      let totalCredits = 0;
      const courseGrades: any[] = [];

      grades.forEach(grade => {
        if (!grade.numericGrade || !grade.courseSection?.course) return;

        const credits = grade.courseSection.course.credits || 1;
        const gradeInfo = defaultGPAScale.find(
          scale => grade.numericGrade! >= scale.minPercent && grade.numericGrade! <= scale.maxPercent
        );

        if (gradeInfo) {
          const gradePoints = gradeInfo.gpa * credits;
          totalGradePoints += gradePoints;
          totalCredits += credits;

          courseGrades.push({
            courseName: grade.courseSection.course.name,
            courseCode: grade.courseSection.course.courseCode,
            credits,
            numericGrade: grade.numericGrade,
            letterGrade: gradeInfo.grade,
            gradePoints: gradeInfo.gpa,
            weightedPoints: gradePoints
          });
        }
      });

      const gpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;

      res.json({
        studentId,
        gpa: gpa.toFixed(3),
        totalCredits: totalCredits.toFixed(1),
        totalGradePoints: totalGradePoints.toFixed(2),
        gradingPeriod: gradingPeriodId || 'cumulative',
        courses: courseGrades
      });
    } catch (error) {
      console.error('Error calculating GPA:', error);
      res.status(500).json({ message: 'Failed to calculate GPA' });
    }
  },

  // Generate student transcript
  async generateTranscript(req: Request, res: Response) {
    try {
      const { studentId } = req.params;

      // Get student information
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          enrollments: {
            include: {
              courseSection: {
                include: {
                  course: true,
                  session: true
                }
              }
            }
          },
          grades: {
            where: {
              gradeType: 'Final'
            },
            include: {
              courseSection: {
                include: {
                  course: true,
                  session: true
                }
              },
              gradingPeriod: true
            }
          }
        }
      });

      if (!student) {
        res.status(404).json({ message: 'Student not found' });
        return;
      }

      // Get school information
      const school = await prisma.school.findFirst();

      // Group grades by session/year
      const gradesBySession = new Map<string, any[]>();
      
      student.grades.forEach(grade => {
        const sessionName = grade.courseSection?.session?.name || 'Unknown Session';
        
        if (!gradesBySession.has(sessionName)) {
          gradesBySession.set(sessionName, []);
        }
        
        gradesBySession.get(sessionName)!.push({
          courseCode: grade.courseSection?.course?.courseCode,
          courseName: grade.courseSection?.course?.name,
          credits: grade.courseSection?.course?.credits || 1,
          numericGrade: grade.numericGrade,
          letterGrade: grade.letterGrade,
          gradePoints: this.calculateGradePoints(grade.numericGrade || 0)
        });
      });

      // Calculate cumulative GPA
      let totalGradePoints = 0;
      let totalCredits = 0;
      
      const academicRecord: any[] = [];
      
      gradesBySession.forEach((grades, session) => {
        let sessionGradePoints = 0;
        let sessionCredits = 0;
        
        grades.forEach(grade => {
          const gradePoint = this.calculateGradePoints(grade.numericGrade || 0);
          const weightedPoints = gradePoint * grade.credits;
          
          sessionGradePoints += weightedPoints;
          sessionCredits += grade.credits;
          totalGradePoints += weightedPoints;
          totalCredits += grade.credits;
        });
        
        const sessionGPA = sessionCredits > 0 ? sessionGradePoints / sessionCredits : 0;
        
        academicRecord.push({
          session,
          courses: grades,
          sessionGPA: sessionGPA.toFixed(3),
          sessionCredits: sessionCredits
        });
      });

      const cumulativeGPA = totalCredits > 0 ? totalGradePoints / totalCredits : 0;

      // Generate transcript object
      const transcript = {
        student: {
          id: student.id,
          studentUniqueId: student.studentUniqueId,
          name: `${student.firstName} ${student.lastName}`,
          birthDate: student.birthDate,
          gradeLevel: student.gradeLevel,
          enrollmentDate: student.enrollmentDate
        },
        school: {
          name: school?.name || 'School Name',
          address: school?.address,
          city: school?.city,
          state: school?.state,
          zipCode: school?.zipCode,
          phone: school?.phone
        },
        academicRecord,
        summary: {
          cumulativeGPA: cumulativeGPA.toFixed(3),
          totalCreditsEarned: totalCredits.toFixed(1),
          classRank: 'N/A', // Would need to calculate based on all students
          graduationDate: 'N/A'
        },
        generatedDate: new Date(),
        official: false // Would need digital signature for official transcript
      };

      res.json(transcript);
    } catch (error) {
      console.error('Error generating transcript:', error);
      res.status(500).json({ message: 'Failed to generate transcript' });
    }
  },

  // Helper function to calculate grade points
  calculateGradePoints(numericGrade: number): number {
    const gradeInfo = defaultGPAScale.find(
      scale => numericGrade >= scale.minPercent && numericGrade <= scale.maxPercent
    );
    return gradeInfo?.gpa || 0;
  },

  // Bulk grade entry
  async bulkGradeEntry(req: AuthRequest, res: Response) {
    try {
      const { assignmentId, grades } = req.body;

      // Validate assignment exists
      const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId }
      });

      if (!assignment) {
        res.status(404).json({ message: 'Assignment not found' });
        return;
      }

      // Process grades in transaction
      const results = await prisma.$transaction(
        grades.map((grade: any) =>
          prisma.grade.upsert({
            where: {
              studentId_courseSectionId_assignmentId: {
                studentId: grade.studentId,
                courseSectionId: assignment.courseSectionId,
                assignmentId
              }
            },
            update: {
              points: grade.points,
              numericGrade: (grade.points / assignment.maxPoints) * 100,
              letterGrade: this.getLetterGrade((grade.points / assignment.maxPoints) * 100),
              comment: grade.comment
            },
            create: {
              studentId: grade.studentId,
              courseSectionId: assignment.courseSectionId,
              assignmentId,
              gradeType: 'Assignment',
              points: grade.points,
              numericGrade: (grade.points / assignment.maxPoints) * 100,
              letterGrade: this.getLetterGrade((grade.points / assignment.maxPoints) * 100),
              comment: grade.comment
            }
          })
        )
      );

      res.json({
        message: 'Grades entered successfully',
        gradesProcessed: results.length
      });
    } catch (error) {
      console.error('Error with bulk grade entry:', error);
      res.status(500).json({ message: 'Failed to enter grades' });
    }
  },

  // Helper function to get letter grade
  getLetterGrade(numericGrade: number): string {
    const gradeInfo = defaultGPAScale.find(
      scale => numericGrade >= scale.minPercent && numericGrade <= scale.maxPercent
    );
    return gradeInfo?.grade || 'F';
  },

  // Get grade distribution for a course
  async getGradeDistribution(req: Request, res: Response) {
    try {
      const { courseSectionId } = req.params;

      const grades = await prisma.grade.findMany({
        where: {
          courseSectionId,
          gradeType: 'Final'
        }
      });

      // Calculate distribution
      const distribution: Record<string, number> = {
        'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0
      };

      grades.forEach(grade => {
        if (grade.letterGrade) {
          const baseGrade = grade.letterGrade[0]; // Get first letter (A, B, C, D, F)
          if (baseGrade in distribution) {
            distribution[baseGrade]++;
          }
        }
      });

      // Calculate statistics
      const numericGrades = grades
        .filter(g => g.numericGrade !== null)
        .map(g => g.numericGrade!);

      const average = numericGrades.length > 0
        ? numericGrades.reduce((sum, g) => sum + g, 0) / numericGrades.length
        : 0;

      const median = numericGrades.length > 0
        ? numericGrades.sort((a, b) => a - b)[Math.floor(numericGrades.length / 2)]
        : 0;

      res.json({
        courseSectionId,
        totalStudents: grades.length,
        distribution,
        statistics: {
          average: average.toFixed(2),
          median: median.toFixed(2),
          highest: Math.max(...numericGrades, 0).toFixed(2),
          lowest: Math.min(...numericGrades, 100).toFixed(2)
        }
      });
    } catch (error) {
      console.error('Error getting grade distribution:', error);
      res.status(500).json({ message: 'Failed to get grade distribution' });
    }
  },

  // Generate progress report
  async generateProgressReport(req: Request, res: Response) {
    try {
      const { studentId, gradingPeriodId } = req.params;

      // Get student information
      const student = await prisma.student.findUnique({
        where: { id: studentId }
      });

      if (!student) {
        res.status(404).json({ message: 'Student not found' });
        return;
      }

      // Get grades for the grading period
      const grades = await prisma.grade.findMany({
        where: {
          studentId,
          gradingPeriodId
        },
        include: {
          courseSection: {
            include: {
              course: true,
              teacher: true
            }
          },
          assignment: true
        }
      });

      // Group grades by course
      const courseProgress = new Map<string, any>();

      grades.forEach(grade => {
        const courseId = grade.courseSectionId;
        
        if (!courseProgress.has(courseId)) {
          courseProgress.set(courseId, {
            course: grade.courseSection?.course,
            teacher: grade.courseSection?.teacher,
            assignments: [],
            overallGrade: 0,
            letterGrade: 'N/A'
          });
        }
        
        const progress = courseProgress.get(courseId);
        if (grade.assignment) {
          progress.assignments.push({
            title: grade.assignment.title,
            type: grade.assignment.type,
            dueDate: grade.assignment.dueDate,
            points: grade.points,
            maxPoints: grade.assignment.maxPoints,
            percentage: grade.numericGrade
          });
        }
      });

      // Calculate overall grades for each course
      courseProgress.forEach((progress, courseId) => {
        const assignments = progress.assignments;
        if (assignments.length > 0) {
          const totalPoints = assignments.reduce((sum: number, a: any) => sum + (a.points || 0), 0);
          const totalMaxPoints = assignments.reduce((sum: number, a: any) => sum + a.maxPoints, 0);
          progress.overallGrade = ((totalPoints / totalMaxPoints) * 100).toFixed(2);
          progress.letterGrade = this.getLetterGrade(progress.overallGrade);
        }
      });

      // Get attendance summary
      const attendanceRecords = await prisma.attendance.count({
        where: {
          studentId,
          date: {
            gte: new Date('2024-01-01'), // Should use actual grading period dates
            lte: new Date()
          }
        }
      });

      const presentCount = await prisma.attendance.count({
        where: {
          studentId,
          attendanceCode: 'P',
          date: {
            gte: new Date('2024-01-01'),
            lte: new Date()
          }
        }
      });

      const attendanceRate = attendanceRecords > 0
        ? ((presentCount / attendanceRecords) * 100).toFixed(1)
        : '0';

      res.json({
        student: {
          id: student.id,
          name: `${student.firstName} ${student.lastName}`,
          gradeLevel: student.gradeLevel,
          studentId: student.studentUniqueId
        },
        gradingPeriod: gradingPeriodId,
        courses: Array.from(courseProgress.values()),
        attendance: {
          rate: attendanceRate,
          daysPresent: presentCount,
          totalDays: attendanceRecords
        },
        generatedDate: new Date()
      });
    } catch (error) {
      console.error('Error generating progress report:', error);
      res.status(500).json({ message: 'Failed to generate progress report' });
    }
  }
};