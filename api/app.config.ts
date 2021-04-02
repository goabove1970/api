import { PgConfig } from '@controllers/data-controller/database/PgConfig';

export interface ApplicationConfig {
    PgConfig?: PgConfig;
    SessionServiceConfig?: ServiceConfig;
    BankServiceConfig?: ServiceConfig;
}

export interface ServiceConfig {
    url?: string;
    port?: number;
}

export const CONFIG: ApplicationConfig = {
    PgConfig: {
        host: '127.0.0.1',
        port: 5432,
        login: 'postgres',
        password: 'admin',
        database: 'postgres',
        schema: 'public',
    },
    SessionServiceConfig: {
        url: 'https://dinero-app.com/sessions',
        port: undefined,
    },
    // SessionServiceConfig: {
    //     url: 'localhost',
    //     port: 9200,
    // },
    // BankServiceConfig: {
    //     url: 'dinero-app.com/sessions',
    //     port: undefined,
    // },
    BankServiceConfig: {
        url: '127.0.0.1',
        port: 9300,
    },
};
