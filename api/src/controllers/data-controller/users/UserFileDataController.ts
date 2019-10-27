import { FileController } from '../FileController';
import { UserDetails } from '../../../models/user';
import { DataController } from '../DataController';
import { UserParser } from '../../parser-controller/users/UserParser';

export class UserFileDataController extends FileController<UserDetails> {
  constructor(filename: string) {
    super(filename, new UserParser());
  }
}

export const userFileDataController: DataController<UserDetails> = new UserFileDataController('users.csv');
