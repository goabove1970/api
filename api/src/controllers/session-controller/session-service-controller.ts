import { SessionArgs, SessionResponse } from '@routes/request-types/session-request';
import * as http from 'http';
import { CONFIG, ServiceConfig } from '@root/app.config';
import logger from '@root/src/logger';

export interface ISessionService {
    init(args: SessionArgs): Promise<SessionResponse>;
    extend(args: SessionArgs): Promise<SessionResponse>;
    validate(args: SessionArgs): Promise<SessionResponse>;
    terminate(args: SessionArgs): Promise<SessionResponse>;
    passThrough(args, req): Promise<SessionResponse>;
}

export class SessionService implements ISessionService {
    config: ServiceConfig;
    constructor(config: ServiceConfig) {
        this.config = config;
    }

    passThrough(args: SessionArgs, action: string): Promise<SessionResponse> {
        const reqBody = { action, args };
        const bodyString = JSON.stringify(reqBody);

        const options = {
            method: 'POST',
            hostname: this.config.url,
            port: this.config.port,
            path: '/session',
            headers: {
                'content-type': 'application/json',
                'content-length': Buffer.byteLength(bodyString),
            },
            timeout: 1000
        };

        return new Promise((resolve, reject) => {
            const req = http.request(options, (res) => {
                let buffer: Buffer;
                res.on('data', (chunk: Buffer) => {
                    if (!buffer) {
                        buffer = chunk;
                    } else {
                        buffer = Buffer.concat([buffer, chunk]);
                    }
                });

                res.on('end', () => {
                    const dataStr = buffer.toString();
                    const data = JSON.parse(dataStr) as SessionResponse;
                    resolve(data);
                });
            });

            req.on('error', (err) => {
                logger.error(`Error: ${err.message || err}`);
                reject(err);
            });

            req.write(bodyString);
            req.end();
        });
    }
    extend(args: SessionArgs): Promise<SessionResponse> {
        return this.passThrough(args, 'extend');
    }
    validate(args: SessionArgs): Promise<SessionResponse> {
        return this.passThrough(args, 'validate');
    }
    terminate(args: SessionArgs): Promise<SessionResponse> {
        return this.passThrough(args, 'terminate');
    }
    init(args: SessionArgs): Promise<SessionResponse> {
        return this.passThrough(args, 'init');
    }
}

const sessionServiceController = new SessionService(CONFIG.SessionServiceConfig);
export default sessionServiceController;
