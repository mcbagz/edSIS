import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import edfiService from '../services/edfiService';

// Individual exports for route compatibility
export const getSchools = async (req: Request, res: Response) => {
  try {
    const schools = await prisma.school.findMany({
      include: {
        _count: {
          select: {
            homerooms: true,
            courses: true,
            courseSections: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json(schools);
  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({ message: 'Failed to fetch schools' });
  }
};

export const getSessions = async (req: Request, res: Response) => {
  try {
    const sessions = await prisma.session.findMany({
      include: {
        school: true,
        gradingPeriods: true,
      },
      orderBy: { beginDate: 'desc' },
    });

    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ message: 'Failed to fetch sessions' });
  }
};

export const getCurrentSession = async (req: Request, res: Response) => {
  try {
    const currentDate = new Date();
    
    const session = await prisma.session.findFirst({
      where: {
        beginDate: { lte: currentDate },
        endDate: { gte: currentDate },
      },
      include: {
        school: true,
        gradingPeriods: {
          orderBy: { beginDate: 'asc' },
        },
      },
    });

    if (!session) {
      // If no current session, get the most recent one
      const recentSession = await prisma.session.findFirst({
        orderBy: { endDate: 'desc' },
        include: {
          school: true,
          gradingPeriods: {
            orderBy: { beginDate: 'asc' },
          },
        },
      });
      
      res.json(recentSession);
    } else {
      res.json(session);
    }
  } catch (error) {
    console.error('Error fetching current session:', error);
    res.status(500).json({ message: 'Failed to fetch current session' });
  }
};

export const schoolController = {
  async listSchools(req: Request, res: Response) {
    try {
      const schools = await prisma.school.findMany({
        include: {
          _count: {
            select: {
              homerooms: true,
              courses: true,
              courseSections: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      res.json(schools);
    } catch (error) {
      console.error('Error fetching schools:', error);
      res.status(500).json({ message: 'Failed to fetch schools' });
    }
  },

  async getSchool(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const school = await prisma.school.findUnique({
        where: { id },
        include: {
          sessions: {
            orderBy: { beginDate: 'desc' },
          },
          gradingPeriods: {
            orderBy: { beginDate: 'desc' },
          },
          homerooms: {
            include: {
              teacher: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          courses: {
            include: {
              _count: {
                select: {
                  courseSections: true,
                },
              },
            },
          },
        },
      });

      if (!school) {
        res.status(404).json({ message: 'School not found' });
        return;
      }

      res.json(school);
    } catch (error) {
      console.error('Error fetching school:', error);
      res.status(500).json({ message: 'Failed to fetch school' });
    }
  },

  async createSchool(req: AuthRequest, res: Response) {
    try {
      const schoolData = req.body;

      const schoolCount = await prisma.school.count();
      const schoolId = 1000 + schoolCount + 1;

      const school = await prisma.school.create({
        data: {
          schoolId,
          name: schoolData.name,
          type: schoolData.type,
          address: schoolData.address,
          city: schoolData.city,
          state: schoolData.state,
          zipCode: schoolData.zipCode,
          phone: schoolData.phone,
          principal: schoolData.principal,
        },
      });

      // Sync to Ed-Fi in the background
      edfiService.syncSchool(school.id).catch((error) => {
        console.error('Failed to sync school to Ed-Fi:', error);
      });

      res.status(201).json(school);
    } catch (error) {
      console.error('Error creating school:', error);
      res.status(500).json({ message: 'Failed to create school' });
    }
  },

  async updateSchool(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const school = await prisma.school.update({
        where: { id },
        data: updateData,
      });

      // Sync to Ed-Fi in the background
      edfiService.syncSchool(school.id).catch((error) => {
        console.error('Failed to sync school to Ed-Fi:', error);
      });

      res.json(school);
    } catch (error) {
      console.error('Error updating school:', error);
      res.status(500).json({ message: 'Failed to update school' });
    }
  },

  async deleteSchool(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      await prisma.school.delete({
        where: { id },
      });

      res.json({ message: 'School deleted successfully' });
    } catch (error) {
      console.error('Error deleting school:', error);
      res.status(500).json({ message: 'Failed to delete school' });
    }
  },

  async syncSchoolToEdFi(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      await edfiService.syncSchool(id);

      res.json({ message: 'School synced to Ed-Fi successfully' });
    } catch (error) {
      console.error('Error syncing school to Ed-Fi:', error);
      res.status(500).json({ message: 'Failed to sync school to Ed-Fi' });
    }
  },

  async syncAllSchoolsToEdFi(req: AuthRequest, res: Response) {
    try {
      await edfiService.syncAllSchools();

      res.json({ message: 'All schools synced to Ed-Fi successfully' });
    } catch (error) {
      console.error('Error syncing schools to Ed-Fi:', error);
      res.status(500).json({ message: 'Failed to sync schools to Ed-Fi' });
    }
  },
};