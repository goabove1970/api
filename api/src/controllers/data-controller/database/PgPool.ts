import { Client, Configuration, Result } from 'ts-postgres';
import { PgConfig } from './PgConfig';
import { getConfig } from '@root/app.config';
import { logHelper } from '@root/src/logger';

export class PgPool {
    private client: Client;
    private _config: PgConfig;
    private connectionPromise: Promise<void>;

    get connected(): boolean {
        return !this.client.closed;
    }

    get config(): PgConfig {
        return this._config;
    }

    constructor(config: PgConfig) {
        this._config = config;
        const clientConfiguration: Configuration = {
            database: this._config.database,
            host: this._config.host,
            port: this._config.port,
            user: this._config.login,
            password: this._config.password,
            keepAlive: true,
        };
        this.client = new Client(clientConfiguration);
        this.connectionPromise = this.client
            .connect()
            .then(() => {
                this.client.on('error', (error) => {
                    logHelper.error(`Database connection error: ${error.message || error}`);
                });
                if (!this.client.closed) {
                    logHelper.info(`Connected to the database: ${this.client.config.database}:${this.client.config.port}`);
                }
            })
            .catch((error) => {
                logHelper.error(`Failed to connect to database: ${error.message || error}`);
                throw error;
            });
    }

    async query(query?: string): Promise<Result> {
        // Ensure connection is ready before executing query
        await this.connectionPromise;

        // Check if connection is closed and reconnect if needed
        if (this.client.closed) {
            logHelper.info('Database connection closed, reconnecting...');
            this.connectionPromise = this.client
                .connect()
                .then(() => {
                    this.client.on('error', (error) => {
                        logHelper.error(`Database connection error: ${error.message || error}`);
                    });
                    if (!this.client.closed) {
                        logHelper.info(`Reconnected to the database: ${this.client.config.database}:${this.client.config.port}`);
                    }
                })
                .catch((error) => {
                    logHelper.error(`Failed to reconnect to database: ${error.message || error}`);
                    throw error;
                });
            await this.connectionPromise;
        }

        logHelper.info(`Running database query: [${query}]`);
        return this.client
            .query(query)
            .then((r) => {
                // logHelper.info(`Got database result [${JSON.stringify(r, null, 4)}]`);
                //logHelper.info(`Got database result: ${r.rows.length} rows`);
                return r;
            })
            .catch((error) => {
                logHelper.error(`Query failed: ${error.message || error}`);
                throw error;
            });
    }
}

const pool = new PgPool(getConfig().PgConfig);
export default pool;
