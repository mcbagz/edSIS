import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import type { AuthRequest } from '../middleware/auth';

export const authController = {
  // Login
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ message: 'Email and password are required' });
        return;
      }

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          student: true,
          staff: true,
          parent: true,
        },
      });

      if (!user || !user.isActive) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      );

      // Get additional user info based on role
      let additionalInfo = {};
      if (user.role === 'STUDENT' && user.student) {
        additionalInfo = {
          studentId: user.student.id,
          studentUniqueId: user.student.studentUniqueId,
          gradeLevel: user.student.gradeLevel,
        };
      } else if (user.role === 'TEACHER' && user.staff) {
        additionalInfo = {
          staffId: user.staff.id,
          staffUniqueId: user.staff.staffUniqueId,
          position: user.staff.position,
        };
      } else if (user.role === 'PARENT' && user.parent) {
        additionalInfo = {
          parentId: user.parent.id,
        };
      }

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          ...additionalInfo,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  },

  // Get current user
  async getCurrentUser(req: AuthRequest, res: Response) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: {
          student: true,
          staff: true,
          parent: true,
        },
      });

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        student: user.student,
        staff: user.staff,
        parent: user.parent,
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({ message: 'Failed to get user data' });
    }
  },

  // Change password
  async changePassword(req: AuthRequest, res: Response) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400).json({ message: 'Current and new passwords are required' });
        return;
      }

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
      });

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        res.status(401).json({ message: 'Current password is incorrect' });
        return;
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ message: 'Failed to change password' });
    }
  },

  // Logout (client-side token removal)
  async logout(_req: Request, res: Response) {
    // Since we're using JWT, logout is handled client-side
    // This endpoint can be used for logging or cleanup if needed
    res.json({ message: 'Logged out successfully' });
  },
};