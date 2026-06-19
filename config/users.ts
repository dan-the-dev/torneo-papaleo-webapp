export type UserRole = 'admin';

export interface AppUser {
  email: string;
  role: UserRole;
  passwordEnvVar: string;
}

export const USERS: AppUser[] = [
  {
    email: 'daniele.scillia@gmail.com',
    role: 'admin',
    passwordEnvVar: 'ADMIN_PASSWORD',
  },
];

export function findUserByEmail(email: string): AppUser | undefined {
  return USERS.find((u) => u.email === email);
}
