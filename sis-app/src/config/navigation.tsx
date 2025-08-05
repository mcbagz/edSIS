import React from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import GroupsIcon from '@mui/icons-material/Groups';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EventNoteIcon from '@mui/icons-material/EventNote';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import GradeIcon from '@mui/icons-material/Grade';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';

export interface NavigationItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: string[];
  children?: NavigationItem[];
}

export const navigationConfig: NavigationItem[] = [
  {
    label: 'Dashboard',
    path: '/',
    icon: <DashboardIcon />,
    roles: ['admin', 'teacher', 'parent', 'student'],
  },
  {
    label: 'Students',
    path: '/students',
    icon: <PeopleIcon />,
    roles: ['admin', 'teacher'],
  },
  {
    label: 'Staff',
    path: '/staff',
    icon: <GroupsIcon />,
    roles: ['admin'],
  },
  {
    label: 'Admissions',
    path: '/admissions',
    icon: <AssignmentIcon />,
    roles: ['admin'],
    children: [
      {
        label: 'Applications',
        path: '/admissions/applications',
        icon: <AssignmentIcon />,
        roles: ['admin'],
      },
      {
        label: 'Enrollment',
        path: '/enrollment',
        icon: <SchoolIcon />,
        roles: ['admin', 'student'],
      },
    ],
  },
  {
    label: 'Courses',
    path: '/courses',
    icon: <SchoolIcon />,
    roles: ['admin', 'teacher'],
  },
  {
    label: 'Scheduling',
    path: '/scheduling',
    icon: <EventNoteIcon />,
    roles: ['admin'],
  },
  {
    label: 'Attendance',
    path: '/attendance',
    icon: <CalendarTodayIcon />,
    roles: ['admin', 'teacher'],
  },
  {
    label: 'Grades',
    path: '/grades',
    icon: <GradeIcon />,
    roles: ['admin', 'teacher', 'parent', 'student'],
  },
  {
    label: 'Reports',
    path: '/reports',
    icon: <AssessmentIcon />,
    roles: ['admin', 'teacher'],
  },
];

export const bottomNavigationConfig: NavigationItem[] = [
  {
    label: 'Settings',
    path: '/settings',
    icon: <SettingsIcon />,
    roles: ['admin'],
  },
  {
    label: 'Profile',
    path: '/profile',
    icon: <PersonIcon />,
    roles: ['admin', 'teacher', 'parent', 'student'],
  },
];