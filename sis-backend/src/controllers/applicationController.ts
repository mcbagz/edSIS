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
};