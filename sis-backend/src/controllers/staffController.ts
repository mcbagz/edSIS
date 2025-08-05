import { Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

// Get all staff members
export const getStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const { position, department } = req.query;
    
    const where: any = {};
    
    if (position) {
      where.position = position as string;
    }
    
    if (department) {
      where.department = department as string;
    }
    
    const staff = await prisma.staff.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            role: true,
            isActive: true
          }
        }
      },
      orderBy: { lastName: 'asc' }
    });
    
    res.json(staff);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
};

// Get single staff member
export const getStaffMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const staff = await prisma.staff.findUnique({
      where: { id },
      include: {
        user: true,
        homerooms: true,
        courseSections: {
          include: {
            course: true
          }
        }
      }
    });
    
    if (!staff) {
      res.status(404).json({ error: 'Staff member not found' });
      return;
    }
    
    res.json(staff);
  } catch (error) {
    console.error('Error fetching staff member:', error);
    res.status(500).json({ error: 'Failed to fetch staff member' });
  }
};

// Create staff member
export const createStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      middleName,
      phone,
      position,
      department,
      hireDate
    } = req.body;
    
    // Create user and staff in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user account
      const user = await tx.user.create({
        data: {
          email,
          password, // In production, this should be hashed
          role: 'TEACHER',
          firstName,
          lastName,
          isActive: true
        }
      });
      
      // Create staff record
      const staff = await tx.staff.create({
        data: {
          userId: user.id,
          staffUniqueId: `STAFF-${Date.now()}`, // Generate unique ID
          firstName,
          lastName,
          middleName,
          email,
          phone,
          position,
          department,
          hireDate: new Date(hireDate)
        },
        include: {
          user: true
        }
      });
      
      return staff;
    });
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating staff:', error);
    res.status(500).json({ error: 'Failed to create staff member' });
  }
};