import { UserUpdatePasswordArgs, UserLoginArgs } from '@models/user/UserUpdatePasswordArgs';
import { UserDeleteArgs } from '@models/user/UserDeleteArgs';
import { ManageAccountArgs } from '@models/user/ManageAccountArgs';
import { UserReadArgs } from '@models/user/UserReadArgs';
import { UserCreateArgs } from '@models/user/UserCreateArgs';
import { UserUpdateArgs } from '@models/user/UserUpdateArgs';
import { DeepPartial } from '@models/DeepPartial';
import { UserDetails } from '@models/user/UserDetails';
import { UserPersistanceController, userPersistanceController } from '@controllers/data-controller/users/UserPersistanceController';
import { UserPersistanceControllerBase } from '@controllers/data-controller/users/UserPersistanceControllerBase';
import { UserAccountLink } from '@models/accounts/Account';

export class UserController implements UserPersistanceControllerBase {
    persistanceController: UserPersistanceController;
    constructor(persistanceController: UserPersistanceController) {
        this.persistanceController = persistanceController;
    }

    removeAccount(args: ManageAccountArgs): Promise<void> {
        return this.persistanceController.removeAccount(args);
    }
    getUserByEmail(email: string): Promise<DeepPartial<UserDetails> | undefined> {
        return this.persistanceController.getUserByEmail(email);
    }

    read(args: UserReadArgs): Promise<DeepPartial<UserDetails>[]> {
        return this.persistanceController.read(args);
    }

    getUserById(userId: string): Promise<DeepPartial<UserDetails> | undefined> {
        return this.persistanceController.getUserById(userId);
    }

    getUserByLogin(login: string): Promise<DeepPartial<UserDetails> | undefined> {
        return this.persistanceController.getUserByLogin(login);
    }

    create(args: UserCreateArgs): Promise<string> {
        return this.persistanceController.create(args);
    }

    addAccount(args: ManageAccountArgs): Promise<void> {
        return this.persistanceController.addAccount(args);
    }

    validateUser(args: UserLoginArgs): Promise<UserDetails | undefined> {
        return this.persistanceController.validtePassword(args);
    }

    getUserAccountLinks(args: ManageAccountArgs): Promise<UserAccountLink[]> {
        return this.persistanceController.getUserAccountLinks(args);
    }

    updatePassword(args: UserUpdatePasswordArgs): Promise<void> {
        return this.persistanceController.updatePassword(args);
    }

    updateUserData(args: UserUpdateArgs): Promise<void> {
        return this.persistanceController.updateUserData(args);
    }

    updateLastLogin(userId: string): Promise<void> {
        return this.persistanceController.updateLastLogin(userId);
    }

    delete(args: UserDeleteArgs): Promise<void> {
        return this.persistanceController.delete(args);
    }
}

const userController: UserController = new UserController(userPersistanceController);
export default userController;
