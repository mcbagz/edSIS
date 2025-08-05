import type { UserRole } from '../types/auth';
import type { Permission } from '../types/permissions';

const rolePermissions: Record<UserRole, Permission[]> = {
  ADMIN: [
    // Admin has all permissions
    'students.view', 'students.create', 'students.edit', 'students.delete',
    'staff.view', 'staff.create', 'staff.edit', 'staff.delete',
    'courses.view', 'courses.create', 'courses.edit', 'courses.delete',
    'attendance.view', 'attendance.record', 'attendance.edit',
    'grades.view', 'grades.enter', 'grades.edit',
    'reports.view', 'reports.generate',
    'system.admin',
  ],
  TEACHER: [
    'students.view',
    'courses.view',
    'attendance.view', 'attendance.record',
    'grades.view', 'grades.enter', 'grades.edit',
    'reports.view',
  ],
  PARENT: [
    'students.view', // Can only view their own children
    'attendance.view', // Can only view their children's attendance
    'grades.view', // Can only view their children's grades
  ],
  STUDENT: [
    'courses.view', // Can only view their own courses
    'attendance.view', // Can only view their own attendance
    'grades.view', // Can only view their own grades
  ],
};

export const hasPermission = (userRole: UserRole | undefined, permission: Permission): boolean => {
  if (!userRole) return false;
  return rolePermissions[userRole]?.includes(permission) ?? false;
};

export const hasAnyPermission = (userRole: UserRole | undefined, permissions: Permission[]): boolean => {
  if (!userRole) return false;
  return permissions.some(permission => hasPermission(userRole, permission));
};

export const hasAllPermissions = (userRole: UserRole | undefined, permissions: Permission[]): boolean => {
  if (!userRole) return false;
  return permissions.every(permission => hasPermission(userRole, permission));
};

// Helper to check if user can access specific resource
export const canAccessResource = (
  userRole: UserRole | undefined,
  resourceType: 'student' | 'staff' | 'course' | 'grade',
  action: 'view' | 'create' | 'edit' | 'delete',
  ownResource?: boolean
): boolean => {
  if (!userRole) return false;

  // Build permission string
  const permission = `${resourceType}s.${action}` as Permission;
  
  // Check base permission
  const hasBasePermission = hasPermission(userRole, permission);
  
  // For view actions on own resources, allow for students and parents
  if (action === 'view' && ownResource) {
    if (resourceType === 'student' && (userRole === 'PARENT' || userRole === 'STUDENT')) {
      return true;
    }
    if ((resourceType === 'course' || resourceType === 'grade') && userRole === 'STUDENT') {
      return true;
    }
  }
  
  return hasBasePermission;
};