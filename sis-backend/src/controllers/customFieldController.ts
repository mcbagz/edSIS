import { Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

export const customFieldController = {
  // Get all custom field definitions
  async getFieldDefinitions(req: Request, res: Response) {
    try {
      const { entityType } = req.query;
      
      const where = entityType ? { entityType: entityType as string } : {};
      
      const fields = await prisma.customFieldDefinition.findMany({
        where: {
          ...where,
          isActive: true
        },
        orderBy: {
          displayOrder: 'asc'
        }
      });
      
      res.json(fields);
    } catch (error) {
      console.error('Error fetching custom field definitions:', error);
      res.status(500).json({ error: 'Failed to fetch custom field definitions' });
    }
  },

  // Create custom field definition
  async createFieldDefinition(req: Request, res: Response) {
    try {
      const { name, label, fieldType, entityType, options, required, defaultValue, displayOrder } = req.body;
      
      const field = await prisma.customFieldDefinition.create({
        data: {
          name,
          label,
          fieldType,
          entityType,
          options,
          required: required || false,
          defaultValue,
          displayOrder: displayOrder || 0
        }
      });
      
      res.status(201).json(field);
    } catch (error) {
      console.error('Error creating custom field definition:', error);
      res.status(500).json({ error: 'Failed to create custom field definition' });
    }
  },

  // Update custom field definition
  async updateFieldDefinition(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const field = await prisma.customFieldDefinition.update({
        where: { id },
        data: updateData
      });
      
      res.json(field);
    } catch (error) {
      console.error('Error updating custom field definition:', error);
      res.status(500).json({ error: 'Failed to update custom field definition' });
    }
  },

  // Delete custom field definition (soft delete)
  async deleteFieldDefinition(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const field = await prisma.customFieldDefinition.update({
        where: { id },
        data: { isActive: false }
      });
      
      res.json({ message: 'Field definition deleted successfully' });
    } catch (error) {
      console.error('Error deleting custom field definition:', error);
      res.status(500).json({ error: 'Failed to delete custom field definition' });
    }
  },

  // Get student custom field values
  async getStudentCustomFields(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      
      const customFields = await prisma.studentCustomField.findMany({
        where: { studentId },
        include: {
          field: true
        }
      });
      
      res.json(customFields);
    } catch (error) {
      console.error('Error fetching student custom fields:', error);
      res.status(500).json({ error: 'Failed to fetch student custom fields' });
    }
  },

  // Update student custom field values
  async updateStudentCustomFields(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      const { fields } = req.body; // Array of { fieldId, value }
      
      const results = await Promise.all(
        fields.map(async (field: { fieldId: string; value: string }) => {
          return prisma.studentCustomField.upsert({
            where: {
              studentId_fieldId: {
                studentId,
                fieldId: field.fieldId
              }
            },
            update: {
              value: field.value
            },
            create: {
              studentId,
              fieldId: field.fieldId,
              value: field.value
            }
          });
        })
      );
      
      res.json(results);
    } catch (error) {
      console.error('Error updating student custom fields:', error);
      res.status(500).json({ error: 'Failed to update student custom fields' });
    }
  },

  // Get attendance codes
  async getAttendanceCodes(req: Request, res: Response) {
    try {
      const codes = await prisma.attendanceCode.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' }
      });
      
      res.json(codes);
    } catch (error) {
      console.error('Error fetching attendance codes:', error);
      res.status(500).json({ error: 'Failed to fetch attendance codes' });
    }
  },

  // Create attendance code
  async createAttendanceCode(req: Request, res: Response) {
    try {
      const { code, name, description, type, countsAsPresent, countsAsAbsent, countsAsTardy, isExcused, displayOrder } = req.body;
      
      const attendanceCode = await prisma.attendanceCode.create({
        data: {
          code,
          name,
          description,
          type,
          countsAsPresent: countsAsPresent || false,
          countsAsAbsent: countsAsAbsent || false,
          countsAsTardy: countsAsTardy || false,
          isExcused: isExcused || false,
          displayOrder: displayOrder || 0
        }
      });
      
      res.status(201).json(attendanceCode);
    } catch (error) {
      console.error('Error creating attendance code:', error);
      res.status(500).json({ error: 'Failed to create attendance code' });
    }
  },

  // Update attendance code
  async updateAttendanceCode(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const code = await prisma.attendanceCode.update({
        where: { id },
        data: updateData
      });
      
      res.json(code);
    } catch (error) {
      console.error('Error updating attendance code:', error);
      res.status(500).json({ error: 'Failed to update attendance code' });
    }
  },

  // Delete attendance code (soft delete)
  async deleteAttendanceCode(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const code = await prisma.attendanceCode.update({
        where: { id },
        data: { isActive: false }
      });
      
      res.json({ message: 'Attendance code deleted successfully' });
    } catch (error) {
      console.error('Error deleting attendance code:', error);
      res.status(500).json({ error: 'Failed to delete attendance code' });
    }
  }
};