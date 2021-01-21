import { DeepPartial } from '@models/DeepPartial';
import { ReadAccountArgs } from '@models/accounts/ReadAccountArgs';
import { UserAccount } from '@models/accounts/Account';
import { AccountCreateArgs } from '@models/accounts/AccountCreateArgs';
import { AccountUpdateArgs } from '@models/accounts/AccountUpdateArgs';
import { AccountPersistanceController, accountPersistanceController } from '../data-controller/account/AccountPersistanceController';
import { AccountDeleteArgs } from '@models/accounts/AccountDeleteArgs';
import { AccountPersistanceControllerBase } from '@controllers/data-controller/account/AccountPersistanceControllerBase';
import userController from '@controllers/user-controller';

export class AccountController extends AccountPersistanceControllerBase {
    private accountController: AccountPersistanceController;
    
    constructor(_accountController: AccountPersistanceController) {
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

const accountController: AccountController = new AccountController(accountPersistanceController);
export default accountController;
