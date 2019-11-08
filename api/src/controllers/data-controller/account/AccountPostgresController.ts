import { DatabaseController } from '../DataController';
import { Value } from 'ts-postgres';
import { UserAccount } from '@root/src/models/accounts/Account';

export class AccountPostgresController extends DatabaseController<UserAccount> {
    constructor() {
        super('account');
    }

    readSelectResponse(values: Value[][]): UserAccount[] {
        const collection: UserAccount[] = [];
        values.forEach((row) => {
            collection.push({
                accountId: row[0],
                bankRoutingNumber: row[1],
                bankAccountNumber: row[2],
                bankName: row[3],
                createDate: row[4],
                status: row[5],
                serviceComment: row[6],
                accountType: row[7],
            } as UserAccount);
        });

        return collection;
    }
}

export const accountPostgresDataController: DatabaseController<UserAccount> = new AccountPostgresController();
