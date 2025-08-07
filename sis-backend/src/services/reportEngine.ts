import { PrismaClient } from '../generated/prisma';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sql: string;
  parameters: ReportParameter[];
  allowedRoles: string[];
  category: string;
}

export interface ReportParameter {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'array';
  required: boolean;
  description?: string;
  defaultValue?: any;
  validation?: {
    min?: number | Date;
    max?: number | Date;
    pattern?: string;
    enum?: any[];
  };
}

export interface ReportRequest {
  templateId: string;
  parameters: Record<string, any>;
  outputMode?: 'raw' | 'stream';
  format?: 'json' | 'csv' | 'pdf';
}

export interface ReportResult {
  columns: Array<{ name: string; type: string }>;
  rows?: any[];
  rowStream?: Readable;
  metadata: {
    executedAt: Date;
    rowCount?: number;
    templateName: string;
  };
}

// Built-in report templates
const builtInTemplates: ReportTemplate[] = [
  {
    id: 'student-roster',
    name: 'Student Roster',
    description: 'List of all active students with demographic information',
    category: 'Students',
    sql: `
      SELECT 
        s."studentUniqueId" AS "Student ID",
        s."firstName" AS "First Name",
        s."lastName" AS "Last Name",
        s."gradeLevel" AS "Grade Level",
        s."enrollmentDate" AS "Enrollment Date",
        s."email" AS "Email",
        s."phone" AS "Phone",
        s."address" AS "Address",
        s."city" AS "City",
        s."state" AS "State",
        s."zipCode" AS "Zip Code"
      FROM "Student" s
      WHERE s."enrollmentStatus" = 'Active'
      {{#if gradeLevel}}
        AND s."gradeLevel" = $1
      {{/if}}
      {{#if startDate}}
        AND s."enrollmentDate" >= $2
      {{/if}}
      {{#if endDate}}
        AND s."enrollmentDate" <= $3
      {{/if}}
      ORDER BY s."lastName", s."firstName"
    `,
    parameters: [
      {
        name: 'gradeLevel',
        type: 'string',
        required: false,
        description: 'Filter by grade level'
      },
      {
        name: 'startDate',
        type: 'date',
        required: false,
        description: 'Enrollment start date'
      },
      {
        name: 'endDate',
        type: 'date',
        required: false,
        description: 'Enrollment end date'
      }
    ],
    allowedRoles: ['ADMIN', 'TEACHER']
  },
  {
    id: 'attendance-summary',
    name: 'Attendance Summary',
    description: 'Summary of attendance by student and date range',
    category: 'Attendance',
    sql: `
      SELECT 
        s."studentUniqueId" AS "Student ID",
        s."firstName" AS "First Name",
        s."lastName" AS "Last Name",
        s."gradeLevel" AS "Grade Level",
        COUNT(CASE WHEN a."attendanceCode" = 'Present' THEN 1 END) AS "Days Present",
        COUNT(CASE WHEN a."attendanceCode" = 'Absent' THEN 1 END) AS "Days Absent",
        COUNT(CASE WHEN a."attendanceCode" = 'Tardy' THEN 1 END) AS "Days Tardy",
        COUNT(CASE WHEN a."attendanceCode" = 'Excused' THEN 1 END) AS "Days Excused",
        COUNT(*) AS "Total Days",
        ROUND(
          CAST(COUNT(CASE WHEN a."attendanceCode" = 'Present' THEN 1 END) AS DECIMAL) / 
          NULLIF(COUNT(*), 0) * 100, 2
        ) AS "Attendance Rate %"
      FROM "Student" s
      LEFT JOIN "Attendance" a ON s."id" = a."studentId"
      WHERE 1=1
      {{#if startDate}}
        AND a."date" >= $1
      {{/if}}
      {{#if endDate}}
        AND a."date" <= $2
      {{/if}}
      {{#if gradeLevel}}
        AND s."gradeLevel" = $3
      {{/if}}
      GROUP BY s."id", s."studentUniqueId", s."firstName", s."lastName", s."gradeLevel"
      ORDER BY s."lastName", s."firstName"
    `,
    parameters: [
      {
        name: 'startDate',
        type: 'date',
        required: true,
        description: 'Start date for attendance period'
      },
      {
        name: 'endDate',
        type: 'date',
        required: true,
        description: 'End date for attendance period'
      },
      {
        name: 'gradeLevel',
        type: 'string',
        required: false,
        description: 'Filter by grade level'
      }
    ],
    allowedRoles: ['ADMIN', 'TEACHER']
  },
  {
    id: 'grade-distribution',
    name: 'Grade Distribution',
    description: 'Distribution of grades by course and grading period',
    category: 'Grades',
    sql: `
      SELECT 
        c."name" AS "Course",
        cs."sectionIdentifier" AS "Section",
        gp."name" AS "Grading Period",
        COUNT(CASE WHEN g."letterGrade" IN ('A', 'A+') THEN 1 END) AS "A",
        COUNT(CASE WHEN g."letterGrade" = 'A-' THEN 1 END) AS "A-",
        COUNT(CASE WHEN g."letterGrade" = 'B+' THEN 1 END) AS "B+",
        COUNT(CASE WHEN g."letterGrade" = 'B' THEN 1 END) AS "B",
        COUNT(CASE WHEN g."letterGrade" = 'B-' THEN 1 END) AS "B-",
        COUNT(CASE WHEN g."letterGrade" = 'C+' THEN 1 END) AS "C+",
        COUNT(CASE WHEN g."letterGrade" = 'C' THEN 1 END) AS "C",
        COUNT(CASE WHEN g."letterGrade" = 'C-' THEN 1 END) AS "C-",
        COUNT(CASE WHEN g."letterGrade" = 'D+' THEN 1 END) AS "D+",
        COUNT(CASE WHEN g."letterGrade" = 'D' THEN 1 END) AS "D",
        COUNT(CASE WHEN g."letterGrade" = 'D-' THEN 1 END) AS "D-",
        COUNT(CASE WHEN g."letterGrade" = 'F' THEN 1 END) AS "F",
        COUNT(*) AS "Total Students",
        ROUND(AVG(g."numericGrade"), 2) AS "Average Grade"
      FROM "Grade" g
      JOIN "CourseSection" cs ON g."courseSectionId" = cs."id"
      JOIN "Course" c ON cs."courseId" = c."id"
      LEFT JOIN "GradingPeriod" gp ON g."gradingPeriodId" = gp."id"
      WHERE g."gradeType" = 'Final'
      {{#if gradingPeriodId}}
        AND g."gradingPeriodId" = $1
      {{/if}}
      {{#if courseId}}
        AND c."id" = $2
      {{/if}}
      GROUP BY c."name", cs."sectionIdentifier", gp."name"
      ORDER BY c."name", cs."sectionIdentifier"
    `,
    parameters: [
      {
        name: 'gradingPeriodId',
        type: 'string',
        required: false,
        description: 'Filter by grading period'
      },
      {
        name: 'courseId',
        type: 'string',
        required: false,
        description: 'Filter by course'
      }
    ],
    allowedRoles: ['ADMIN', 'TEACHER']
  },
  {
    id: 'demographic-breakdown',
    name: 'Demographic Breakdown',
    description: 'Student demographics by grade level and enrollment status',
    category: 'Demographics',
    sql: `
      SELECT 
        s."gradeLevel" AS "Grade Level",
        s."gender" AS "Gender",
        s."ethnicity" AS "Ethnicity",
        s."enrollmentStatus" AS "Enrollment Status",
        COUNT(*) AS "Count",
        ROUND(
          CAST(COUNT(*) AS DECIMAL) / 
          (SELECT COUNT(*) FROM "Student" WHERE "enrollmentStatus" = 'Active') * 100, 
          2
        ) AS "Percentage %"
      FROM "Student" s
      WHERE 1=1
      {{#if enrollmentStatus}}
        AND s."enrollmentStatus" = $1
      {{/if}}
      {{#if gradeLevel}}
        AND s."gradeLevel" = $2
      {{/if}}
      GROUP BY s."gradeLevel", s."gender", s."ethnicity", s."enrollmentStatus"
      ORDER BY s."gradeLevel", COUNT(*) DESC
    `,
    parameters: [
      {
        name: 'enrollmentStatus',
        type: 'string',
        required: false,
        description: 'Filter by enrollment status',
        defaultValue: 'Active'
      },
      {
        name: 'gradeLevel',
        type: 'string',
        required: false,
        description: 'Filter by grade level'
      }
    ],
    allowedRoles: ['ADMIN']
  },
  {
    id: 'course-enrollment',
    name: 'Course Enrollment Report',
    description: 'Enrollment numbers by course and section',
    category: 'Enrollment',
    sql: `
      SELECT 
        c."courseCode" AS "Course Code",
        c."name" AS "Course Name",
        cs."sectionIdentifier" AS "Section",
        cs."period" AS "Period",
        cs."time" AS "Time",
        st."firstName" || ' ' || st."lastName" AS "Teacher",
        cs."maxStudents" AS "Max Capacity",
        cs."currentEnrollment" AS "Current Enrollment",
        cs."maxStudents" - cs."currentEnrollment" AS "Available Seats",
        ROUND(
          CAST(cs."currentEnrollment" AS DECIMAL) / 
          NULLIF(cs."maxStudents", 0) * 100, 
          2
        ) AS "Fill Rate %"
      FROM "CourseSection" cs
      JOIN "Course" c ON cs."courseId" = c."id"
      JOIN "Staff" st ON cs."teacherId" = st."id"
      WHERE 1=1
      {{#if sessionId}}
        AND cs."sessionId" = $1
      {{/if}}
      {{#if courseId}}
        AND c."id" = $2
      {{/if}}
      ORDER BY c."name", cs."sectionIdentifier"
    `,
    parameters: [
      {
        name: 'sessionId',
        type: 'string',
        required: false,
        description: 'Filter by session'
      },
      {
        name: 'courseId',
        type: 'string',
        required: false,
        description: 'Filter by course'
      }
    ],
    allowedRoles: ['ADMIN', 'TEACHER']
  },
  {
    id: 'discipline-incidents',
    name: 'Discipline Incidents Report',
    description: 'Summary of discipline incidents by student and type',
    category: 'Discipline',
    sql: `
      SELECT 
        s."studentUniqueId" AS "Student ID",
        s."firstName" AS "First Name",
        s."lastName" AS "Last Name",
        s."gradeLevel" AS "Grade Level",
        di."incidentDate" AS "Incident Date",
        di."behaviorCode" AS "Behavior Code",
        di."incidentLocation" AS "Location",
        da."actionType" AS "Action Taken",
        da."duration" AS "Duration"
      FROM "StudentDisciplineIncident" sdi
      JOIN "Student" s ON sdi."studentId" = s."id"
      JOIN "DisciplineIncident" di ON sdi."incidentId" = di."id"
      LEFT JOIN "DisciplineAction" da ON di."id" = da."incidentId"
      WHERE 1=1
      {{#if startDate}}
        AND di."incidentDate" >= $1
      {{/if}}
      {{#if endDate}}
        AND di."incidentDate" <= $2
      {{/if}}
      {{#if gradeLevel}}
        AND s."gradeLevel" = $3
      {{/if}}
      {{#if behaviorCode}}
        AND di."behaviorCode" = $4
      {{/if}}
      ORDER BY di."incidentDate" DESC, s."lastName", s."firstName"
    `,
    parameters: [
      {
        name: 'startDate',
        type: 'date',
        required: false,
        description: 'Start date for incidents'
      },
      {
        name: 'endDate',
        type: 'date',
        required: false,
        description: 'End date for incidents'
      },
      {
        name: 'gradeLevel',
        type: 'string',
        required: false,
        description: 'Filter by grade level'
      },
      {
        name: 'behaviorCode',
        type: 'string',
        required: false,
        description: 'Filter by behavior code'
      }
    ],
    allowedRoles: ['ADMIN']
  }
];

