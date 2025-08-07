import React, { useState } from 'react';
import { Tabs, Tab, Box, Paper } from '@mui/material';
import DailyAttendance from './DailyAttendance';
import PeriodAttendance from './PeriodAttendance';
import AttendanceReports from './AttendanceReports';
import AttendanceCodes from './AttendanceCodes';
import { useAuth } from '../../contexts/AuthContext';

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
      id={`attendance-tabpanel-${index}`}
      aria-labelledby={`attendance-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `attendance-tab-${index}`,
    'aria-controls': `attendance-tabpanel-${index}`,
  };
}

const Attendance: React.FC = () => {
  const [value, setValue] = useState(0);
  const { user } = useAuth();

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const isAdmin = user?.role === 'Administrator';
  const isTeacher = user?.role === 'Teacher';

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="attendance tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          {(isTeacher || isAdmin) && (
            <Tab label="Daily Attendance" {...a11yProps(0)} />
          )}
          {(isTeacher || isAdmin) && (
            <Tab label="Period Attendance" {...a11yProps(1)} />
          )}
          <Tab label="Reports" {...a11yProps(2)} />
          {isAdmin && (
            <Tab label="Attendance Codes" {...a11yProps(3)} />
          )}
        </Tabs>
      </Paper>

      {(isTeacher || isAdmin) && (
        <TabPanel value={value} index={0}>
          <DailyAttendance />
        </TabPanel>
      )}

      {(isTeacher || isAdmin) && (
        <TabPanel value={value} index={1}>
          <PeriodAttendance />
        </TabPanel>
      )}

      <TabPanel value={value} index={isTeacher || isAdmin ? 2 : 0}>
        <AttendanceReports />
      </TabPanel>

      {isAdmin && (
        <TabPanel value={value} index={3}>
          <AttendanceCodes />
        </TabPanel>
      )}
    </Box>
  );
};

export default Attendance;