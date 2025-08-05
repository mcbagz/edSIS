export type UserRole = 'ADMIN' | 'TEACHER' | 'PARENT' | 'STUDENT';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}