import { FileController } from '../FileController';
import { CachedDataController } from '../CachedDataController';
import { UserParser } from '../../parser-controller/users/UserParser';
import { UserDetails } from '@models/user/UserDetails';

export class UserFileDataController extends FileController<UserDetails> {
    constructor(filename: string) {
        super(filename, new UserParser());
    }
}

export const userFileDataController: CachedDataController<UserDetails> = new UserFileDataController('users.csv');
