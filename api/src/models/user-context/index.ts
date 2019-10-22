import { Card } from "../../models/accounts/card";
import { BankAccount } from "../../models/accounts/bank-account";
import { User } from "../../models/user";

export interface ActiveContext {

}

export class UserContext {
    private activeUser?: User;
    private availableCards?: Card[];
    private acconts?: BankAccount[];

    private contructor() {

    }

    static initializeContext(userId?: string) {


        return new UserContext();
    }



}