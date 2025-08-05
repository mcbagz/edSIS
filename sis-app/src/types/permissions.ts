export type Permission = 
  // Student permissions
  | 'students.view'
  | 'students.create'
  | 'students.edit'
  | 'students.delete'
  // Staff permissions
  | 'staff.view'
  | 'staff.create'
  | 'staff.edit'
  | 'staff.delete'
  // Course permissions
  | 'courses.view'
  | 'courses.create'
  | 'courses.edit'
  | 'courses.delete'
  // Attendance permissions
  | 'attendance.view'
  | 'attendance.record'
  | 'attendance.edit'
  // Grade permissions
  | 'grades.view'
  | 'grades.enter'
  | 'grades.edit'
  // Report permissions
  | 'reports.view'
  | 'reports.generate'
  // System permissions
  | 'system.admin';