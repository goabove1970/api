import { UserPersistanceControllerBase } from './UserPersistanceControllerBase';
import { UserDetails, UserStatus } from '../../../models/user';
import { DataController } from '../../../controllers/data-controller/DataController';
import { DeepPartial } from '../../../models/DeepPartial';
import { UserCreateArgs, UserUpdatePasswordArgs } from '../../../models/user/user-create-args';
import * as passwordHash from 'password-hash';
import { GuidFull } from '../../../utils/generateGuid';

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

  private validateCreateUserArgs(args: UserCreateArgs): void {
    if (!this.isLoginAvailable(args.login)) {
      throw {
        message: 'Could not create a new user, login is already in use',
      };
    }
  }

  private isLoginAvailable(login: string): boolean {
    return login && login.length > 0 && !this.dataController.cache.some((u) => u.login === login);
  }

  private validateUserUpdatePasswordArgs(args: UserUpdatePasswordArgs): void {
    if (!args.userId) {
      throw {
        message: 'Coul not update password, user id is not specified.',
      };
    }

    if (!args.oldPassword) {
      throw {
        message: 'Coul not update password, old password is not specified.',
      };
    }

    if (!args.newPassword) {
      throw {
        message: 'Coul not update password, new password is not specified.',
      };
    }
  }

  private combineNewUser(args: UserCreateArgs): UserDetails {
    return {
      accountCreated: new Date(),
      dob: args.dob,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      login: args.login,
      lastLogin: undefined,
      password: passwordHash.generate(args.password),
      ssn: args.ssn,
      userId: GuidFull(),
      status: UserStatus.ActivationPending,
    };
  }

  private findUserImpl(userId: string): UserDetails | undefined {
    this.checkCache('reading user by id');
    return this.dataController.cache.find((u) => u.userId === userId);
  }

  getUserById(userId: string): DeepPartial<UserDetails> | undefined {
    this.checkCache('getting user by id');
    const user = this.findUserImpl(userId);
    if (user) {
      return this.toShortUserDetails(user);
    }
    return undefined;
  }

  getAllUsers(): DeepPartial<UserDetails>[] {
    this.checkCache('getting all users');
    return this.dataController.cache.map((u) => this.toShortUserDetails(u));
  }

  getUserByLogin(login?: string): DeepPartial<UserDetails> | undefined {
    this.checkCache('getting user by login');
    const user = this.dataController.cache.find((u) => u.login === login);
    if (user) {
      return this.toShortUserDetails(user);
    }
    return undefined;
  }

  toShortUserDetails(user: UserDetails): DeepPartial<UserDetails> {
    return {
      userId: user.userId,
      login: user.login,
      firstName: user.firstName,
      lastName: user.lastName,
      dob: user.dob,
      ssn: user.ssn,
      serviceComment: user.serviceComment,
      status: user.status,
      email: user.email,
      accountCreated: user.accountCreated,
    };
  }

  createUser(args: UserCreateArgs): string {
    this.checkCache('creating new user');
    this.validateCreateUserArgs(args);
    const generatedUser = this.combineNewUser(args);
    this.dataController.cache.push(generatedUser);
    this.dataController.commitAllRecords();
    return generatedUser.userId;
  }

  updatePassword(args: UserUpdatePasswordArgs) {
    this.checkCache('updating user password');
    this.validateUserUpdatePasswordArgs(args);

    const { userId, oldPassword, newPassword } = args;
    const user = this.getUserById(args.userId);
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

    const verified = passwordHash.verify(user.password, oldPassword);
    if (!(user.status & UserStatus.Active)) {
      throw {
        message: 'Error updating user password, old password could not be erified',
      };
    }

    const newHash = passwordHash.generate(args.newPassword);
    this.updatePasswordHash(userId, newHash);
  }

  private updatePasswordHash(userId: string, newHash: string): void {
    const user = this.getUserById(userId);
    if (user) {
      user.password = newHash;
      this.dataController.commitAllRecords();
    } else {
      throw {
        message: 'Error updating user password, could not find user record while updating password hash',
      };
    }
  }

  updateUserData(userId: string, args: UserCreateArgs): void {
    this.checkCache('updating user record');
    const user = this.findUserImpl(userId);
    if (!user) {
      throw {
        message: 'Error updating user data, could not find user record',
      };
    }
    if (!(user.status & UserStatus.Active)) {
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

    this.dataController.commitAllRecords();
  }
}
