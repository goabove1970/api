import * as passwordHash from 'password-hash';
import {
  UserCreateArgs,
  UserUpdatePasswordArgs,
  UserReadArgs,
  UserUpdateArgs,
} from '../../../models/user/user-create-args';
import { UserDetails, UserStatus } from '../../../models/user';
import { GuidFull } from '../../../utils/generateGuid';
import { DeepPartial } from '../../../models/DeepPartial';

export function validateCreateUserArgs(args: UserCreateArgs): void {
  if (!args.firstName) {
    throw {
      message: 'User first name can not be empty',
    };
  }

  if (!args.lastName) {
    throw {
      message: 'User last name can not be empty',
    };
  }

  if (!args.dob) {
    throw {
      message: 'User birth date can not be empty',
    };
  }

  if (!args.email) {
    throw {
      message: 'User email can not be empty',
    };
  }

  validateNewPassword(args.password);

  if (!args.ssn) {
    throw {
      message: 'User SSN can not be empty',
    };
  }
}

export function validateNewPassword(password?: string) {
  if (!password) {
    throw {
      message: 'User password can not be empty',
    };
  }

  if (password.length < 8) {
    throw {
      message: 'Password can not be less than 8 characters',
    };
  }
}

export function validateUserUpdatePasswordArgs(args: UserUpdatePasswordArgs): void {
  validateNewPassword(args.newPassword);

  if (!args.userId) {
    throw {
      message: 'Could not update password, user id is not specified.',
    };
  }

  if (!args.oldPassword) {
    throw {
      message: 'Could not update password, old password is not specified.',
    };
  }

  if (!args.newPassword) {
    throw {
      message: 'Could not update password, new password is not specified.',
    };
  }
}

export const toShortUserDetails = (user: UserDetails): DeepPartial<UserDetails> => {
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
};

export const combineNewUser = (args: UserCreateArgs): UserDetails => {
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
};

export function matchesReadArgs(m: UserDetails, args: UserReadArgs): boolean {
  if (!args) {
    return true;
  }

  let matches = true;
  if (args.status && m.status) {
    matches = matches && (m.status & args.status) === args.status;
  }

  return matches;
}

export function validateUserUpdateArgs(args: UserUpdateArgs): void {
  if (!args) {
    throw {
      message: 'Can not update user, no arguments passed',
    };
  }

  if (!args.userId) {
    throw {
      message: 'Can not update user, no userId passed',
    };
  }

  validateCreateUserArgs(args);
}
