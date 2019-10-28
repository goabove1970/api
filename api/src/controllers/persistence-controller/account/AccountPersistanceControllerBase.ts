import { DeepPartial } from '../../../models/DeepPartial';
import { UserAccount } from 'src/models/accounts/Account';
import { ReadAccountArgs } from 'src/models/accounts/ReadAccountArgs';
import { AccountCreateArgs } from 'src/models/accounts/AccountCreateArgs';
import { AccountUpdateArgs } from 'src/models/accounts/AccountUpdateArgs';
import { UserDeleteArgs } from 'src/models/user/UserDeleteArgs';
import { AccountDeleteArgs } from 'src/models/accounts/AccountDeleteArgs';

export abstract class AccountPersistanceControllerReadonlyBase {
  abstract getAccount(args: ReadAccountArgs): DeepPartial<UserAccount>[];
}

export abstract class AccountPersistanceControllerBase extends AccountPersistanceControllerReadonlyBase {
  abstract createAccount(args: AccountCreateArgs): string;
  abstract updateAccount(args: AccountUpdateArgs);
  abstract deleteAccount(args: AccountDeleteArgs): void;
}
