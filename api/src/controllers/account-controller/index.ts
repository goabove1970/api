import { accountPersistenceController } from '../data-controller/account/account-persistance-controller';
import  { AccountController } from './account-controller';

const accountController: AccountController = new AccountController(accountPersistenceController);
export default accountController;