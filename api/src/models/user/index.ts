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

export enum UserStatus {
  Active = 1,
  Deactivated = 2,
  Locked = 4,
  ActivationPending = 8,
}
