import { Session } from '@models/session';
import { SessionArgs } from '@routes/request-types/session-request';

export abstract class SessionPersistanceControllerReadonlyBase {
    abstract read(args: SessionArgs): Promise<Session[]>;
}

export abstract class SessionPersistanceControllerBase extends SessionPersistanceControllerReadonlyBase {
    abstract update(args: SessionArgs): Promise<void>;
    abstract add(args: SessionArgs): Promise<void>;
    abstract delete(args: SessionArgs): Promise<void>;
}
