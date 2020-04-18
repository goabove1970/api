import { DeepPartial } from '@models/DeepPartial';
import { ReadAccountArgs } from '@models/accounts/ReadAccountArgs';
import { UserAccount } from '@models/accounts/Account';
import { AccountCreateArgs } from '@models/accounts/AccountCreateArgs';
import { AccountUpdateArgs } from '@models/accounts/AccountUpdateArgs';
import { accountPersistanceController } from '../data-controller/account/AccountPersistanceController';
import { AccountDeleteArgs } from '@models/accounts/AccountDeleteArgs';
import { AccountPersistanceControllerBase } from '../data-controller/account/AccountPersistanceControllerBase';

export class AccountController implements AccountPersistanceControllerBase {
    read(args: ReadAccountArgs): Promise<DeepPartial<UserAccount>[]> {
        return accountPersistanceController.read(args);
    }
    create(args: AccountCreateArgs): Promise<string> {
        return accountPersistanceController.create(args);
    }
    update(args: AccountUpdateArgs): Promise<void> {
        return accountPersistanceController.update(args);
    }
    delete(args: AccountDeleteArgs): Promise<void> {
        return accountPersistanceController.delete(args);
    }

    getUserAccounts(userId?: string): Promise<DeepPartial<UserAccount[]>> {
        const args: ReadAccountArgs = {
            userId,
        };
        return this.read(args);
    }
}

const accountController: AccountController = new AccountController();
export default accountController;
