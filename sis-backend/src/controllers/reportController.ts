import type { Request, Response } from 'express';
import { reportEngine } from '../services/reportEngine';
import type { ReportRequest } from '../services/reportEngine';
import { PrismaClient } from '../generated/prisma';
import { Parser } from 'json2csv';
import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Audit logging for report access
async function logReportAccess(
  userId: string,
  reportId: string,
  parameters: any,
  format: string,
  success: boolean,
  error?: string
) {
  try {
    // In a real system, this would be a separate audit table
    console.log('Report Access Audit:', {
      userId,
      reportId,
      parameters: JSON.stringify(parameters),
      format,
      success,
      error,
      timestamp: new Date().toISOString()
    });
    
    // You could also store this in a database table
    // await prisma.auditLog.create({
    //   data: {
    //     userId,
    //     action: 'REPORT_ACCESS',
    //     resource: reportId,
    //     details: { parameters, format, success, error },
    //     timestamp: new Date()
    //   }
    // });
  } catch (err) {
    console.error('Failed to log report access:', err);
  }
}

export const reportController = {
  // Get available report templates
  async getTemplates(req: Request, res: Response) {
    try {
      const userRole = (req as any).user?.role || 'GUEST';
      const templates = reportEngine.getAvailableTemplates(userRole);
      
      res.json({
        templates: templates.map(t => ({
          id: t.id,
          name: t.name,
          description: t.description,
          category: t.category,
          parameters: t.parameters
        })),
        categories: reportEngine.getCategories()
      });
    } catch (error) {
      console.error('Error fetching report templates:', error);
      res.status(500).json({ error: 'Failed to fetch report templates' });
    }
  },

  // Execute a report
  async executeReport(req: Request, res: Response) {
    try {
      const { templateId, parameters = {}, format = 'json' } = req.body;
      const userId = (req as any).user?.id || 'unknown';
      const userRole = (req as any).user?.role || 'GUEST';

      if (!templateId) {
        await logReportAccess(userId, templateId, parameters, format, false, 'Missing templateId');
        res.status(400).json({ error: 'Template ID is required' });
        return;
      }

      // Check if template exists
      const template = reportEngine.getTemplate(templateId);
      if (!template) {
        await logReportAccess(userId, templateId, parameters, format, false, 'Template not found');
        res.status(404).json({ error: 'Report template not found' });
        return;
      }

      // Execute the report
      const reportRequest: ReportRequest = {
        templateId,
        parameters,
        outputMode: 'raw',
        format
      };

      const result = await reportEngine.executeReport(reportRequest, userRole);
      
      // Log successful access
      await logReportAccess(userId, templateId, parameters, format, true);

      // Return based on format
      switch (format) {
        case 'json':
          res.json({
            template: {
              id: template.id,
              name: template.name,
              description: template.description
            },
            data: {
              columns: result.columns,
              rows: result.rows,
              metadata: result.metadata
            }
          });
          break;

        case 'csv':
          if (!result.rows || result.rows.length === 0) {
            res.status(204).send();
            return;
          }

          const parser = new Parser({
            fields: result.columns.map(c => c.name)
          });
          const csv = parser.parse(result.rows);
          
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="${template.id}-${Date.now()}.csv"`);
          res.send(csv);
          break;

        case 'pdf':
          // Generate PDF (will be implemented in the PDF generation task)
          const pdfBuffer = await generatePDFReport(template, result);
          
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${template.id}-${Date.now()}.pdf"`);
          res.send(pdfBuffer);
          break;

        default:
          res.status(400).json({ error: 'Invalid format. Use json, csv, or pdf' });
      }
    } catch (error) {
      const userId = (req as any).user?.id || 'unknown';
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await logReportAccess(
        userId,
        req.body.templateId,
        req.body.parameters,
        req.body.format,
        false,
        errorMessage
      );
      
      console.error('Error executing report:', error);
      res.status(500).json({ error: errorMessage || 'Failed to execute report' });
    }
  },

  // Stream large CSV reports
  async streamReport(req: Request, res: Response) {
    try {
      const { templateId, parameters = {} } = req.query;
      const userId = (req as any).user?.id || 'unknown';
      const userRole = (req as any).user?.role || 'GUEST';

      if (!templateId) {
        await logReportAccess(userId, templateId as string, parameters, 'csv-stream', false, 'Missing templateId');
        res.status(400).json({ error: 'Template ID is required' });
        return;
      }

      const template = reportEngine.getTemplate(templateId as string);
      if (!template) {
        await logReportAccess(userId, templateId as string, parameters, 'csv-stream', false, 'Template not found');
        res.status(404).json({ error: 'Report template not found' });
        return;
      }

      // Parse parameters from query string
      const parsedParams: Record<string, any> = {};
      Object.keys(parameters).forEach(key => {
        const value = (parameters as any)[key];
        // Try to parse dates and numbers
        if (/^\d{4}-\d{2}-\d{2}/.test(value as string)) {
          parsedParams[key] = new Date(value as string);
        } else if (!isNaN(Number(value))) {
          parsedParams[key] = Number(value);
        } else {
          parsedParams[key] = value;
        }
      });

      const reportRequest: ReportRequest = {
        templateId: templateId as string,
        parameters: parsedParams,
        outputMode: 'stream'
      };

      const result = await reportEngine.executeReport(reportRequest, userRole);
      
      // Set up CSV streaming
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${templateId}-${Date.now()}.csv"`);
      res.setHeader('Transfer-Encoding', 'chunked');

      // Write CSV header
      if (result.columns.length > 0) {
        const header = result.columns.map(c => `"${c.name}"`).join(',') + '\n';
        res.write(header);
      }

      // Stream rows
      if (result.rowStream) {
        result.rowStream.on('data', (row) => {
          const values = result.columns.map(c => {
            const value = row[c.name];
            if (value === null || value === undefined) return '';
            if (typeof value === 'string' && value.includes(',')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          });
          res.write(values.join(',') + '\n');
        });

        result.rowStream.on('end', () => {
          logReportAccess(userId, templateId as string, parsedParams, 'csv-stream', true);
          res.end();
        });

        result.rowStream.on('error', (error) => {
          logReportAccess(userId, templateId as string, parsedParams, 'csv-stream', false, error.message);
          res.status(500).end();
        });
      } else {
        res.end();
      }
    } catch (error) {
      console.error('Error streaming report:', error);
      res.status(500).json({ error: 'Failed to stream report' });
    }
  },

  // Get report data for charts
  async getChartData(req: Request, res: Response) {
    try {
      const { templateId, parameters = {} } = req.query;
      const userRole = (req as any).user?.role || 'GUEST';

      if (!templateId) {
        res.status(400).json({ error: 'Template ID is required' });
        return;
      }

      // Parse parameters
      const parsedParams: Record<string, any> = {};
      Object.keys(parameters).forEach(key => {
        const value = (parameters as any)[key];
        if (/^\d{4}-\d{2}-\d{2}/.test(value as string)) {
          parsedParams[key] = new Date(value as string);
        } else if (!isNaN(Number(value))) {
          parsedParams[key] = Number(value);
        } else {
          parsedParams[key] = value;
        }
      });

      const reportRequest: ReportRequest = {
        templateId: templateId as string,
        parameters: parsedParams,
        outputMode: 'raw'
      };

      const result = await reportEngine.executeReport(reportRequest, userRole);
      
      // Transform data for charts based on template type
      const chartData = transformDataForChart(templateId as string, result);
      
      res.json(chartData);
    } catch (error) {
      console.error('Error getting chart data:', error);
      res.status(500).json({ error: 'Failed to get chart data' });
    }
  },

  // Schedule a report (placeholder for future implementation)
  async scheduleReport(req: Request, res: Response) {
    try {
      const { templateId, parameters, schedule, recipients, format } = req.body;
      const userId = (req as any).user?.id;

      // In a real implementation, this would:
      // 1. Validate the schedule (cron expression or similar)
      // 2. Store the scheduled report in database
      // 3. Set up a job queue (Bull, Agenda, etc.) to execute the report
      // 4. Send results to recipients via email

      res.json({
        message: 'Report scheduled successfully',
        scheduledReport: {
          id: `scheduled-${Date.now()}`,
          templateId,
          schedule,
          recipients,
          format,
          createdBy: userId,
          createdAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error scheduling report:', error);
      res.status(500).json({ error: 'Failed to schedule report' });
    }
  },

  // Get report execution history
  async getReportHistory(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;
      
      // In a real implementation, this would query the audit log
      // For now, return a mock response
      res.json({
        history: [
          {
            id: '1',
            templateId: 'student-roster',
            templateName: 'Student Roster',
            executedBy: userId,
            executedAt: new Date(),
            format: 'pdf',
            status: 'success',
            rowCount: 150
          }
        ]
      });
    } catch (error) {
      console.error('Error fetching report history:', error);
      res.status(500).json({ error: 'Failed to fetch report history' });
    }
  }
};

// Helper function to generate PDF report
async function generatePDFReport(template: any, result: any): Promise<Buffer> {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Generate HTML content
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${template.name}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }
          h1 {
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
          }
          .metadata {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th {
            background-color: #3498db;
            color: white;
            padding: 10px;
            text-align: left;
            font-weight: bold;
          }
          td {
            padding: 8px;
            border-bottom: 1px solid #ddd;
          }
          tr:nth-child(even) {
            background-color: #f2f2f2;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <h1>${template.name}</h1>
        <div class="metadata">
          <p><strong>Description:</strong> ${template.description}</p>
          <p><strong>Generated:</strong> ${result.metadata.executedAt.toLocaleString()}</p>
          <p><strong>Total Records:</strong> ${result.metadata.rowCount}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              ${result.columns.map((col: any) => `<th>${col.name}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${result.rows.slice(0, 1000).map((row: any) => `
              <tr>
                ${result.columns.map((col: any) => {
                  const value = row[col.name];
                  if (value === null || value === undefined) return '<td></td>';
                  if (value instanceof Date) return `<td>${value.toLocaleDateString()}</td>`;
                  return `<td>${value}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        ${result.rows.length > 1000 ? '<p><em>Note: Showing first 1000 records only</em></p>' : ''}
        
        <div class="footer">
          <p>Generated by Student Information System</p>
          <p>${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });
    
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

// Helper function to transform data for charts
function transformDataForChart(templateId: string, result: any) {
  const rows = result.rows || [];
  
  switch (templateId) {
    case 'attendance-summary':
      // Transform for attendance chart
      const attendanceData = {
        labels: rows.map((r: any) => `${r['First Name']} ${r['Last Name']}`).slice(0, 20),
        datasets: [
          {
            label: 'Days Present',
            data: rows.map((r: any) => r['Days Present']).slice(0, 20),
            backgroundColor: 'rgba(75, 192, 192, 0.6)'
          },
          {
            label: 'Days Absent',
            data: rows.map((r: any) => r['Days Absent']).slice(0, 20),
            backgroundColor: 'rgba(255, 99, 132, 0.6)'
          },
          {
            label: 'Days Tardy',
            data: rows.map((r: any) => r['Days Tardy']).slice(0, 20),
            backgroundColor: 'rgba(255, 206, 86, 0.6)'
          }
        ]
      };
      return { type: 'bar', data: attendanceData };

    case 'grade-distribution':
      // Transform for grade distribution chart
      if (rows.length === 0) return { type: 'pie', data: { labels: [], datasets: [] } };
      
      const gradeColumns = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];
      const gradeTotals = gradeColumns.reduce((acc: any, grade) => {
        acc[grade] = rows.reduce((sum: number, row: any) => sum + (row[grade] || 0), 0);
        return acc;
      }, {} as Record<string, number>);
      
      return {
        type: 'pie',
        data: {
          labels: gradeColumns,
          datasets: [{
            data: gradeColumns.map(g => gradeTotals[g]),
            backgroundColor: [
              '#4CAF50', '#8BC34A', '#CDDC39',
              '#FFEB3B', '#FFC107', '#FF9800',
              '#FF5722', '#F44336', '#E91E63',
              '#9C27B0', '#673AB7', '#3F51B5'
            ]
          }]
        }
      };

    case 'demographic-breakdown':
      // Transform for demographic chart
      const demographics = {
        labels: rows.map((r: any) => `${r['Grade Level']} - ${r['Gender'] || 'Unknown'}`).slice(0, 15),
        datasets: [{
          label: 'Student Count',
          data: rows.map((r: any) => r['Count']).slice(0, 15),
          backgroundColor: 'rgba(54, 162, 235, 0.6)'
        }]
      };
      return { type: 'bar', data: demographics };

    case 'course-enrollment':
      // Transform for enrollment chart
      const enrollment = {
        labels: rows.map((r: any) => r['Course Name']).slice(0, 20),
        datasets: [
          {
            label: 'Current Enrollment',
            data: rows.map((r: any) => r['Current Enrollment']).slice(0, 20),
            backgroundColor: 'rgba(75, 192, 192, 0.6)'
          },
          {
            label: 'Max Capacity',
            data: rows.map((r: any) => r['Max Capacity']).slice(0, 20),
            backgroundColor: 'rgba(255, 159, 64, 0.6)'
          }
        ]
      };
      return { type: 'bar', data: enrollment };

    default:
      // Generic transformation - use first numeric column for chart
      const numericColumns = result.columns.filter((c: any) => c.type === 'number');
      if (numericColumns.length === 0 || rows.length === 0) {
        return { type: 'bar', data: { labels: [], datasets: [] } };
      }
      
      return {
        type: 'bar',
        data: {
          labels: rows.map((r: any, i: number) => `Row ${i + 1}`).slice(0, 30),
          datasets: [{
            label: numericColumns[0].name,
            data: rows.map((r: any) => r[numericColumns[0].name]).slice(0, 30),
            backgroundColor: 'rgba(75, 192, 192, 0.6)'
          }]
        }
      };
  }
}