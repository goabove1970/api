import { DeepPartial } from '../../../models/DeepPartial';
import { UserDetails } from '../../../models/user';
import {
  UserUpdatePasswordArgs,
  UserCreateArgs,
  UserReadArgs,
  UserUpdateArgs,
} from '../../../models/user/user-create-args';

export abstract class UserPersistanceControllerReadonlyBase {
  abstract getUserById(userId: string): DeepPartial<UserDetails> | undefined;
  abstract getAllUsers(args: UserReadArgs): DeepPartial<UserDetails>[];
  abstract getUserByLogin(login?: string): DeepPartial<UserDetails> | undefined;
  abstract getUserByEmail(email?: string): DeepPartial<UserDetails> | undefined;
}

export abstract class UserPersistanceControllerBase extends UserPersistanceControllerReadonlyBase {
  abstract createUser(user: UserCreateArgs): string;
  abstract updatePassword(args: UserUpdatePasswordArgs);
  abstract updateUserData(args: UserUpdateArgs);
}
