import { UserUpdatePasswordArgs, UserLoginArgs } from '@models/user/UserUpdatePasswordArgs';
import { UserDeleteArgs } from '@models/user/UserDeleteArgs';
import { ManageAccountArgs } from '@models/user/ManageAccountArgs';
import { UserReadArgs } from '@models/user/UserReadArgs';
import { UserCreateArgs } from '@models/user/UserCreateArgs';
import { UserUpdateArgs } from '@models/user/UserUpdateArgs';
import { DeepPartial } from '@models/DeepPartial';
import { UserDetails } from '@models/user/UserDetails';
import { UserPersistenceController, userPersistenceController } from '@controllers/data-controller/users/UserPersistenceController';
import { UserPersistenceControllerBase } from '@controllers/data-controller/users/UserPersistenceControllerBase';
import { UserAccountLink } from '@models/accounts/Account';

export class UserController implements UserPersistenceControllerBase {
    persistenceController: UserPersistenceController;
    constructor(persistenceController: UserPersistenceController) {
        this.persistenceController = persistenceController;
    }

    removeAccount(args: ManageAccountArgs): Promise<void> {
        return this.persistenceController.removeAccount(args);
    }
    getUserByEmail(email: string): Promise<DeepPartial<UserDetails> | undefined> {
        return this.persistenceController.getUserByEmail(email);
    }

    read(args: UserReadArgs): Promise<DeepPartial<UserDetails>[]> {
        return this.persistenceController.read(args);
    }

    getUserById(userId: string): Promise<DeepPartial<UserDetails> | undefined> {
        return this.persistenceController.getUserById(userId);
    }

    getUserByLogin(login: string): Promise<DeepPartial<UserDetails> | undefined> {
        return this.persistenceController.getUserByLogin(login);
    }

    create(args: UserCreateArgs): Promise<string> {
        return this.persistenceController.create(args);
    }

    addAccount(args: ManageAccountArgs): Promise<void> {
        return this.persistenceController.addAccount(args);
    }

    validateUser(args: UserLoginArgs): Promise<UserDetails | undefined> {
        return this.persistenceController.validtePassword(args);
    }

    getUserAccountLinks(args: ManageAccountArgs): Promise<UserAccountLink[]> {
        return this.persistenceController.getUserAccountLinks(args);
    }

    updatePassword(args: UserUpdatePasswordArgs): Promise<void> {
        return this.persistenceController.updatePassword(args);
    }

    updateUserData(args: UserUpdateArgs): Promise<void> {
        return this.persistenceController.updateUserData(args);
    }

    updateLastLogin(userId: string): Promise<void> {
        return this.persistenceController.updateLastLogin(userId);
    }

    delete(args: UserDeleteArgs): Promise<void> {
        return this.persistenceController.delete(args);
    }
}

const userController: UserController = new UserController(userPersistenceController);
export default userController;