export class ReportEngine {
  private templates: Map<string, ReportTemplate>;

  constructor() {
    this.templates = new Map();
    // Load built-in templates
    builtInTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  // Register a new template
  registerTemplate(template: ReportTemplate): void {
    this.templates.set(template.id, template);
  }

  // Get all available templates for a role
  getAvailableTemplates(userRole: string): ReportTemplate[] {
    return Array.from(this.templates.values()).filter(template =>
      template.allowedRoles.includes(userRole)
    );
  }

  // Get a specific template
  getTemplate(templateId: string): ReportTemplate | undefined {
    return this.templates.get(templateId);
  }

  // Validate parameters against template requirements
  private validateParameters(
    template: ReportTemplate,
    providedParams: Record<string, any>
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const param of template.parameters) {
      const value = providedParams[param.name];

      // Check required parameters
      if (param.required && (value === undefined || value === null || value === '')) {
        errors.push(`Parameter '${param.name}' is required`);
        continue;
      }

      // Skip validation if parameter is not provided and not required
      if (!param.required && (value === undefined || value === null || value === '')) {
        continue;
      }

      // Type validation
      switch (param.type) {
        case 'number':
          if (typeof value !== 'number' && isNaN(Number(value))) {
            errors.push(`Parameter '${param.name}' must be a number`);
          }
          break;
        case 'date':
          if (!(value instanceof Date) && isNaN(Date.parse(value))) {
            errors.push(`Parameter '${param.name}' must be a valid date`);
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push(`Parameter '${param.name}' must be a boolean`);
          }
          break;
        case 'array':
          if (!Array.isArray(value)) {
            errors.push(`Parameter '${param.name}' must be an array`);
          }
          break;
      }

      // Additional validation rules
      if (param.validation) {
        if (param.validation.min !== undefined) {
          const minValue = param.type === 'date' 
            ? new Date(param.validation.min) 
            : param.validation.min;
          const currentValue = param.type === 'date' 
            ? new Date(value) 
            : value;
          
          if (currentValue < minValue) {
            errors.push(`Parameter '${param.name}' must be >= ${minValue}`);
          }
        }

        if (param.validation.max !== undefined) {
          const maxValue = param.type === 'date' 
            ? new Date(param.validation.max) 
            : param.validation.max;
          const currentValue = param.type === 'date' 
            ? new Date(value) 
            : value;
          
          if (currentValue > maxValue) {
            errors.push(`Parameter '${param.name}' must be <= ${maxValue}`);
          }
        }

        if (param.validation.pattern) {
          const regex = new RegExp(param.validation.pattern);
          if (!regex.test(value)) {
            errors.push(`Parameter '${param.name}' does not match required pattern`);
          }
        }

        if (param.validation.enum && !param.validation.enum.includes(value)) {
          errors.push(`Parameter '${param.name}' must be one of: ${param.validation.enum.join(', ')}`);
        }
      }
    }

    // Check for date range validity
    if (providedParams.startDate && providedParams.endDate) {
      const start = new Date(providedParams.startDate);
      const end = new Date(providedParams.endDate);
      if (start > end) {
        errors.push('Start date must be before or equal to end date');
      }
      
      // Maximum date range check (1 year)
      const maxRange = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
      if (end.getTime() - start.getTime() > maxRange) {
        errors.push('Date range cannot exceed 1 year');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Process SQL template with parameters (simple template processing)
  private processSQLTemplate(sql: string, params: Record<string, any>): { sql: string; values: any[] } {
    let processedSQL = sql;
    const values: any[] = [];
    let paramIndex = 1;

    // Simple conditional processing ({{#if param}} ... {{/if}})
    const conditionalRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
    
    processedSQL = processedSQL.replace(conditionalRegex, (match, paramName, content) => {
      if (params[paramName] !== undefined && params[paramName] !== null && params[paramName] !== '') {
        values.push(params[paramName]);
        return content;
      }
      return '';
    });

    // Clean up extra whitespace and empty lines
    processedSQL = processedSQL
      .split('\n')
      .filter(line => line.trim() !== '')
      .join('\n')
      .replace(/\s+WHERE\s+1=1\s+ORDER/, ' ORDER')
      .replace(/\s+WHERE\s+1=1$/, '');

    return { sql: processedSQL, values };
  }

  // Execute a report
  async executeReport(request: ReportRequest, userRole: string): Promise<ReportResult> {
    const template = this.templates.get(request.templateId);
    
    if (!template) {
      throw new Error(`Report template '${request.templateId}' not found`);
    }

    // Check role permissions
    if (!template.allowedRoles.includes(userRole)) {
      throw new Error(`Unauthorized access to report '${template.name}'`);
    }

    // Validate parameters
    const validation = this.validateParameters(template, request.parameters);
    if (!validation.valid) {
      throw new Error(`Invalid parameters: ${validation.errors.join(', ')}`);
    }

    // Process SQL template
    const { sql, values } = this.processSQLTemplate(template.sql, request.parameters);

    try {
      // Execute query
      const result = await prisma.$queryRawUnsafe(sql, ...values);
      const rows = result as any[];

      // Extract column information
      const columns = rows.length > 0 
        ? Object.keys(rows[0]).map(name => ({
            name,
            type: typeof rows[0][name]
          }))
        : [];

      return {
        columns,
        rows: request.outputMode === 'stream' ? undefined : rows,
        rowStream: request.outputMode === 'stream' ? this.createRowStream(rows) : undefined,
        metadata: {
          executedAt: new Date(),
          rowCount: rows.length,
          templateName: template.name
        }
      };
    } catch (error) {
      console.error('Report execution error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to execute report: ${errorMessage}`);
    }
  }

  // Create a readable stream from rows
  private createRowStream(rows: any[]): Readable {
    const stream = new Readable({
      objectMode: true,
      read() {
        // Data is pushed in the constructor
      }
    });

    // Push data to stream
    rows.forEach(row => stream.push(row));
    stream.push(null); // Signal end of stream

    return stream;
  }

  // Get report categories
  getCategories(): string[] {
    const categories = new Set<string>();
    this.templates.forEach(template => {
      categories.add(template.category);
    });
    return Array.from(categories);
  }
}

// Create singleton instance
export const reportEngine = new ReportEngine();