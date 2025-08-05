"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applicationController = void 0;
const database_1 = __importDefault(require("../config/database"));
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const client_s3_1 = require("@aws-sdk/client-s3");
const aws_1 = require("../config/aws");
exports.applicationController = {
    // List all applications with filters
    async listApplications(req, res) {
        try {
            const { status, page = 1, limit = 10 } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const where = status ? { status: status } : {};
            const [applications, total] = await Promise.all([
                database_1.default.application.findMany({
                    where,
                    skip,
                    take: Number(limit),
                    include: {
                        prospectiveStudent: true,
                    },
                    orderBy: { createdAt: 'desc' },
                }),
                database_1.default.application.count({ where }),
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
        }
        catch (error) {
            console.error('Error fetching applications:', error);
            res.status(500).json({ message: 'Failed to fetch applications' });
        }
    },
    // Get single application by ID
    async getApplication(req, res) {
        try {
            const { id } = req.params;
            const application = await database_1.default.application.findUnique({
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
        }
        catch (error) {
            console.error('Error fetching application:', error);
            res.status(500).json({ message: 'Failed to fetch application' });
        }
    },
    // Create new application
    async createApplication(req, res) {
        try {
            const { prospectiveStudent, notes } = req.body;
            // Create prospective student and application in a transaction
            const result = await database_1.default.$transaction(async (tx) => {
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
        }
        catch (error) {
            console.error('Error creating application:', error);
            res.status(500).json({ message: 'Failed to create application' });
        }
    },
    // Update application status
    async updateApplicationStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, notes } = req.body;
            const application = await database_1.default.application.update({
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
        }
        catch (error) {
            console.error('Error updating application:', error);
            res.status(500).json({ message: 'Failed to update application' });
        }
    },
    // Generate presigned URL for document upload
    async getUploadUrl(req, res) {
        try {
            const { applicationId, documentType } = req.body;
            if (!applicationId || !documentType) {
                res.status(400).json({ message: 'applicationId and documentType are required' });
                return;
            }
            const key = `applications/${applicationId}/${documentType}_${Date.now()}.pdf`;
            const command = new client_s3_1.PutObjectCommand({
                Bucket: aws_1.S3_BUCKET_NAME,
                Key: key,
                ContentType: 'application/pdf',
            });
            const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(aws_1.s3Client, command, { expiresIn: 3600 }); // 1 hour
            res.json({ uploadUrl, key });
        }
        catch (error) {
            console.error('Error generating upload URL:', error);
            res.status(500).json({ message: 'Failed to generate upload URL' });
        }
    },
    // Get presigned URL for document download
    async getDownloadUrl(req, res) {
        try {
            const { key } = req.params;
            const command = new client_s3_1.GetObjectCommand({
                Bucket: aws_1.S3_BUCKET_NAME,
                Key: key,
            });
            const downloadUrl = await (0, s3_request_presigner_1.getSignedUrl)(aws_1.s3Client, command, { expiresIn: 3600 }); // 1 hour
            res.json({ downloadUrl });
        }
        catch (error) {
            console.error('Error generating download URL:', error);
            res.status(500).json({ message: 'Failed to generate download URL' });
        }
    },
    // Update application documents
    async updateDocuments(req, res) {
        try {
            const { id } = req.params;
            const { documents } = req.body;
            const application = await database_1.default.application.update({
                where: { id },
                data: {
                    documents,
                },
            });
            res.json(application);
        }
        catch (error) {
            console.error('Error updating documents:', error);
            res.status(500).json({ message: 'Failed to update documents' });
        }
    },
};
//# sourceMappingURL=applicationController.js.map