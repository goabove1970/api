import { DeepPartial } from '../../../models/DeepPartial';
import { UserDetails } from '../../../models/user';
import { UserUpdatePasswordArgs, UserCreateArgs } from '@src/models/user/user-create-args';

export abstract class UserPersistanceControllerReadonlyBase {
  abstract getUserById(userId: string): DeepPartial<UserDetails> | undefined;
  abstract getAllUsers(): DeepPartial<UserDetails>[];
  abstract getUserByLogin(login?: string): DeepPartial<UserDetails> | undefined;
}

export abstract class UserPersistanceControllerBase extends UserPersistanceControllerReadonlyBase {
  abstract createUser(user: UserCreateArgs): string;
  abstract updatePassword(args: UserUpdatePasswordArgs);
  abstract updateUserData(userId: string, args: UserCreateArgs);
}
