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

const LOCAL_CONFIG: ApplicationConfig = {
    PgConfig: {
        host: '127.0.0.1',
        port: 5432,
        login: 'postgres',
        password: 'admin',
        database: 'postgres',
        schema: 'public',
    },
    SessionServiceConfig: {
        url: 'localhost',
        port: 9200,
    },
    BankServiceConfig: {
        url: '127.0.0.1',
        port: 9300,
    },
};

const CONFIG: ApplicationConfig = {
    PgConfig: {
      host: '134.122.16.140',
      port: 5432,
      login: 'zhenia',
      password: 'a84hg7dT!!a',
      database: 'postgres',
      schema: 'public',
  },
    SessionServiceConfig: {
      url: '127.0.0.1',
      port: 9200,
  },
  BankServiceConfig: {
      url: '127.0.0.1',
      port: 9300,
  },
};

export const getConfig = (): ApplicationConfig => {
    if (process.env.NODE_ENV === 'development') {
        return LOCAL_CONFIG;
    }
    return CONFIG;
}
