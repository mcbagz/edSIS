import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
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

  const getStatCards = (): StatCard[] => {
    switch (user?.role) {
      case 'ADMIN':
        return [
          {
            title: 'Total Students',
            value: '1,234',
            icon: <People />,
            color: '#1976d2',
            link: '/students',
          },
          {
            title: 'Total Staff',
            value: '89',
            icon: <School />,
            color: '#388e3c',
            link: '/staff',
          },
          {
            title: 'Attendance Today',
            value: '94.5%',
            icon: <EventNote />,
            color: '#f57c00',
            link: '/attendance',
          },
          {
            title: 'Active Courses',
            value: '156',
            icon: <Assignment />,
            color: '#7b1fa2',
            link: '/courses',
          },
        ];
      case 'TEACHER':
        return [
          {
            title: 'My Students',
            value: '125',
            icon: <People />,
            color: '#1976d2',
            link: '/students',
          },
          {
            title: 'Classes Today',
            value: '6',
            icon: <Schedule />,
            color: '#388e3c',
            link: '/scheduling',
          },
          {
            title: 'Assignments Due',
            value: '12',
            icon: <Assignment />,
            color: '#f57c00',
            link: '/grades',
          },
          {
            title: 'Attendance Rate',
            value: '96.2%',
            icon: <EventNote />,
            color: '#7b1fa2',
            link: '/attendance',
          },
        ];
      case 'PARENT':
        return [
          {
            title: 'My Children',
            value: '2',
            icon: <People />,
            color: '#1976d2',
          },
          {
            title: 'Attendance Rate',
            value: '98%',
            icon: <CheckCircle />,
            color: '#388e3c',
          },
          {
            title: 'Upcoming Events',
            value: '3',
            icon: <EventNote />,
            color: '#f57c00',
          },
          {
            title: 'Average Grade',
            value: 'B+',
            icon: <TrendingUp />,
            color: '#7b1fa2',
            link: '/grades',
          },
        ];
      case 'STUDENT':
        return [
          {
            title: 'My Courses',
            value: '7',
            icon: <School />,
            color: '#1976d2',
            link: '/courses',
          },
          {
            title: 'Attendance',
            value: '96%',
            icon: <EventNote />,
            color: '#388e3c',
            link: '/attendance',
          },
          {
            title: 'Current GPA',
            value: '3.6',
            icon: <TrendingUp />,
            color: '#f57c00',
            link: '/grades',
          },
          {
            title: 'Assignments Due',
            value: '4',
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

      {/* Announcements */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Announcements
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Box sx={{ mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle1">
              School Holiday - Presidents Day
            </Typography>
            <Typography variant="body2" color="text.secondary">
              February 19, 2024 - School will be closed for Presidents Day
            </Typography>
          </Box>
          <Box sx={{ mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle1">
              Parent-Teacher Conferences
            </Typography>
            <Typography variant="body2" color="text.secondary">
              February 23-24, 2024 - Sign up for your conference slot
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1">
              Spring Break Reminder
            </Typography>
            <Typography variant="body2" color="text.secondary">
              March 11-15, 2024 - Have a safe and enjoyable break!
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};