import { Request, Response } from 'express';
import prisma from '../config/database';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET_NAME } from '../config/aws';
import { AuthRequest } from '../middleware/auth';
import type { ApplicationStatus } from '../generated/prisma';

export const applicationController = {
  // List all applications with filters
  async listApplications(req: Request, res: Response) {
    try {
      const { status, page = 1, limit = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where = status ? { status: status as ApplicationStatus } : {};

      const [applications, total] = await Promise.all([
        prisma.application.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            prospectiveStudent: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.application.count({ where }),
      ]);

      res.json({
        applications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Error fetching applications:', error);
      res.status(500).json({ message: 'Failed to fetch applications' });
    }
  },

  // Get single application by ID
  async getApplication(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const application = await prisma.application.findUnique({
        where: { id },
        include: {
          prospectiveStudent: true,
        },
      });

      if (!application) {
        res.status(404).json({ message: 'Application not found' });
        return;
      }

      res.json(application);
    } catch (error) {
      console.error('Error fetching application:', error);
      res.status(500).json({ message: 'Failed to fetch application' });
    }
  },

  // Create new application
  async createApplication(req: Request, res: Response) {
    try {
      const { prospectiveStudent, notes } = req.body;

      // Create prospective student and application in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const newProspectiveStudent = await tx.prospectiveStudent.create({
          data: prospectiveStudent,
        });

        const application = await tx.application.create({
          data: {
            prospectiveStudentId: newProspectiveStudent.id,
            notes,
          },
          include: {
            prospectiveStudent: true,
          },
        });

        return application;
      });

      res.status(201).json(result);
    } catch (error) {
      console.error('Error creating application:', error);
      res.status(500).json({ message: 'Failed to create application' });
    }
  },

  // Update application status
  async updateApplicationStatus(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const application = await prisma.application.update({
        where: { id },
        data: {
          status,
          notes,
          ...(status === 'ACCEPTED' || status === 'REJECTED'
            ? {
                reviewedBy: req.user?.id,
                reviewedAt: new Date(),
              }
            : {}),
        },
        include: {
          prospectiveStudent: true,
        },
      });

      res.json(application);
    } catch (error) {
      console.error('Error updating application:', error);
      res.status(500).json({ message: 'Failed to update application' });
    }
  },

  // Generate presigned URL for document upload
  async getUploadUrl(req: Request, res: Response) {
    try {
      const { applicationId, documentType } = req.body;
      
      if (!applicationId || !documentType) {
        res.status(400).json({ message: 'applicationId and documentType are required' });
        return;
      }

      const key = `applications/${applicationId}/${documentType}_${Date.now()}.pdf`;

      const command = new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
        ContentType: 'application/pdf',
      });

      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour

      res.json({ uploadUrl, key });
    } catch (error) {
      console.error('Error generating upload URL:', error);
      res.status(500).json({ message: 'Failed to generate upload URL' });
    }
  },

  // Get presigned URL for document download
  async getDownloadUrl(req: Request, res: Response) {
    try {
      const { key } = req.params;

      const command = new GetObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
      });

      const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour

      res.json({ downloadUrl });
    } catch (error) {
      console.error('Error generating download URL:', error);
      res.status(500).json({ message: 'Failed to generate download URL' });
    }
  },

  // Update application documents
  async updateDocuments(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { documents } = req.body;

      const application = await prisma.application.update({
        where: { id },
        data: {
          documents,
        },
      });

      res.json(application);
    } catch (error) {
      console.error('Error updating documents:', error);
      res.status(500).json({ message: 'Failed to update documents' });
    }
  },

  // Convert accepted application to enrolled student
  async enrollAcceptedApplication(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { courseSectionIds, homeroomId } = req.body;

      // Get the application and verify it's accepted
      const application = await prisma.application.findUnique({
        where: { id },
        include: {
          prospectiveStudent: true,
        },
      });

      if (!application) {
        res.status(404).json({ message: 'Application not found' });
        return;
      }

      if (application.status !== 'ACCEPTED') {
        res.status(400).json({ message: 'Only accepted applications can be enrolled' });
        return;
      }

      // Check if student already exists
      const existingStudent = await prisma.student.findFirst({
        where: {
          firstName: application.prospectiveStudent.firstName,
          lastName: application.prospectiveStudent.lastName,
          birthDate: application.prospectiveStudent.dateOfBirth,
        },
      });

      if (existingStudent) {
        res.status(400).json({ message: 'Student already exists in the system' });
        return;
      }

      // Create student and enrollments in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Generate unique student ID
        const studentCount = await tx.student.count();
        const studentUniqueId = `STU${String(studentCount + 1).padStart(6, '0')}`;

        // Create the student from prospective student data
        const student = await tx.student.create({
          data: {
            studentUniqueId,
            firstName: application.prospectiveStudent.firstName,
            lastName: application.prospectiveStudent.lastName,
            middleName: '',
            birthDate: application.prospectiveStudent.dateOfBirth,
            gender: application.prospectiveStudent.gender,
            ethnicity: application.prospectiveStudent.ethnicity,
            gradeLevel: '9', // Default - should be passed from frontend
            email: application.prospectiveStudent.email,
            phone: application.prospectiveStudent.phone,
            address: application.prospectiveStudent.address,
            city: application.prospectiveStudent.city,
            state: application.prospectiveStudent.state,
            zipCode: application.prospectiveStudent.zipCode,
            emergencyContactName: application.prospectiveStudent.guardianName,
            emergencyContactPhone: application.prospectiveStudent.guardianPhone,
            emergencyContactRelation: application.prospectiveStudent.guardianRelation,
          },
        });

        // Create homeroom enrollment
        if (homeroomId) {
          await tx.enrollment.create({
            data: {
              studentId: student.id,
              homeroomId,
            },
          });
        }

        // Create course enrollments
        if (courseSectionIds && courseSectionIds.length > 0) {
          await Promise.all(
            courseSectionIds.map((sectionId: string) =>
              tx.enrollment.create({
                data: {
                  studentId: student.id,
                  courseSectionId: sectionId,
                },
              })
            )
          );

          // Update course section enrollment counts
          await Promise.all(
            courseSectionIds.map((sectionId: string) =>
              tx.courseSection.update({
                where: { id: sectionId },
                data: {
                  currentEnrollment: {
                    increment: 1,
                  },
                },
              })
            )
          );
        }

        return student;
      });

      res.status(201).json({
        message: 'Student enrolled successfully',
        student: result,
      });
    } catch (error) {
      console.error('Error enrolling application:', error);
      res.status(500).json({ message: 'Failed to enroll application' });
    }
  },

  // Update application with additional details
  async updateApplicationDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const application = await prisma.application.findUnique({
        where: { id },
      });

      if (!application) {
        res.status(404).json({ message: 'Application not found' });
        return;
      }

      // Update prospective student details
      if (updateData.prospectiveStudent) {
        await prisma.prospectiveStudent.update({
          where: { id: application.prospectiveStudentId },
          data: updateData.prospectiveStudent,
        });
      }

      // Update application notes
      if (updateData.notes !== undefined) {
        await prisma.application.update({
          where: { id },
          data: { notes: updateData.notes },
        });
      }

      const updatedApplication = await prisma.application.findUnique({
        where: { id },
        include: {
          prospectiveStudent: true,
        },
      });

      res.json(updatedApplication);
    } catch (error) {
      console.error('Error updating application details:', error);
      res.status(500).json({ message: 'Failed to update application details' });
    }
  },

  // Get application statistics
  async getApplicationStats(req: Request, res: Response) {
    try {
      const [total, applied, accepted, rejected] = await Promise.all([
        prisma.application.count(),
        prisma.application.count({ where: { status: 'APPLIED' } }),
        prisma.application.count({ where: { status: 'ACCEPTED' } }),
        prisma.application.count({ where: { status: 'REJECTED' } }),
      ]);

      res.json({
        total,
        applied,
        accepted,
        rejected,
        acceptanceRate: total > 0 ? ((accepted / total) * 100).toFixed(1) : 0,
      });
    } catch (error) {
      console.error('Error fetching application stats:', error);
      res.status(500).json({ message: 'Failed to fetch application statistics' });
    }
  },
};