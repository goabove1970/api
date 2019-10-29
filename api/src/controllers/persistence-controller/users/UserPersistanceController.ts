import { UserPersistanceControllerBase } from './UserPersistanceControllerBase';
import { DataController } from '@controllers/data-controller/DataController';
import { DeepPartial } from '@models/DeepPartial';
import { UserUpdatePasswordArgs } from '@models/user/UserUpdatePasswordArgs';
import { UserDeleteArgs } from '@models/user/UserDeleteArgs';
import { UserReadArgs } from '@models/user/UserReadArgs';
import { UserCreateArgs } from '@models/user/UserCreateArgs';
import { UserUpdateArgs } from '@models/user/UserUpdateArgs';
import * as passwordHash from 'password-hash';
import { userFileDataController } from '../../data-controller/users/UserFileDataController';
import {
  validateCreateUserArgs,
  combineNewUser,
  validateUserUpdatePasswordArgs,
  validateUserUpdateArgs,
  toShortUserDetails,
  matchesReadArgs,
} from './helper';
import { UserDetails } from '@models/user/UserDetails';
import { UserStatus } from '@models/user/UserStatus';

export class UserPersistanceController implements UserPersistanceControllerBase {
  private dataController: DataController<UserDetails>;

  constructor(controller: DataController<UserDetails>) {
    this.dataController = controller;
  }

  private checkCache(action?: string) {
    if (!this.dataController || !this.dataController.cache) {
      throw {
        message: action ? `Error while ${action}, ` : '' + ' user cache not initialized',
      };
    }
  }

  isLoginAvailable(login: string): boolean {
    return login && login.length > 0 && !this.dataController.cache.some((u) => u.login === login);
  }

  private findUserImpl(userId: string): UserDetails | undefined {
    this.checkCache('reading user by id');
    return this.dataController.cache.find((u) => u.userId === userId);
  }

  getUserById(userId: string): DeepPartial<UserDetails> | undefined {
    this.checkCache('getting user by id');
    const user = this.findUserImpl(userId);
    if (user) {
      return toShortUserDetails(user);
    }
    return undefined;
  }

  getAllUsers(args: UserReadArgs): DeepPartial<UserDetails>[] {
    this.checkCache('getting all users');
    return this.dataController.cache.filter((u) => matchesReadArgs(u, args)).map((u) => toShortUserDetails(u));
  }

  getUserByLogin(login?: string): DeepPartial<UserDetails> | undefined {
    this.checkCache('getting user by login');
    const user = this.dataController.cache.find((u) => u.login === login);
    if (user) {
      return toShortUserDetails(user);
    }
    return undefined;
  }

  getUserByEmail(email?: string): DeepPartial<UserDetails> | undefined {
    this.checkCache('getting user by email');
    const user = this.dataController.cache.find((u) => u.email === email);
    if (user) {
      return toShortUserDetails(user);
    }
    return undefined;
  }

  createUser(args: UserCreateArgs): string {
    this.checkCache('creating new user');
    if (!this.isLoginAvailable(args.login)) {
      throw {
        message: 'Could not create a new user, login is already in use',
      };
    }
    validateCreateUserArgs(args);
    const generatedUser = combineNewUser(args);
    this.dataController.cache.push(generatedUser);
    this.dataController.commitAllRecords();
    return generatedUser.userId;
  }

  updatePassword(args: UserUpdatePasswordArgs) {
    this.checkCache('updating user password');
    validateUserUpdatePasswordArgs(args);

    const { userId, oldPassword, newPassword } = args;
    const user = this.findUserImpl(args.userId);
    if (!user) {
      throw {
        message: 'Error updating user password, user not found',
      };
    }

    if (!(user.status & UserStatus.Active)) {
      throw {
        message: 'Error updating user password, user account is inactive',
      };
    }

    const verified = passwordHash.verify(oldPassword, user.password);
    if (!verified) {
      throw {
        message: 'Error updating user password, old password could not be verified',
      };
    }

    const newHash = passwordHash.generate(newPassword);
    this.updatePasswordHash(userId, newHash);
  }

  private updatePasswordHash(userId: string, newHash: string): void {
    const user = this.findUserImpl(userId);
    if (user) {
      user.password = newHash;
      this.dataController.commitAllRecords();
    } else {
      throw {
        message: 'Error updating user password, could not find user record',
      };
    }
  }

  updateUserData(args: UserUpdateArgs): void {
    this.checkCache('updating user record');
    validateUserUpdateArgs(args);
    const user = this.findUserImpl(args.userId);
    if (!user) {
      throw {
        message: 'Error updating user data, could not find user record',
      };
    }
    if (!(user.status & UserStatus.Active) && !args.forceUpdate) {
      throw {
        message: 'Error updating user data, user account is inactive',
      };
    }

    if (args.lastName) {
      user.lastName = args.lastName;
    }
    if (args.dob) {
      user.dob = args.dob;
    }
    if (args.email) {
      user.email = args.email;
    }
    if (args.firstName) {
      user.firstName = args.firstName;
    }
    if (args.ssn) {
      user.ssn = args.ssn;
    }
    if (args.status) {
      user.status = args.status;
    }

    this.dataController.commitAllRecords();
  }

  deleteUser(args: UserDeleteArgs): void {
    this.checkCache('deleting user');

    const { userId, serviceComment, deleteRecord } = args;
    {
      const user = this.getUserById(userId);
      if (user) {
        if (deleteRecord) {
          this.dataController.cache = this.dataController.cache.filter((u) => u.userId !== userId);
        } else {
          user.serviceComment = user.serviceComment + `; ${serviceComment}`;
          user.status = user.status & UserStatus.Deactivated;
        }
        this.dataController.commitAllRecords();
      } else {
        throw {
          message: 'Error deleting user, could not find user record',
        };
      }
    }
  }
}

export const userPersistanceController = new UserPersistanceController(userFileDataController);
