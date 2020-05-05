import { SessionArgs } from '@root/src/routes/request-types/session-request';
import { sessionDatabaseController } from '../data-controller/session/SessionPersistenceController';
import { Session } from '@root/src/models/session';

export class SessionController {
    update(args: SessionArgs): Promise<void> {
        return sessionDatabaseController.update(args);
    }

    delete(args: SessionArgs): Promise<void> {
        return sessionDatabaseController.delete(args);
    }

    read(args: SessionArgs): Promise<Session[]> {
        return sessionDatabaseController.read(args);
    }

    create(args: SessionArgs): Promise<void> {
        return sessionDatabaseController.add(args);
    }
}

export const sessionController = new SessionController();
