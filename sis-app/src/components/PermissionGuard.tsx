import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '../utils/permissions';
import type { Permission } from '../types/permissions';
import { Alert, Box } from '@mui/material';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback,
}) => {
  const { user } = useAuth();

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(user?.role, permission);
  } else if (permissions) {
    hasAccess = requireAll
      ? hasAllPermissions(user?.role, permissions)
      : hasAnyPermission(user?.role, permissions);
  } else {
    // No permissions specified, allow access
    hasAccess = true;
  }

  if (!hasAccess) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">
          You do not have permission to access this resource.
        </Alert>
      </Box>
    );
  }

  return <>{children}</>;
};