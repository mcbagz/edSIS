import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Box,
  Typography,
  Collapse,
  Tooltip,
} from '@mui/material';
import { ExpandLess, ExpandMore, School } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '@mui/material/styles';
import { navigationConfig, bottomNavigationConfig } from '../../config/navigation';
import type { NavigationItem } from '../../config/navigation';

interface SidebarProps {
  open: boolean;
  onClose?: () => void;
  variant?: 'permanent' | 'persistent' | 'temporary';
}

export const Sidebar: React.FC<SidebarProps> = ({
  open,
  onClose,
  variant = 'permanent',
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

  const filteredNavItems = navigationConfig.filter(
    (item) => user && item.roles.includes(user.role.toLowerCase())
  );

  const filteredBottomItems = bottomNavigationConfig.filter(
    (item) => user && item.roles.includes(user.role.toLowerCase())
  );

  const handleNavigate = (path: string) => {
    navigate(path);
    if (variant === 'temporary' && onClose) {
      onClose();
    }
  };

  const handleExpandClick = (path: string) => {
    setExpandedItems((prev) =>
      prev.includes(path)
        ? prev.filter((item) => item !== path)
        : [...prev, path]
    );
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const renderNavItem = (item: NavigationItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.path);

    return (
      <React.Fragment key={item.path}>
        <ListItem disablePadding sx={{ display: 'block' }}>
          <Tooltip 
            title={!open && depth === 0 ? item.label : ''} 
            placement="right"
            arrow
          >
            <ListItemButton
              selected={isActive(item.path)}
              onClick={() => hasChildren ? handleExpandClick(item.path) : handleNavigate(item.path)}
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
                pl: depth > 0 ? 4 : 2.5,
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
                '&.Mui-selected': {
                  backgroundColor: theme.palette.action.selected,
                  borderLeft: `4px solid ${theme.palette.primary.main}`,
                  '&:hover': {
                    backgroundColor: theme.palette.action.selected,
                  },
                },
                '&:focus-visible': {
                  outline: `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: -2,
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                  color: isActive(item.path) ? 'primary.main' : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.label} 
                sx={{ 
                  opacity: open ? 1 : 0,
                  '& .MuiTypography-root': {
                    fontWeight: isActive(item.path) ? 600 : 400,
                  },
                }} 
              />
              {hasChildren && open && (
                isExpanded ? <ExpandLess /> : <ExpandMore />
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>
        {hasChildren && (
          <Collapse in={isExpanded && open} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children!.filter(child => 
                user && child.roles.includes(user.role.toLowerCase())
              ).map((child) => renderNavItem(child, depth + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  const drawerContent = (
    <>
      <Toolbar 
        sx={{ 
          px: [1],
          display: 'flex',
          alignItems: 'center',
          justifyContent: open ? 'flex-start' : 'center',
        }}
      >
        <School 
          sx={{ 
            fontSize: 40,
            color: theme.palette.primary.main,
            mr: open ? 2 : 0,
          }} 
        />
        {open && (
          <Box>
            <Typography variant="h6" noWrap component="div" fontWeight={600}>
              SIS
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              Student Information System
            </Typography>
          </Box>
        )}
      </Toolbar>
      <Divider />
      <List sx={{ pt: 0 }}>
        {filteredNavItems.map((item) => renderNavItem(item))}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      {filteredBottomItems.length > 0 && (
        <>
          <Divider />
          <List>
            {filteredBottomItems.map((item) => renderNavItem(item))}
          </List>
        </>
      )}
      <Divider />
      <Box sx={{ p: 2, textAlign: open ? 'left' : 'center' }}>
        {open ? (
          <>
            <Typography variant="body2" color="text.secondary">
              Logged in as:
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.role}
            </Typography>
          </>
        ) : (
          <Tooltip title={`${user?.firstName} ${user?.lastName} (${user?.role})`} placement="right">
            <Typography variant="caption" fontWeight="bold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Typography>
          </Tooltip>
        )}
      </Box>
    </>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: open ? theme.layout.sidebarWidth : theme.layout.sidebarCollapsedWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? theme.layout.sidebarWidth : theme.layout.sidebarCollapsedWidth,
          boxSizing: 'border-box',
          borderRight: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          overflowX: 'hidden',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        },
      }}
      ModalProps={{
        keepMounted: true,
      }}
    >
      {drawerContent}
    </Drawer>
  );
};