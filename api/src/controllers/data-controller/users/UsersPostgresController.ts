import { DatabaseController } from '../DataController';
import { Value } from 'ts-postgres';
import { UserDetails } from '@models/user/UserDetails';

export class UserPostgresController extends DatabaseController<UserDetails> {
    constructor() {
        super('users');
    }

    readSelectResponse(values: Value[][]): UserDetails[] {
        const collection: UserDetails[] = [];
        values.forEach((row) => {
            // Handle case where is_dark_mode_enabled column might not exist or be at different position
            // If row has 13+ elements, is_dark_mode_enabled is at position 12
            // Otherwise, default to false
            const isDarkModeEnabled = row.length > 12 
                ? (row[12] !== null && row[12] !== undefined ? Boolean(row[12]) : false)
                : false;
            
            collection.push({
                userId: row[0],
                firstName: row[1],
                lastName: row[2],
                ssn: row[3],
                login: row[4],
                password: row[5],
                email: row[6],
                dob: row[7],
                lastLogin: row[8],
                accountCreated: row[9],
                serviceComment: row[10],
                status: row[11],
                isDarkModeEnabled: isDarkModeEnabled,
            } as UserDetails);
        });

        return collection;
    }
}

export const userPostgresDataController: DatabaseController<UserDetails> = new UserPostgresController();
