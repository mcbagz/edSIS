import { Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

export const disciplineController = {
  // Get all discipline incidents with filters
  async getIncidents(req: Request, res: Response) {
    try {
      const { studentId, startDate, endDate, behaviorCode, page = '1', limit = '20' } = req.query;
      
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      const where: any = {};
      
      if (studentId) {
        where.studentIncidents = {
          some: {
            studentId: studentId as string
          }
        };
      }
      
      if (behaviorCode) {
        where.behaviorCode = behaviorCode as string;
      }
      
      if (startDate || endDate) {
        where.incidentDate = {};
        if (startDate) where.incidentDate.gte = new Date(startDate as string);
        if (endDate) where.incidentDate.lte = new Date(endDate as string);
      }

      const [incidents, total] = await Promise.all([
        prisma.disciplineIncident.findMany({
          where,
          skip,
          take,
          include: {
            studentIncidents: {
              include: {
                student: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    gradeLevel: true,
                    studentUniqueId: true
                  }
                }
              }
            },
            disciplineActions: {
              orderBy: {
                actionDate: 'desc'
              }
            }
          },
          orderBy: {
            incidentDate: 'desc'
          }
        }),
        prisma.disciplineIncident.count({ where })
      ]);

      res.json({
        incidents,
        total,
        page: parseInt(page as string),
        totalPages: Math.ceil(total / take)
      });
    } catch (error) {
      console.error('Error fetching discipline incidents:', error);
      res.status(500).json({ message: 'Failed to fetch discipline incidents' });
    }
  },

  // Get single incident by ID
  async getIncidentById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      const incident = await prisma.disciplineIncident.findUnique({
        where: { id },
        include: {
          studentIncidents: {
            include: {
              student: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  gradeLevel: true,
                  studentUniqueId: true,
                  email: true,
                  phone: true
                }
              }
            }
          },
          disciplineActions: {
            orderBy: {
              actionDate: 'desc'
            }
          }
        }
      });

      if (!incident) {
        return res.status(404).json({ message: 'Incident not found' });
      }

      return res.json(incident);
    } catch (error) {
      console.error('Error fetching incident:', error);
      return res.status(500).json({ message: 'Failed to fetch incident' });
    }
  },

  // Create new discipline incident
  async createIncident(req: Request, res: Response) {
    try {
      const {
        incidentDate,
        incidentTime,
        incidentLocation,
        reporterName,
        reporterDescription,
        behaviorCode,
        incidentDescription,
        studentIncidents,
        disciplineActions
      } = req.body;

      // Generate unique incident identifier
      const incidentCount = await prisma.disciplineIncident.count();
      const incidentIdentifier = `INC-${new Date().getFullYear()}-${String(incidentCount + 1).padStart(5, '0')}`;

      const incident = await prisma.disciplineIncident.create({
        data: {
          incidentIdentifier,
          incidentDate: new Date(incidentDate),
          incidentTime,
          incidentLocation,
          reporterName,
          reporterDescription,
          behaviorCode,
          incidentDescription,
          studentIncidents: {
            create: studentIncidents?.map((si: any) => ({
              studentId: si.studentId,
              studentRole: si.studentRole
            })) || []
          },
          disciplineActions: {
            create: disciplineActions?.map((action: any) => ({
              actionType: action.actionType,
              actionDate: new Date(action.actionDate),
              duration: action.duration,
              description: action.description,
              assignedBy: action.assignedBy
            })) || []
          }
        },
        include: {
          studentIncidents: {
            include: {
              student: true
            }
          },
          disciplineActions: true
        }
      });

      res.status(201).json(incident);
    } catch (error) {
      console.error('Error creating incident:', error);
      res.status(500).json({ message: 'Failed to create incident' });
    }
  },

  // Update discipline incident
  async updateIncident(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        incidentDate,
        incidentTime,
        incidentLocation,
        reporterName,
        reporterDescription,
        behaviorCode,
        incidentDescription
      } = req.body;

      const incident = await prisma.disciplineIncident.update({
        where: { id },
        data: {
          incidentDate: incidentDate ? new Date(incidentDate) : undefined,
          incidentTime,
          incidentLocation,
          reporterName,
          reporterDescription,
          behaviorCode,
          incidentDescription
        },
        include: {
          studentIncidents: {
            include: {
              student: true
            }
          },
          disciplineActions: true
        }
      });

      res.json(incident);
    } catch (error) {
      console.error('Error updating incident:', error);
      res.status(500).json({ message: 'Failed to update incident' });
    }
  },

  // Delete discipline incident
  async deleteIncident(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // First delete related records due to foreign key constraints
      await prisma.studentDisciplineIncident.deleteMany({
        where: { incidentId: id }
      });

      await prisma.disciplineAction.deleteMany({
        where: { incidentId: id }
      });

      await prisma.disciplineIncident.delete({
        where: { id }
      });

      res.json({ message: 'Incident deleted successfully' });
    } catch (error) {
      console.error('Error deleting incident:', error);
      res.status(500).json({ message: 'Failed to delete incident' });
    }
  },

  // Add student to incident
  async addStudentToIncident(req: Request, res: Response) {
    try {
      const { incidentId } = req.params;
      const { studentId, studentRole } = req.body;

      const studentIncident = await prisma.studentDisciplineIncident.create({
        data: {
          studentId,
          incidentId,
          studentRole
        },
        include: {
          student: true
        }
      });

      res.status(201).json(studentIncident);
    } catch (error) {
      console.error('Error adding student to incident:', error);
      res.status(500).json({ message: 'Failed to add student to incident' });
    }
  },

  // Remove student from incident
  async removeStudentFromIncident(req: Request, res: Response) {
    try {
      const { incidentId, studentId } = req.params;

      await prisma.studentDisciplineIncident.delete({
        where: {
          studentId_incidentId: {
            studentId,
            incidentId
          }
        }
      });

      res.json({ message: 'Student removed from incident' });
    } catch (error) {
      console.error('Error removing student from incident:', error);
      res.status(500).json({ message: 'Failed to remove student from incident' });
    }
  },

  // Add discipline action
  async addDisciplineAction(req: Request, res: Response) {
    try {
      const { incidentId } = req.params;
      const { actionType, actionDate, duration, description, assignedBy } = req.body;

      const action = await prisma.disciplineAction.create({
        data: {
          incidentId,
          actionType,
          actionDate: new Date(actionDate),
          duration,
          description,
          assignedBy
        }
      });

      res.status(201).json(action);
    } catch (error) {
      console.error('Error adding discipline action:', error);
      res.status(500).json({ message: 'Failed to add discipline action' });
    }
  },

  // Update discipline action
  async updateDisciplineAction(req: Request, res: Response) {
    try {
      const { actionId } = req.params;
      const { actionType, actionDate, duration, description, assignedBy } = req.body;

      const action = await prisma.disciplineAction.update({
        where: { id: actionId },
        data: {
          actionType,
          actionDate: actionDate ? new Date(actionDate) : undefined,
          duration,
          description,
          assignedBy
        }
      });

      res.json(action);
    } catch (error) {
      console.error('Error updating discipline action:', error);
      res.status(500).json({ message: 'Failed to update discipline action' });
    }
  },

  // Delete discipline action
  async deleteDisciplineAction(req: Request, res: Response) {
    try {
      const { actionId } = req.params;

      await prisma.disciplineAction.delete({
        where: { id: actionId }
      });

      res.json({ message: 'Discipline action deleted successfully' });
    } catch (error) {
      console.error('Error deleting discipline action:', error);
      res.status(500).json({ message: 'Failed to delete discipline action' });
    }
  },

  // Get student's discipline history
  async getStudentDisciplineHistory(req: Request, res: Response) {
    try {
      const { studentId } = req.params;

      const incidents = await prisma.studentDisciplineIncident.findMany({
        where: { studentId },
        include: {
          incident: {
            include: {
              disciplineActions: true
            }
          }
        },
        orderBy: {
          incident: {
            incidentDate: 'desc'
          }
        }
      });

      res.json(incidents);
    } catch (error) {
      console.error('Error fetching student discipline history:', error);
      res.status(500).json({ message: 'Failed to fetch student discipline history' });
    }
  },

  // Generate discipline report
  async generateDisciplineReport(req: Request, res: Response) {
    try {
      const { startDate, endDate, groupBy = 'behaviorCode' } = req.query;

      const where: any = {};
      if (startDate || endDate) {
        where.incidentDate = {};
        if (startDate) where.incidentDate.gte = new Date(startDate as string);
        if (endDate) where.incidentDate.lte = new Date(endDate as string);
      }

      const incidents = await prisma.disciplineIncident.findMany({
        where,
        include: {
          studentIncidents: {
            include: {
              student: true
            }
          },
          disciplineActions: true
        }
      });

      // Group incidents based on the requested grouping
      const report: any = {};
      
      if (groupBy === 'behaviorCode') {
        incidents.forEach(incident => {
          if (!report[incident.behaviorCode]) {
            report[incident.behaviorCode] = {
              count: 0,
              incidents: []
            };
          }
          report[incident.behaviorCode].count++;
          report[incident.behaviorCode].incidents.push(incident);
        });
      } else if (groupBy === 'gradeLevel') {
        for (const incident of incidents) {
          for (const si of incident.studentIncidents) {
            const gradeLevel = si.student.gradeLevel;
            if (!report[gradeLevel]) {
              report[gradeLevel] = {
                count: 0,
                incidents: []
              };
            }
            report[gradeLevel].count++;
            report[gradeLevel].incidents.push(incident);
          }
        }
      } else if (groupBy === 'actionType') {
        for (const incident of incidents) {
          for (const action of incident.disciplineActions) {
            if (!report[action.actionType]) {
              report[action.actionType] = {
                count: 0,
                incidents: []
              };
            }
            report[action.actionType].count++;
            report[action.actionType].incidents.push(incident);
          }
        }
      }

      res.json({
        startDate,
        endDate,
        groupBy,
        totalIncidents: incidents.length,
        report
      });
    } catch (error) {
      console.error('Error generating discipline report:', error);
      res.status(500).json({ message: 'Failed to generate discipline report' });
    }
  },

  // Get behavior codes (for dropdown options)
  async getBehaviorCodes(req: Request, res: Response) {
    try {
      // In a real system, these would be configurable
      const behaviorCodes = [
        { code: 'TARDY', description: 'Tardiness' },
        { code: 'ABSENCE', description: 'Unexcused Absence' },
        { code: 'DISRUPTION', description: 'Classroom Disruption' },
        { code: 'DISRESPECT', description: 'Disrespect to Staff' },
        { code: 'FIGHTING', description: 'Fighting' },
        { code: 'BULLYING', description: 'Bullying/Harassment' },
        { code: 'VANDALISM', description: 'Vandalism' },
        { code: 'THEFT', description: 'Theft' },
        { code: 'CHEATING', description: 'Academic Dishonesty' },
        { code: 'DRESS_CODE', description: 'Dress Code Violation' },
        { code: 'TECHNOLOGY', description: 'Technology Misuse' },
        { code: 'SUBSTANCE', description: 'Substance Violation' },
        { code: 'WEAPON', description: 'Weapon Possession' },
        { code: 'OTHER', description: 'Other' }
      ];

      res.json(behaviorCodes);
    } catch (error) {
      console.error('Error fetching behavior codes:', error);
      res.status(500).json({ message: 'Failed to fetch behavior codes' });
    }
  },

  // Get action types (for dropdown options)
  async getActionTypes(req: Request, res: Response) {
    try {
      // In a real system, these would be configurable
      const actionTypes = [
        { type: 'WARNING', description: 'Verbal/Written Warning' },
        { type: 'DETENTION', description: 'Detention' },
        { type: 'COUNSELING', description: 'Counseling' },
        { type: 'PARENT_CONFERENCE', description: 'Parent Conference' },
        { type: 'IN_SCHOOL_SUSPENSION', description: 'In-School Suspension' },
        { type: 'OUT_SCHOOL_SUSPENSION', description: 'Out-of-School Suspension' },
        { type: 'EXPULSION', description: 'Expulsion' },
        { type: 'COMMUNITY_SERVICE', description: 'Community Service' },
        { type: 'LOSS_OF_PRIVILEGES', description: 'Loss of Privileges' },
        { type: 'RESTITUTION', description: 'Restitution' },
        { type: 'OTHER', description: 'Other' }
      ];

      res.json(actionTypes);
    } catch (error) {
      console.error('Error fetching action types:', error);
      res.status(500).json({ message: 'Failed to fetch action types' });
    }
  }
};