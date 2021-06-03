import accountController from "../account-controller";
import categoryController from "../category-controller";
import { SpendingsController } from "./spendings-controller";

const spendingsController = new SpendingsController(accountController, categoryController);
export { spendingsController };
