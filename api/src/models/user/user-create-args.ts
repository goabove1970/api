export interface UserCreateArgs {
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
}

export interface UserUpdatePasswordArgs {
  userId: string;
  oldPassword: string;
  newPassword: string;
}
