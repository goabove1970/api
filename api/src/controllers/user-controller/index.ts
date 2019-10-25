import { UserCreateArgs } from '@models/user/user-create-args';
import { UserDetails } from '@models/user';

export abstract class UserControllerBase {
  abstract createUser(args: UserCreateArgs): string;
  abstract getUser(userId: string): UserDetails;
}

class UserController implements UserControllerBase {
  createUser(args: UserCreateArgs): string {
    throw new Error('Method not implemented.');
  }
  getUser(userId: string): UserDetails {
    throw new Error('Method not implemented.');
  }
}
