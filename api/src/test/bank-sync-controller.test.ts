import { BankSyncService } from '@controllers/bank-sync-controller';
import { BankSyncArgs } from '@routes/request-types/bank-connections-requests';
import * as http from 'http';

// Mock http module
jest.mock('http');

describe('BankSyncService', () => {
    let bankSyncService: BankSyncService;
    const mockConfig = {
        url: 'localhost',
        port: 9300,
    };

    beforeEach(() => {
        bankSyncService = new BankSyncService(mockConfig);
        jest.clearAllMocks();
    });

    it('should pass through bank sync request', async () => {
        const mockArgs: BankSyncArgs = {
            userId: 'test-user-id',
            connectionId: 'test-connection-id',
        };

        const mockRequest = {
            write: jest.fn(),
            end: jest.fn(),
            on: jest.fn((event, callback) => {
                if (event === 'error') {
                    // Don't call error callback
                }
            }),
        };

        const mockResponse = {
            on: jest.fn((event, callback) => {
                if (event === 'data') {
                    callback(Buffer.from(JSON.stringify({ success: true, connected: true })));
                }
                if (event === 'end') {
                    callback();
                }
            }),
        };

        (http.request as jest.Mock).mockImplementation((options, callback) => {
            if (callback) {
                callback(mockResponse);
            }
            return mockRequest;
        });

        const result = await bankSyncService.passThrough(mockArgs, 'connect');
        expect(result).toBeDefined();
        expect(http.request).toHaveBeenCalled();
        expect(mockRequest.write).toHaveBeenCalled();
        expect(mockRequest.end).toHaveBeenCalled();
    });

    it('should handle HTTP errors', async () => {
        const mockArgs: BankSyncArgs = {
            userId: 'test-user-id',
        };

        const mockRequest = {
            write: jest.fn(),
            end: jest.fn(),
            on: jest.fn((event, callback) => {
                if (event === 'error') {
                    callback(new Error('Network error'));
                }
            }),
        };

        (http.request as jest.Mock).mockImplementation(() => {
            return mockRequest;
        });

        await expect(bankSyncService.passThrough(mockArgs, 'connect')).rejects.toThrow();
    });
});

