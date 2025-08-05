"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnrollmentWorkflowService = void 0;
const database_1 = __importDefault(require("../config/database"));
const aws_1 = require("../config/aws");
const client_ses_1 = require("@aws-sdk/client-ses");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class EnrollmentWorkflowService {
    /**
     * Process accepted application and create student record
     */
    static async processAcceptedApplication(applicationId) {
        try {
            // Get application with prospective student data
            const application = await database_1.default.application.findUnique({
                where: { id: applicationId },
                include: { prospectiveStudent: true },
            });
            if (!application || application.status !== 'ACCEPTED') {
                throw new Error('Application not found or not accepted');
            }
            // Check if student already created for this application
            const existingStudent = await database_1.default.student.findFirst({
                where: {
                    firstName: application.prospectiveStudent.firstName,
                    lastName: application.prospectiveStudent.lastName,
                    birthDate: application.prospectiveStudent.dateOfBirth,
                },
            });
            if (existingStudent) {
                console.log('Student already exists for this application');
                return;
            }
            // Create student record in a transaction
            await database_1.default.$transaction(async (tx) => {
                // Generate student unique ID
                const studentCount = await tx.student.count();
                const studentUniqueId = `STU${String(studentCount + 1).padStart(6, '0')}`;
                // Create user account for student (optional)
                let userId;
                if (application.prospectiveStudent.email) {
                    const tempPassword = this.generateTempPassword();
                    const hashedPassword = await bcryptjs_1.default.hash(tempPassword, 10);
                    const user = await tx.user.create({
                        data: {
                            email: application.prospectiveStudent.email,
                            password: hashedPassword,
                            role: 'STUDENT',
                            firstName: application.prospectiveStudent.firstName,
                            lastName: application.prospectiveStudent.lastName,
                        },
                    });
                    userId = user.id;
                    // Store temp password for email (in production, use secure method)
                    await this.sendAcceptanceEmail(application.prospectiveStudent, application.prospectiveStudent.email, tempPassword);
                }
                // Create student record
                const student = await tx.student.create({
                    data: {
                        userId,
                        studentUniqueId,
                        firstName: application.prospectiveStudent.firstName,
                        lastName: application.prospectiveStudent.lastName,
                        birthDate: application.prospectiveStudent.dateOfBirth,
                        gender: application.prospectiveStudent.gender,
                        ethnicity: application.prospectiveStudent.ethnicity,
                        gradeLevel: '9', // Default for new students
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
                // Create parent account if guardian email provided
                if (application.prospectiveStudent.guardianEmail) {
                    const parentTempPassword = this.generateTempPassword();
                    const parentHashedPassword = await bcryptjs_1.default.hash(parentTempPassword, 10);
                    const parentUser = await tx.user.create({
                        data: {
                            email: application.prospectiveStudent.guardianEmail,
                            password: parentHashedPassword,
                            role: 'PARENT',
                            firstName: application.prospectiveStudent.guardianName.split(' ')[0],
                            lastName: application.prospectiveStudent.guardianName.split(' ').slice(1).join(' ') || '',
                        },
                    });
                    const parent = await tx.parent.create({
                        data: {
                            userId: parentUser.id,
                            firstName: parentUser.firstName,
                            lastName: parentUser.lastName,
                            email: application.prospectiveStudent.guardianEmail,
                            phone: application.prospectiveStudent.guardianPhone,
                        },
                    });
                    // Link parent to student
                    await tx.studentParent.create({
                        data: {
                            studentId: student.id,
                            parentId: parent.id,
                            relationship: application.prospectiveStudent.guardianRelation,
                            isPrimary: true,
                        },
                    });
                    // Send parent credentials
                    await this.sendParentAccountEmail(application.prospectiveStudent.guardianEmail, application.prospectiveStudent.guardianName, parentTempPassword);
                }
                // Mark email as sent
                await tx.application.update({
                    where: { id: applicationId },
                    data: { acceptanceEmailSent: true },
                });
            });
            console.log('Successfully processed accepted application:', applicationId);
        }
        catch (error) {
            console.error('Error processing accepted application:', error);
            throw error;
        }
    }
    /**
     * Send acceptance email to student
     */
    static async sendAcceptanceEmail(prospectiveStudent, email, tempPassword) {
        if (process.env.NODE_ENV === 'test') {
            console.log('Test mode: Email would be sent to:', email);
            return;
        }
        const params = {
            Destination: {
                ToAddresses: [email],
            },
            Message: {
                Body: {
                    Html: {
                        Charset: 'UTF-8',
                        Data: `
              <h2>Congratulations ${prospectiveStudent.firstName}!</h2>
              <p>Your application to Lincoln High School has been accepted.</p>
              <p>Your student account has been created with the following credentials:</p>
              <ul>
                <li>Email: ${email}</li>
                <li>Temporary Password: ${tempPassword}</li>
              </ul>
              <p>Please log in to complete your enrollment and select your courses for the upcoming semester.</p>
              <p>Login at: ${process.env.FRONTEND_URL}/login</p>
              <p>Best regards,<br>Lincoln High School Admissions</p>
            `,
                    },
                    Text: {
                        Charset: 'UTF-8',
                        Data: `Congratulations ${prospectiveStudent.firstName}! Your application has been accepted. 
            Login with email: ${email} and temporary password: ${tempPassword}`,
                    },
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: 'Welcome to Lincoln High School - Application Accepted',
                },
            },
            Source: process.env.AWS_SES_FROM_EMAIL || 'noreply@school.edu',
        };
        try {
            const command = new client_ses_1.SendEmailCommand(params);
            await aws_1.sesClient.send(command);
            console.log('Acceptance email sent to:', email);
        }
        catch (error) {
            console.error('Error sending acceptance email:', error);
            // Don't throw - email failure shouldn't stop the process
        }
    }
    /**
     * Send parent account creation email
     */
    static async sendParentAccountEmail(email, name, tempPassword) {
        if (process.env.NODE_ENV === 'test') {
            console.log('Test mode: Parent email would be sent to:', email);
            return;
        }
        const params = {
            Destination: {
                ToAddresses: [email],
            },
            Message: {
                Body: {
                    Html: {
                        Charset: 'UTF-8',
                        Data: `
              <h2>Dear ${name},</h2>
              <p>A parent account has been created for you at Lincoln High School.</p>
              <p>You can use this account to:</p>
              <ul>
                <li>View your child's grades and attendance</li>
                <li>Communicate with teachers</li>
                <li>Access school announcements</li>
                <li>Update contact information</li>
              </ul>
              <p>Your login credentials:</p>
              <ul>
                <li>Email: ${email}</li>
                <li>Temporary Password: ${tempPassword}</li>
              </ul>
              <p>Please log in and change your password at: ${process.env.FRONTEND_URL}/login</p>
              <p>Best regards,<br>Lincoln High School</p>
            `,
                    },
                    Text: {
                        Charset: 'UTF-8',
                        Data: `Dear ${name}, A parent account has been created for you. 
            Login with email: ${email} and temporary password: ${tempPassword}`,
                    },
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: 'Lincoln High School - Parent Account Created',
                },
            },
            Source: process.env.AWS_SES_FROM_EMAIL || 'noreply@school.edu',
        };
        try {
            const command = new client_ses_1.SendEmailCommand(params);
            await aws_1.sesClient.send(command);
            console.log('Parent account email sent to:', email);
        }
        catch (error) {
            console.error('Error sending parent email:', error);
            // Don't throw - email failure shouldn't stop the process
        }
    }
    /**
     * Generate temporary password
     */
    static generateTempPassword() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }
}
exports.EnrollmentWorkflowService = EnrollmentWorkflowService;
//# sourceMappingURL=enrollmentWorkflowService.js.map