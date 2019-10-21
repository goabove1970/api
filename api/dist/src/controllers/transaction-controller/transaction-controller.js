"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parser_controller_1 = require("../parser-controller");
class TransactionController {
    readTransaction(transactionId) { }
    ;
    addTransactionFromLine(line) {
        return parser_controller_1.chaseParseController.parseLine(line);
    }
}
exports.TransactionController = TransactionController;
//# sourceMappingURL=transaction-controller.js.map