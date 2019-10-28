import { UserUpdatePasswordArgs } from '../../models/user/UserUpdatePasswordArgs';
import { UserDeleteArgs } from '../../models/user/UserDeleteArgs';
import { UserReadArgs } from '../../models/user/UserReadArgs';
import { UserCreateArgs } from '../../models/user/UserCreateArgs';
import { UserUpdateArgs } from '../../models/user/UserUpdateArgs';
import { DeepPartial } from '../../models/DeepPartial';
import { UserDetails } from '../../models/user/UserDetails';
import { userPersistanceController } from '../persistence-controller/users/UserPersistanceController';

export abstract class UserControllerBase {
  abstract getUser(args: UserReadArgs): DeepPartial<UserDetails>[];
  abstract getUserById(userId: string): DeepPartial<UserDetails> | undefined;
  abstract getUserByLogin(login: string): DeepPartial<UserDetails> | undefined;
  abstract getUserByEmail(email: string): DeepPartial<UserDetails> | undefined;

  abstract createUser(args: UserCreateArgs): string;
  abstract updatePassword(args: UserUpdatePasswordArgs);
  abstract updateUserData(args: UserUpdateArgs);
  abstract deleteUser(args: UserDeleteArgs): void;
}

export class UserController implements UserControllerBase {
  getUserByEmail(email: string): DeepPartial<UserDetails> | undefined {
    return userPersistanceController.getUserByEmail(email);
  }

  getUser(args: UserReadArgs): DeepPartial<UserDetails>[] {
    return userPersistanceController.getAllUsers(args);
  }

  getUserById(userId: string): DeepPartial<UserDetails> | undefined {
    return userPersistanceController.getUserById(userId);
  }

  getUserByLogin(login: string): DeepPartial<UserDetails> | undefined {
    return userPersistanceController.getUserByLogin(login);
  }

  createUser(args: UserCreateArgs): string {
    return userPersistanceController.createUser(args);
  }

  updatePassword(args: UserUpdatePasswordArgs) {
    return userPersistanceController.updatePassword(args);
  }

  updateUserData(args: UserUpdateArgs) {
    return userPersistanceController.updateUserData(args);
  }

  deleteUser(args: UserDeleteArgs): void {
    return userPersistanceController.deleteUser(args);
  }
}

const userController: UserController = new UserController();
export default userController;
