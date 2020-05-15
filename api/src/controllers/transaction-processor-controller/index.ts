import * as http from 'http';
import { CONFIG, ServiceConfig } from '@root/app.config';
import { TransactionRequestTypeArgs, TransactionResponse } from '@root/src/routes/request-types/TransactionRequests';

export class TransactionPassThroughService {
    config: ServiceConfig;
    constructor(config: ServiceConfig) {
        this.config = config;
    }

    passThrough(args: TransactionRequestTypeArgs, action: string): Promise<TransactionResponse> {
        const reqBody = { action, args };
        const bodyString = JSON.stringify(reqBody);

        const options = {
            method: 'POST',
            hostname: this.config.url,
            port: this.config.port,
            path: '/transactions',
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
                    const data = JSON.parse(dataStr) as TransactionResponse;
                    resolve(data);
                });
            });

            req.on('error', (err) => {
                console.error(`Error: ${err.message || err}`);
                reject(err);
            });

            req.write(bodyString);
            req.end();
        });
    }
}

const transactionPassThrough = new TransactionPassThroughService(CONFIG.BankServiceConfig);
export default transactionPassThrough;
