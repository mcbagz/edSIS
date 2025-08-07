import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BarChartIcon from '@mui/icons-material/BarChart';
import TableChartIcon from '@mui/icons-material/TableChart';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import reportService from '../../services/reportService';
import type { ReportTemplate, ReportResult, ChartData } from '../../services/reportService';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend
);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`report-tabpanel-${index}`}
      aria-labelledby={`report-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Reports: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [reportResult, setReportResult] = useState<ReportResult | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await reportService.getTemplates();
      setTemplates(data.templates);
      setCategories(data.categories);
      setError(null);
    } catch (err) {
      setError('Failed to load report templates');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      // Initialize parameters with default values
      const defaultParams: Record<string, any> = {};
      template.parameters.forEach(param => {
        if (param.defaultValue !== undefined) {
          defaultParams[param.name] = param.defaultValue;
        } else if (param.type === 'date') {
          // Set default dates for common date parameters
          if (param.name === 'startDate') {
            const date = new Date();
            date.setMonth(date.getMonth() - 1);
            defaultParams[param.name] = date;
          } else if (param.name === 'endDate') {
            defaultParams[param.name] = new Date();
          }
        }
      });
      setParameters(defaultParams);
      setReportResult(null);
      setChartData(null);
    }
  };

  const handleParameterChange = (paramName: string, value: any) => {
    setParameters(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  const executeReport = async (format: 'json' | 'csv' | 'pdf' = 'json') => {
    if (!selectedTemplate) return;

    try {
      setExecuting(true);
      setError(null);

      // Validate required parameters
      const missingParams = selectedTemplate.parameters
        .filter(p => p.required && !parameters[p.name])
        .map(p => p.name);

      if (missingParams.length > 0) {
        setError(`Missing required parameters: ${missingParams.join(', ')}`);
        return;
      }

      const result = await reportService.executeReport(
        selectedTemplate.id,
        parameters,
        format
      );

      if (format === 'json') {
        setReportResult(result as ReportResult);
        
        // Load chart data if available
        try {
          const chart = await reportService.getChartData(selectedTemplate.id, parameters);
          setChartData(chart);
        } catch (err) {
          // Chart data might not be available for all reports
          console.log('No chart data available');
        }
      } else {
        // Download the file
        const blob = result as Blob;
        reportService.downloadReport(blob, selectedTemplate.id, format);
      }
    } catch (err) {
      setError('Failed to execute report');
      console.error(err);
    } finally {
      setExecuting(false);
    }
  };

  const renderParameterInput = (param: any) => {
    switch (param.type) {
      case 'date':
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns} key={param.name}>
            <DatePicker
              label={param.description || param.name}
              value={parameters[param.name] || null}
              onChange={(date) => handleParameterChange(param.name, date)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: param.required,
                  size: 'small'
                }
              }}
            />
          </LocalizationProvider>
        );

      case 'number':
        return (
          <TextField
            key={param.name}
            label={param.description || param.name}
            type="number"
            value={parameters[param.name] || ''}
            onChange={(e) => handleParameterChange(param.name, Number(e.target.value))}
            fullWidth
            required={param.required}
            size="small"
            InputProps={{
              inputProps: {
                min: param.validation?.min,
                max: param.validation?.max
              }
            }}
          />
        );

      case 'boolean':
        return (
          <FormControl key={param.name} fullWidth size="small">
            <InputLabel>{param.description || param.name}</InputLabel>
            <Select
              value={parameters[param.name] || false}
              onChange={(e) => handleParameterChange(param.name, e.target.value === 'true')}
              label={param.description || param.name}
            >
              <MenuItem value="true">Yes</MenuItem>
              <MenuItem value="false">No</MenuItem>
            </Select>
          </FormControl>
        );

      default:
        if (param.validation?.enum) {
          return (
            <FormControl key={param.name} fullWidth size="small">
              <InputLabel>{param.description || param.name}</InputLabel>
              <Select
                value={parameters[param.name] || ''}
                onChange={(e) => handleParameterChange(param.name, e.target.value)}
                label={param.description || param.name}
                required={param.required}
              >
                <MenuItem value="">None</MenuItem>
                {param.validation.enum.map((option: string) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          );
        }

        return (
          <TextField
            key={param.name}
            label={param.description || param.name}
            value={parameters[param.name] || ''}
            onChange={(e) => handleParameterChange(param.name, e.target.value)}
            fullWidth
            required={param.required}
            size="small"
          />
        );
    }
  };

  const renderChart = () => {
    if (!chartData) return null;

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: true,
          text: selectedTemplate?.name
        }
      }
    };

    switch (chartData.type) {
      case 'bar':
        return <Bar data={chartData.data} options={options} height={400} />;
      case 'line':
        return <Line data={chartData.data} options={options} height={400} />;
      case 'pie':
        return <Pie data={chartData.data} options={options} height={400} />;
      case 'doughnut':
        return <Doughnut data={chartData.data} options={options} height={400} />;
      default:
        return null;
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 3 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>Reports & Analytics</Typography>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Generate Report" />
          <Tab label="Scheduled Reports" />
          <Tab label="Report History" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Report Selection */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Select Report</Typography>
                
                {categories.map(category => (
                  <Accordion key={category}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>{category}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {templates
                          .filter(t => t.category === category)
                          .map(template => (
                            <Button
                              key={template.id}
                              variant={selectedTemplate?.id === template.id ? 'contained' : 'outlined'}
                              onClick={() => handleTemplateSelect(template.id)}
                              fullWidth
                              sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                            >
                              <Box sx={{ textAlign: 'left' }}>
                                <Typography variant="subtitle2">
                                  {template.name}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {template.description}
                                </Typography>
                              </Box>
                            </Button>
                          ))}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </CardContent>
            </Card>
          </Grid>

          {/* Report Configuration & Results */}
          <Grid item xs={12} md={8}>
            {selectedTemplate ? (
              <>
                {/* Parameters */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Report Parameters
                    </Typography>
                    <Grid container spacing={2}>
                      {selectedTemplate.parameters.map(param => (
                        <Grid item xs={12} sm={6} key={param.name}>
                          {renderParameterInput(param)}
                        </Grid>
                      ))}
                    </Grid>

                    <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                      <Button
                        variant="contained"
                        onClick={() => executeReport('json')}
                        disabled={executing}
                        startIcon={executing ? <CircularProgress size={20} /> : <RefreshIcon />}
                      >
                        Run Report
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => executeReport('csv')}
                        disabled={executing || !reportResult}
                        startIcon={<DownloadIcon />}
                      >
                        Download CSV
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => executeReport('pdf')}
                        disabled={executing || !reportResult}
                        startIcon={<PictureAsPdfIcon />}
                      >
                        Download PDF
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => setScheduleDialogOpen(true)}
                        startIcon={<ScheduleIcon />}
                      >
                        Schedule
                      </Button>
                    </Box>
                  </CardContent>
                </Card>

                {/* Results */}
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                  </Alert>
                )}

                {reportResult && (
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                          Report Results
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {chartData && (
                            <>
                              <Chip
                                icon={<TableChartIcon />}
                                label="Table"
                                onClick={() => setViewMode('table')}
                                color={viewMode === 'table' ? 'primary' : 'default'}
                                variant={viewMode === 'table' ? 'filled' : 'outlined'}
                              />
                              <Chip
                                icon={<BarChartIcon />}
                                label="Chart"
                                onClick={() => setViewMode('chart')}
                                color={viewMode === 'chart' ? 'primary' : 'default'}
                                variant={viewMode === 'chart' ? 'filled' : 'outlined'}
                              />
                            </>
                          )}
                          <Chip
                            label={`${reportResult.data.metadata.rowCount} rows`}
                            size="small"
                            color="info"
                          />
                        </Box>
                      </Box>

                      {viewMode === 'table' ? (
                        <>
                          <TableContainer component={Paper}>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  {reportResult.data.columns.map(col => (
                                    <TableCell key={col.name}>
                                      <Typography variant="subtitle2">
                                        {col.name}
                                      </Typography>
                                    </TableCell>
                                  ))}
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {reportResult.data.rows
                                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                  .map((row, index) => (
                                    <TableRow key={index}>
                                      {reportResult.data.columns.map(col => (
                                        <TableCell key={col.name}>
                                          {row[col.name] !== null && row[col.name] !== undefined
                                            ? row[col.name].toString()
                                            : '-'}
                                        </TableCell>
                                      ))}
                                    </TableRow>
                                  ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                          <TablePagination
                            rowsPerPageOptions={[10, 25, 50, 100]}
                            component="div"
                            count={reportResult.data.rows.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                          />
                        </>
                      ) : (
                        <Box sx={{ height: 400 }}>
                          {renderChart()}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent>
                  <Typography color="textSecondary" align="center">
                    Select a report from the left panel to get started
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Typography>Scheduled reports functionality coming soon...</Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Typography>Report history functionality coming soon...</Typography>
      </TabPanel>

      {/* Schedule Report Dialog */}
      <Dialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule Report</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Schedule this report to run automatically and send results via email.
          </Typography>
          <Typography variant="caption" color="textSecondary">
            This feature is coming soon...
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Reports;