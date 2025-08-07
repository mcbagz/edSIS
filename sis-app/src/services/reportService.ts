import api from './api';

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  parameters: ReportParameter[];
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

export interface ReportResult {
  template: {
    id: string;
    name: string;
    description: string;
  };
  data: {
    columns: Array<{ name: string; type: string }>;
    rows: any[];
    metadata: {
      executedAt: string;
      rowCount: number;
      templateName: string;
    };
  };
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  data: {
    labels: string[];
    datasets: Array<{
      label?: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
    }>;
  };
}

const reportService = {
  // Get available report templates
  async getTemplates(): Promise<{ templates: ReportTemplate[]; categories: string[] }> {
    const response = await api.get('/reports/templates');
    return response.data;
  },

  // Execute a report
  async executeReport(
    templateId: string,
    parameters: Record<string, any>,
    format: 'json' | 'csv' | 'pdf' = 'json'
  ): Promise<ReportResult | Blob> {
    const response = await api.post(
      '/reports/execute',
      {
        templateId,
        parameters,
        format
      },
      {
        responseType: format === 'json' ? 'json' : 'blob'
      }
    );

    if (format === 'json') {
      return response.data;
    } else {
      // For CSV and PDF, return the blob
      return response.data;
    }
  },

  // Stream large CSV reports
  async streamReport(
    templateId: string,
    parameters: Record<string, any>
  ): Promise<void> {
    const params = new URLSearchParams({
      templateId,
      ...parameters
    });

    const response = await api.get(`/reports/stream?${params}`, {
      responseType: 'blob'
    });

    // Trigger download
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${templateId}-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Get chart data
  async getChartData(
    templateId: string,
    parameters: Record<string, any>
  ): Promise<ChartData> {
    const params = new URLSearchParams({
      templateId,
      ...parameters
    });

    const response = await api.get(`/reports/chart-data?${params}`);
    return response.data;
  },

  // Schedule a report
  async scheduleReport(
    templateId: string,
    parameters: Record<string, any>,
    schedule: string,
    recipients: string[],
    format: 'csv' | 'pdf'
  ): Promise<any> {
    const response = await api.post('/reports/schedule', {
      templateId,
      parameters,
      schedule,
      recipients,
      format
    });
    return response.data;
  },

  // Get report execution history
  async getReportHistory(): Promise<any> {
    const response = await api.get('/reports/history');
    return response.data;
  },

  // Download report in specified format
  downloadReport(blob: Blob, filename: string, format: 'csv' | 'pdf'): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};

export default reportService;