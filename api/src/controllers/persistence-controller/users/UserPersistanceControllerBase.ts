import { DeepPartial } from '../../../models/DeepPartial';
import { UserUpdatePasswordArgs } from '../../../models/user/UserUpdatePasswordArgs';
import { UserReadArgs } from '../../../models/user/UserReadArgs';
import { UserCreateArgs } from '../../../models/user/UserCreateArgs';
import { UserUpdateArgs } from '../../../models/user/UserUpdateArgs';
import { UserDetails } from '../../../models/user/UserDetails';

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
