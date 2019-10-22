import { UserCreateArgs } from '@models/user/user-create-args';
import { User } from '@models/user';

export abstract class UserControllerBase {
  abstract createUser(args: UserCreateArgs): string;
  abstract getUser(userId: string): User;
}

class UserController implements UserControllerBase {
  createUser(args: UserCreateArgs): string {
    throw new Error('Method not implemented.');
  }
  getUser(userId: string): User {
    throw new Error('Method not implemented.');
  }
}
