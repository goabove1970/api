import { UserStatus } from './UserStatus';
export interface UserDetails {
  firstName: string;
  lastName: string;
  userId: string;
  ssn: number;
  login: string;
  password: string;
  email: string;
  dob: Date;
  lastLogin: Date;
  accountCreated: Date;
  serviceComment?: string;
  status?: UserStatus;
}
