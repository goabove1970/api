import { SessionService } from '@controllers/session-controller/session-service-controller';
import { SessionArgs } from '@routes/request-types/session-request';
import * as http from 'http';

// Mock http module
jest.mock('http');

describe('SessionService', () => {
    let sessionService: SessionService;
    const mockConfig = {
        url: 'localhost',
        port: 9200,
    };

    beforeEach(() => {
        sessionService = new SessionService(mockConfig);
        jest.clearAllMocks();
    });

    it('should initialize session', async () => {
        const mockArgs: SessionArgs = {
            sessionId: 'test-session-id',
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
                    callback(Buffer.from(JSON.stringify({ success: true, sessionId: 'test-session-id' })));
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

        const result = await sessionService.init(mockArgs);
        expect(result).toBeDefined();
        expect(http.request).toHaveBeenCalled();
    });

    it('should extend session', async () => {
        const mockArgs: SessionArgs = {
            sessionId: 'test-session-id',
        };

        const mockRequest = {
            write: jest.fn(),
            end: jest.fn(),
            on: jest.fn(),
        };

        const mockResponse = {
            on: jest.fn((event, callback) => {
                if (event === 'data') {
                    callback(Buffer.from(JSON.stringify({ success: true })));
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

        const result = await sessionService.extend(mockArgs);
        expect(result).toBeDefined();
    });

    it('should validate session', async () => {
        const mockArgs: SessionArgs = {
            sessionId: 'test-session-id',
        };

        const mockRequest = {
            write: jest.fn(),
            end: jest.fn(),
            on: jest.fn(),
        };

        const mockResponse = {
            on: jest.fn((event, callback) => {
                if (event === 'data') {
                    callback(Buffer.from(JSON.stringify({ valid: true })));
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

        const result = await sessionService.validate(mockArgs);
        expect(result).toBeDefined();
    });

    it('should terminate session', async () => {
        const mockArgs: SessionArgs = {
            sessionId: 'test-session-id',
        };

        const mockRequest = {
            write: jest.fn(),
            end: jest.fn(),
            on: jest.fn(),
        };

        const mockResponse = {
            on: jest.fn((event, callback) => {
                if (event === 'data') {
                    callback(Buffer.from(JSON.stringify({ success: true })));
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

        const result = await sessionService.terminate(mockArgs);
        expect(result).toBeDefined();
    });

    it('should handle HTTP errors', async () => {
        const mockArgs: SessionArgs = {
            sessionId: 'test-session-id',
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

        await expect(sessionService.init(mockArgs)).rejects.toThrow();
    });
});

