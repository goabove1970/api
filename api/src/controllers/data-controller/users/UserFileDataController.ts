import { FileController } from '../FileController';
import { DataController } from '../DataController';
import { UserParser } from '../../parser-controller/users/UserParser';
import { UserDetails } from '@models/user/UserDetails';

export class UserFileDataController extends FileController<UserDetails> {
  constructor(filename: string) {
    super(filename, new UserParser());
  }
}

export const userFileDataController: DataController<UserDetails> = new UserFileDataController('users.csv');
