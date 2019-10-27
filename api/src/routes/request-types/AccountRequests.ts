import { UserUpdatePasswordArgs } from '../../models/user/UserUpdatePasswordArgs';
import { UserDeleteArgs } from '../../models/user/UserDeleteArgs';
import { UserCreateArgs } from '../../models/user/UserCreateArgs';
import { ResponseBase } from './Requests';
import { UserStatus } from '../../models/user/UserStatus';

export type AccountRequestType = 'read-accounts' | 'create-account' | 'delete-account' | 'update-account';

export interface AccountRequest {
  action?: AccountRequestType;
  args?: ReadUserArgs & UserCreateArgs & UserUpdatePasswordArgs & UserDeleteArgs;
}

export interface AccountResponse extends ResponseBase {
  action?: AccountRequestType;
}

export interface ReadUserArgs {
  userId?: string;
  statuses?: UserStatus;
}
