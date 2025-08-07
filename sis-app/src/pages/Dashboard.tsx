import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Alert,
  Skeleton,
} from '@mui/material';
import {
  People,
  School,
  EventNote,
  Assignment,
  TrendingUp,
  Warning,
  CheckCircle,
  Schedule,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService } from '../services/dashboardService';
import type { DashboardStats, Announcement, Event } from '../services/dashboardService';
import { format } from 'date-fns';

interface StatCard {
  title: string;
  value: string | number;
  icon: React.ReactElement;
  color: string;
  link?: string;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsData, announcementsData, eventsData] = await Promise.all([
        dashboardService.getDashboardStats(),
        dashboardService.getAnnouncements(),
        dashboardService.getUpcomingEvents()
      ]);

      setStats(statsData);
      setAnnouncements(announcementsData);
      setEvents(eventsData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getStatCards = (): StatCard[] => {
    if (!stats) return [];

    switch (user?.role) {
      case 'ADMIN':
        return [
          {
            title: 'Total Students',
            value: stats.totalStudents || 0,
            icon: <People />,
            color: '#1976d2',
            link: '/students',
          },
          {
            title: 'Total Staff',
            value: stats.totalStaff || 0,
            icon: <School />,
            color: '#388e3c',
            link: '/staff',
          },
          {
            title: 'Attendance Today',
            value: stats.attendanceToday || '0%',
            icon: <EventNote />,
            color: '#f57c00',
            link: '/attendance',
          },
          {
            title: 'Active Courses',
            value: stats.activeCourses || 0,
            icon: <Assignment />,
            color: '#7b1fa2',
            link: '/courses',
          },
        ];
      case 'TEACHER':
        return [
          {
            title: 'My Students',
            value: stats.myStudents || 0,
            icon: <People />,
            color: '#1976d2',
            link: '/students',
          },
          {
            title: 'Classes Today',
            value: stats.classesToday || 0,
            icon: <Schedule />,
            color: '#388e3c',
            link: '/scheduling',
          },
          {
            title: 'Assignments Due',
            value: stats.assignmentsDue || 0,
            icon: <Assignment />,
            color: '#f57c00',
            link: '/grades',
          },
          {
            title: 'Attendance Rate',
            value: stats.attendanceRate || '0%',
            icon: <EventNote />,
            color: '#7b1fa2',
            link: '/attendance',
          },
        ];
      case 'PARENT':
        return [
          {
            title: 'My Children',
            value: stats.myChildren || 0,
            icon: <People />,
            color: '#1976d2',
          },
          {
            title: 'Attendance Rate',
            value: stats.attendanceRate || '0%',
            icon: <CheckCircle />,
            color: '#388e3c',
          },
          {
            title: 'Upcoming Events',
            value: stats.upcomingEvents || 0,
            icon: <EventNote />,
            color: '#f57c00',
          },
          {
            title: 'Average Grade',
            value: stats.averageGrade || 'N/A',
            icon: <TrendingUp />,
            color: '#7b1fa2',
            link: '/grades',
          },
        ];
      case 'STUDENT':
        return [
          {
            title: 'My Courses',
            value: stats.myCourses || 0,
            icon: <School />,
            color: '#1976d2',
            link: '/courses',
          },
          {
            title: 'Attendance',
            value: stats.attendance || '0%',
            icon: <EventNote />,
            color: '#388e3c',
            link: '/attendance',
          },
          {
            title: 'Current GPA',
            value: stats.currentGPA || '0.0',
            icon: <TrendingUp />,
            color: '#f57c00',
            link: '/grades',
          },
          {
            title: 'Assignments Due',
            value: stats.assignmentsDue || 0,
            icon: <Assignment />,
            color: '#7b1fa2',
          },
        ];
      default:
        return [];
    }
  };

  const getQuickActions = () => {
    switch (user?.role) {
      case 'ADMIN':
        return [
          { label: 'Add New Student', action: () => navigate('/students/new') },
          { label: 'Generate Reports', action: () => navigate('/reports') },
          { label: 'Manage Staff', action: () => navigate('/staff') },
          { label: 'System Settings', action: () => navigate('/settings') },
        ];
      case 'TEACHER':
        return [
          { label: 'Take Attendance', action: () => navigate('/attendance') },
          { label: 'Enter Grades', action: () => navigate('/grades') },
          { label: 'View Schedule', action: () => navigate('/scheduling') },
          { label: 'Student List', action: () => navigate('/students') },
        ];
      case 'PARENT':
        return [
          { label: 'View Grades', action: () => navigate('/grades') },
          { label: 'Check Attendance', action: () => navigate('/attendance') },
          { label: 'Contact Teachers', action: () => {} },
          { label: 'School Calendar', action: () => {} },
        ];
      case 'STUDENT':
        return [
          { label: 'View Grades', action: () => navigate('/grades') },
          { label: 'My Schedule', action: () => navigate('/scheduling') },
          { label: 'Assignments', action: () => {} },
          { label: 'Resources', action: () => {} },
        ];
      default:
        return [];
    }
  };

  const statCards = getStatCards();
  const quickActions = getQuickActions();

  const getAnnouncementPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error.main';
      case 'normal':
        return 'text.primary';
      case 'low':
        return 'text.secondary';
      default:
        return 'text.primary';
    }
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={300} height={40} sx={{ mb: 2 }} />
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rectangular" height={120} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={200} sx={{ mb: 4 }} />
        <Skeleton variant="rectangular" height={300} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchDashboardData}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome back, {user?.firstName}!
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        {new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </Typography>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                cursor: stat.link ? 'pointer' : 'default',
                '&:hover': stat.link ? { boxShadow: 4 } : {},
              }}
              onClick={() => stat.link && navigate(stat.link)}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: '50%',
                      backgroundColor: `${stat.color}20`,
                      color: stat.color,
                      mr: 2,
                    }}
                  >
                    {React.cloneElement(stat.icon, { fontSize: 'large' })}
                  </Box>
                  <Typography variant="h4" component="div">
                    {stat.value}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {stat.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          {quickActions.map((action, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Button
                variant="outlined"
                fullWidth
                onClick={action.action}
                sx={{ py: 2 }}
              >
                {action.label}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Two column layout for events and announcements */}
      <Grid container spacing={3}>
        {/* Upcoming Events */}
        {events.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Upcoming Events
              </Typography>
              <Box sx={{ mt: 2 }}>
                {events.slice(0, 5).map((event, index) => (
                  <Box
                    key={event.id}
                    sx={{
                      mb: 2,
                      pb: 2,
                      borderBottom: index < events.length - 1 ? 1 : 0,
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="subtitle1">
                      {event.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {format(new Date(event.date), 'MMMM d, yyyy')}
                    </Typography>
                    {event.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {event.description}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Announcements */}
        <Grid item xs={12} md={events.length > 0 ? 6 : 12}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Recent Announcements
            </Typography>
            <Box sx={{ mt: 2 }}>
              {announcements.length > 0 ? (
                announcements.slice(0, 5).map((announcement, index) => (
                  <Box
                    key={announcement.id}
                    sx={{
                      mb: 2,
                      pb: 2,
                      borderBottom: index < announcements.length - 1 ? 1 : 0,
                      borderColor: 'divider',
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{ color: getAnnouncementPriorityColor(announcement.priority) }}
                    >
                      {announcement.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {format(new Date(announcement.date), 'MMMM d, yyyy')} - {announcement.content}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No announcements at this time.
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};