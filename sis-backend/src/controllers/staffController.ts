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

// Update staff member
export const updateStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      middleName,
      email,
      phone,
      position,
      department,
      isActive
    } = req.body;
    
    // Update staff and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update staff record
      const staff = await tx.staff.update({
        where: { id },
        data: {
          firstName,
          lastName,
          middleName,
          email,
          phone,
          position,
          department
        }
      });
      
      // Update user account if needed
      if (isActive !== undefined) {
        await tx.user.update({
          where: { id: staff.userId },
          data: {
            isActive,
            email,
            firstName,
            lastName
          }
        });
      }
      
      return staff;
    });
    
    const updatedStaff = await prisma.staff.findUnique({
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
    
    res.json(updatedStaff);
  } catch (error) {
    console.error('Error updating staff:', error);
    res.status(500).json({ error: 'Failed to update staff member' });
  }
};

// Delete staff member
export const deleteStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Check if staff has active assignments
    const staff = await prisma.staff.findUnique({
      where: { id },
      include: {
        homerooms: true,
        courseSections: true
      }
    });
    
    if (!staff) {
      res.status(404).json({ error: 'Staff member not found' });
      return;
    }
    
    if (staff.homerooms.length > 0 || staff.courseSections.length > 0) {
      res.status(400).json({ 
        error: 'Cannot delete staff member with active assignments. Please reassign their classes first.' 
      });
      return;
    }
    
    // Delete staff and user in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.staff.delete({
        where: { id }
      });
      
      await tx.user.delete({
        where: { id: staff.userId }
      });
    });
    
    res.json({ message: 'Staff member deleted successfully' });
  } catch (error) {
    console.error('Error deleting staff:', error);
    res.status(500).json({ error: 'Failed to delete staff member' });
  }
};

// Get staff schedule
export const getStaffSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const staff = await prisma.staff.findUnique({
      where: { id },
      include: {
        courseSections: {
          include: {
            course: true,
            session: true,
            enrollments: {
              select: {
                id: true
              }
            }
          },
          orderBy: [
            { period: 'asc' },
            { days: 'asc' }
          ]
        },
        homerooms: {
          include: {
            school: true,
            enrollments: {
              select: {
                id: true
              }
            }
          }
        }
      }
    });
    
    if (!staff) {
      res.status(404).json({ error: 'Staff member not found' });
      return;
    }
    
    // Format schedule data
    const schedule = {
      staff: {
        id: staff.id,
        name: `${staff.firstName} ${staff.lastName}`,
        position: staff.position,
        department: staff.department
      },
      courses: staff.courseSections.map(section => ({
        id: section.id,
        courseName: section.course.name,
        courseCode: section.course.courseCode,
        sectionIdentifier: section.sectionIdentifier,
        period: section.period,
        time: section.time,
        days: section.days,
        roomNumber: section.roomNumber,
        studentCount: section.enrollments.length,
        maxStudents: section.maxStudents
      })),
      homerooms: staff.homerooms.map(homeroom => ({
        id: homeroom.id,
        name: homeroom.name,
        roomNumber: homeroom.roomNumber,
        gradeLevel: homeroom.gradeLevel,
        studentCount: homeroom.enrollments.length,
        capacity: homeroom.capacity
      }))
    };
    
    res.json(schedule);
  } catch (error) {
    console.error('Error fetching staff schedule:', error);
    res.status(500).json({ error: 'Failed to fetch staff schedule' });
  }
};

// Get staff statistics
export const getStaffStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalStaff = await prisma.staff.count();
    
    const byPosition = await prisma.staff.groupBy({
      by: ['position'],
      _count: {
        position: true
      }
    });
    
    const byDepartment = await prisma.staff.groupBy({
      by: ['department'],
      _count: {
        department: true
      },
      where: {
        department: {
          not: null
        }
      }
    });
    
    const activeStaff = await prisma.staff.count({
      where: {
        user: {
          isActive: true
        }
      }
    });
    
    const stats = {
      total: totalStaff,
      active: activeStaff,
      inactive: totalStaff - activeStaff,
      byPosition: byPosition.map(p => ({
        position: p.position,
        count: p._count.position
      })),
      byDepartment: byDepartment.map(d => ({
        department: d.department,
        count: d._count.department
      }))
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching staff statistics:', error);
    res.status(500).json({ error: 'Failed to fetch staff statistics' });
  }
};