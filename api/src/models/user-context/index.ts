import { Card } from '../cards/card';
import { UserAccount } from '../accounts/Account';
import { UserDetails } from '../user/UserDetails';

export interface ActiveContext {}

export class UserContext {
  private activeUser?: UserDetails;
  private availableCards?: Card[];
  private acconts?: UserAccount[];

  private contructor() {}

  static initializeContext(userId?: string) {
    return new UserContext();
  }
}
