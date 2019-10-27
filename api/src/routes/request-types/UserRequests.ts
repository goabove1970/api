import { UserStatus } from '../../models/user';
import { UserCreateArgs, UserUpdatePasswordArgs, UserDeleteArgs } from '../../models/user/user-create-args';

export type UserRequestType = 'read-users' | 'create-user' | 'delete-user' | 'update-user' | 'update-password';

export interface UserRequest {
  action?: UserRequestType;
  args?: ReadUserArgs & UserCreateArgs & UserUpdatePasswordArgs & UserDeleteArgs;
}

export interface UserResponse {
  action?: UserRequestType;
  payload?: {};
  error?: string;
}

export interface ReadUserArgs {
  userId?: string;
  login?: string;
  email?: string;
  statuses?: UserStatus;
}
