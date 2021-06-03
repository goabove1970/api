import { BankSyncArgs, BankConnectionResponse } from '@routes/request-types/bank-connections-requests';
import * as http from 'http';
import { CONFIG, ServiceConfig } from '@root/app.config';
import logger from '@root/src/logger';

export class BankSyncService {
    config: ServiceConfig;
    constructor(config: ServiceConfig) {
        this.config = config;
    }

    passThrough(args: BankSyncArgs, action: string): Promise<BankConnectionResponse> {
        const reqBody = { action, args };
        const bodyString = JSON.stringify(reqBody);

        const options = {
            method: 'POST',
            hostname: this.config.url,
            port: this.config.port,
            path: '/bank-connections',
            headers: {
                'content-type': 'application/json',
                'content-length': Buffer.byteLength(bodyString),
            },
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
                    const data = JSON.parse(dataStr) as BankConnectionResponse;
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
}

const bankSyncController = new BankSyncService(CONFIG.BankServiceConfig);
export default bankSyncController;
