import { PgConfig } from './src/controllers/data-controller/database/PgConfig';

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
    // PgConfig: {
    //     host: '127.0.0.1',
    //     port: 5432,
    //     login: 'postgres',
    //     password: 'admin',
    //     database: 'postgres',
    //     schema: 'public',
    // },
    PgConfig: {
        host: 'dinero-db.cmi7wgy95mjp.us-east-2.rds.amazonaws.com',
        port: 5432,
        login: 'postgres',
        password: 'G62LHttp9FF9',
        database: 'postgres',
        schema: 'public',
    },
    SessionServiceConfig: {
        url: 'dinero-session-manager.us-east-2.elasticbeanstalk.com',
        port: undefined,
    },
    // SessionServiceConfig: {
    //     url: 'localhost',
    //     port: 9200,
    // },
    BankServiceConfig: {
        url: 'dinero-bank-manager.us-east-2.elasticbeanstalk.com',
        port: undefined,
    },
    // BankServiceConfig: {
    //     url: '127.0.0.1',
    //     port: 9300,
    // },
};
