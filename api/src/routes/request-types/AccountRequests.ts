import { ResponseBase } from './Requests';
import { ReadAccountArgs } from '../../models/accounts/ReadAccountArgs';
import { AccountCreateArgs } from 'src/models/accounts/AccountCreateArgs';
import { AccountUpdateArgs } from 'src/models/accounts/AccountUpdateArgs';
import { AccountDeleteArgs } from 'src/models/accounts/AccountDeleteArgs';

export type AccountRequestType = 'read-accounts' | 'create-account' | 'delete-account' | 'update-account';

export interface AccountRequest {
  action?: AccountRequestType;
  args?: ReadAccountArgs & AccountCreateArgs & AccountUpdateArgs & AccountDeleteArgs;
}

export interface AccountResponse extends ResponseBase {
  action?: AccountRequestType;
}
