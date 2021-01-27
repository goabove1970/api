import { SessionArgs } from '@routes/request-types/session-request';
import { ValidationError } from '@models/errors/errors';

export async function matchesReadArgs(args: SessionArgs): Promise<string> {
    if (!args) {
        return '';
    }

    const conditions = [];
    if (args.sessionId) {
        conditions.push(`session_id = '${args.sessionId}'`);
    }

    let finalSattement = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    return finalSattement;
}

export function validateSessionUpdateArgs(args: SessionArgs): void {
    if (!args) {
        throw new ValidationError('Can not update session, no arguments passed');
    }

    if (!args.sessionId) {
        throw new ValidationError('Can not update session, no sessionId passed');
    }
}

export function validateSessionCreateArgs(args: SessionArgs): void {
    if (!args) {
        throw new ValidationError('Can not create session, no arguments passed');
    }

    if (!args.sessionId) {
        throw new ValidationError('Can not create session, no sessionId passed');
    }

    if (!args.loginTimestamp) {
        throw new ValidationError('Can not create session, no loginTimestamp');
    }
}
