import { UserStatus } from '.';

export interface UserCreateArgs {
  firstName: string;
  lastName: string;
  ssn: number;
  login: string;
  password: string;
  email: string;
  dob: Date;
  lastLogin: Date;
  accountCreated: Date;
}

export interface UserUpdateArgs extends UserCreateArgs {
  forceUpdate?: boolean;
  userId: string;
  status?: number;
}

export interface UserReadArgs {
  status: UserStatus;
}

export interface UserDeleteArgs {
  userId: string;
  serviceComment?: string;
  deleteRecord?: boolean;
}

export interface UserUpdatePasswordArgs {
  userId: string;
  oldPassword: string;
  newPassword: string;
}
