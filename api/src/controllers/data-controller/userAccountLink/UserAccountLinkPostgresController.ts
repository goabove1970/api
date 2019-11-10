import { DatabaseController } from '../DataController';
import { Value } from 'ts-postgres';
import { UserAccountLink } from '@root/src/models/accounts/Account';

export class UserAccountLinkPostgresController extends DatabaseController<UserAccountLink> {
    readSelectResponse(values: Value[][]): UserAccountLink[] {
        return [];
    }
    constructor() {
        super('user_account');
    }
}

export const userAccountLinkDataController: DatabaseController<
    UserAccountLink
> = new UserAccountLinkPostgresController();
