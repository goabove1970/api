import { accountPostgresDataController } from "../AccountPostgresController";
import { AccountPersistenceController } from "./account-persistance-controller";

export const accountPersistenceController = new AccountPersistenceController(accountPostgresDataController);
