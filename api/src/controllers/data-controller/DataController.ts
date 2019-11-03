import pool from './database/PgPool';
import { Value, Result } from 'ts-postgres';

export abstract class DataController<T> {}

export abstract class DatabaseController<T> extends DataController<T> {
    tableName: string;
    constructor(table: string) {
        super();
        this.tableName = table;
    }

    abstract readSelectResponse(values: Value[][]): T[];

    query(query?: string): Promise<Result> {
        return pool.query(query);
    }

    delete(where?: string): Promise<Result> {
        return pool.query(`DELETE FROM ${this.tableName} ${where}`);
    }

    select(where?: string): Promise<T[]> {
        return pool.query(`SELECT * FROM ${this.tableName} ${where}`).then((value) => {
            const { rows } = value;
            const categories = this.readSelectResponse(rows);
            return categories;
        });
    }

    update(where?: string): Promise<Result> {
        return pool.query(`UPDATE ${this.tableName} ${where}`);
    }

    insert(where?: string): Promise<Result> {
        return pool.query(`INSERT INTO ${this.tableName} ${where}`);
    }
}
