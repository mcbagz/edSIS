import React from 'react';
import { Box, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { useLayout, LayoutProvider } from '../../contexts/LayoutContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useTheme } from '@mui/material/styles';

const LayoutContent: React.FC = () => {
  const theme = useTheme();
  const { sidebarOpen, toggleSidebar, isMobile } = useLayout();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Header onMenuClick={toggleSidebar} />
      <Box
        component="nav"
        sx={{ 
          width: { 
            xs: 0,
            md: sidebarOpen ? theme.layout.sidebarWidth : theme.layout.sidebarCollapsedWidth 
          }, 
          flexShrink: 0,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
        aria-label="Main navigation"
      >
        {isMobile ? (
          <Sidebar
            variant="temporary"
            open={sidebarOpen}
            onClose={toggleSidebar}
          />
        ) : (
          <Sidebar variant="permanent" open={sidebarOpen} />
        )}
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { 
            xs: '100%',
            md: `calc(100% - ${sidebarOpen ? theme.layout.sidebarWidth : theme.layout.sidebarCollapsedWidth}px)` 
          },
          minHeight: '100vh',
          backgroundColor: theme.palette.background.default,
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export const Layout: React.FC = () => {
  return (
    <LayoutProvider>
      <LayoutContent />
    </LayoutProvider>
  );
};