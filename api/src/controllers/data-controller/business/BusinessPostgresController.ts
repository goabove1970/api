import { DatabaseController } from '../DataController';
import { Value } from 'ts-postgres';
import { Business } from '@models/business/Business';

export class BusinessPostgresController extends DatabaseController<Business> {
    constructor() {
        super('business');
    }

    readSelectResponse(values: Value[][]): Business[] {
        const collection: Business[] = [];
        values.forEach((row) => {
            let regexp: string = unescape((row[3] as string) || '');

            collection.push({
                businessId: row[0],
                name: unescape(row[1] as string),
                defaultCategoryId: row[2],
                regexps: regexp.split('||'),
            } as Business);
        });

        return collection;
    }
}

export const businessPostgresDataController: DatabaseController<Business> = new BusinessPostgresController();
