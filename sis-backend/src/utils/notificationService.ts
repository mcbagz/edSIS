import nodemailer from 'nodemailer';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

interface NotificationOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

interface AttendanceNotification {
  studentId: string;
  studentName: string;
  attendanceCode: string;
  date: string;
  parentEmail?: string;
  parentPhone?: string;
}

class NotificationService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Configure email transporter
    // In production, use environment variables for credentials
    if (process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  async sendEmail(options: NotificationOptions): Promise<boolean> {
    if (!this.transporter) {
      console.log('Email transporter not configured. Skipping email notification.');
      return false;
    }

    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@school.edu',
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent to ${options.to}: ${options.subject}`);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  async sendAttendanceAlert(notification: AttendanceNotification): Promise<void> {
    // Get parent contact information
    const parentContacts = await this.getParentContacts(notification.studentId);
    
    if (!parentContacts || parentContacts.length === 0) {
      console.log(`No parent contacts found for student ${notification.studentId}`);
      return;
    }

    // Prepare notification message
    const subject = `Attendance Alert: ${notification.studentName}`;
    let message = '';

    switch (notification.attendanceCode) {
      case 'A':
      case 'UA':
        message = `Your child ${notification.studentName} was marked absent on ${notification.date}.`;
        break;
      case 'T':
        message = `Your child ${notification.studentName} was marked tardy on ${notification.date}.`;
        break;
      default:
        return; // Only send notifications for absences and tardies
    }

    // Send email notifications to parents
    for (const contact of parentContacts) {
      if (contact.email) {
        await this.sendEmail({
          to: contact.email,
          subject,
          text: message,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>Attendance Notification</h2>
              <p>${message}</p>
              <p>Please contact the school office if you have any questions or if this absence was excused.</p>
              <hr />
              <p style="color: #666; font-size: 12px;">
                This is an automated message from the Student Information System.
              </p>
            </div>
          `,
        });
      }

      // TODO: Add SMS notification support
      if (contact.phone && process.env.SMS_ENABLED === 'true') {
        // Implement SMS sending via Twilio or another service
        console.log(`SMS notification would be sent to ${contact.phone}: ${message}`);
      }
    }

    // Log notification in database
    await this.logNotification({
      studentId: notification.studentId,
      type: 'ATTENDANCE',
      message,
      sentAt: new Date(),
      recipients: parentContacts.map(c => c.email || c.phone || '').filter(Boolean),
    });
  }

  async sendBulkAttendanceAlerts(notifications: AttendanceNotification[]): Promise<void> {
    // Process notifications in batches to avoid overwhelming the email server
    const batchSize = 10;
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      await Promise.all(batch.map(n => this.sendAttendanceAlert(n)));
      
      // Add a small delay between batches
      if (i + batchSize < notifications.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  private async getParentContacts(studentId: string): Promise<Array<{ email?: string; phone?: string }>> {
    try {
      // First try to get from database
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          parentStudents: {
            include: {
              parent: true,
            },
          },
        },
      });

      if (!student) {
        return [];
      }

      return (student as any).parentStudents.map((ps: any) => ({
        email: ps.parent.email || undefined,
        phone: ps.parent.phoneNumber || undefined,
      }));
    } catch (error) {
      console.error('Error fetching parent contacts:', error);
      
      // Fallback to mock data for development
      return [
        { email: 'parent@example.com', phone: '555-1234' }
      ];
    }
  }

  private async logNotification(data: {
    studentId: string;
    type: string;
    message: string;
    sentAt: Date;
    recipients: string[];
  }): Promise<void> {
    try {
      // Store notification log in database
      await prisma.notificationLog.create({
        data: {
          studentId: data.studentId,
          type: data.type,
          message: data.message,
          sentAt: data.sentAt,
          recipients: data.recipients.join(', '),
        },
      });
    } catch (error) {
      console.error('Error logging notification:', error);
      // Don't throw - logging failure shouldn't prevent notification sending
    }
  }

  async getNotificationHistory(studentId?: string, limit: number = 50): Promise<any[]> {
    try {
      const where = studentId ? { studentId } : {};
      return await prisma.notificationLog.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      console.error('Error fetching notification history:', error);
      return [];
    }
  }

  async getNotificationSettings(): Promise<any> {
    try {
      return await prisma.notificationSettings.findFirst();
    } catch (error) {
      // Return default settings
      return {
        attendanceAlertsEnabled: true,
        gradeAlertsEnabled: true,
        disciplineAlertsEnabled: true,
        absenceThreshold: 1, // Send alert after 1 absence
        tardyThreshold: 3, // Send alert after 3 tardies
        gradeThreshold: 70, // Send alert for grades below 70%
      };
    }
  }

  async updateNotificationSettings(settings: any): Promise<any> {
    try {
      const existing = await prisma.notificationSettings.findFirst();
      if (existing) {
        return await prisma.notificationSettings.update({
          where: { id: existing.id },
          data: settings,
        });
      } else {
        return await prisma.notificationSettings.create({
          data: settings,
        });
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  }
}

export default new NotificationService();