import { DeepPartial } from '@models/DeepPartial';
import { ReadAccountArgs } from '@models/accounts/ReadAccountArgs';
import { UserAccount } from '@models/accounts/Account';
import { AccountCreateArgs } from '@models/accounts/AccountCreateArgs';
import { AccountUpdateArgs } from '@models/accounts/AccountUpdateArgs';
import { AccountDeleteArgs } from '@models/accounts/AccountDeleteArgs';
import { AccountPersistenceControllerBase as AccountPersistenceControllerBase } from '@controllers/data-controller/account/AccountPersistenceControllerBase';
import userController from '@controllers/user-controller';
import { AccountPersistenceController } from '../data-controller/account/account-persistance-controller/account-persistance-controller';

export class AccountController extends AccountPersistenceControllerBase {
    private accountController: AccountPersistenceController;
    
    constructor(_accountController: AccountPersistenceController) {
        super();
        this.accountController = _accountController;
    }
    
    read(args: ReadAccountArgs): Promise<DeepPartial<UserAccount>[]> {
        return this.accountController.read(args);
    }
    create(args: AccountCreateArgs): Promise<string> {
        return this.accountController.create(args);
    }
    assignUser(userId: string, accountId: string): Promise<void> {
        return userController.addAccount({ userId, accountId });
    }
    update(args: AccountUpdateArgs): Promise<void> {
        return this.accountController.update(args);
    }
    delete(args: AccountDeleteArgs): Promise<void> {
        return this.accountController.delete(args);
    }
}


