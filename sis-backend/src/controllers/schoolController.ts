import { Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

// Get all schools
export const getSchools = async (_req: Request, res: Response): Promise<void> => {
  try {
    const schools = await prisma.school.findMany({
      orderBy: { name: 'asc' }
    });
    
    res.json(schools);
  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({ error: 'Failed to fetch schools' });
  }
};

// Get all sessions
export const getSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { schoolId } = req.query;
    
    const where: any = {};
    if (schoolId) {
      where.schoolId = schoolId as string;
    }
    
    const sessions = await prisma.session.findMany({
      where,
      include: {
        school: true
      },
      orderBy: { beginDate: 'desc' }
    });
    
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};

// Get current session
export const getCurrentSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { schoolId } = req.query;
    const currentDate = new Date();
    
    const where: any = {
      beginDate: { lte: currentDate },
      endDate: { gte: currentDate }
    };
    
    if (schoolId) {
      where.schoolId = schoolId as string;
    }
    
    const session = await prisma.session.findFirst({
      where,
      include: {
        school: true
      }
    });
    
    if (!session) {
      // If no current session, get the most recent one
      const recentSession = await prisma.session.findFirst({
        where: schoolId ? { schoolId: schoolId as string } : {},
        orderBy: { beginDate: 'desc' },
        include: {
          school: true
        }
      });
      
      res.json(recentSession);
      return;
    }
    
    res.json(session);
  } catch (error) {
    console.error('Error fetching current session:', error);
    res.status(500).json({ error: 'Failed to fetch current session' });
  }
};