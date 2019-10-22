"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function parseNumer(line) {
    try {
        const number = Number.parseFloat(line);
        return number;
    }
    catch (error) {
        console.log(JSON.stringify(error, null, 4));
    }
    return undefined;
}
exports.parseNumer = parseNumer;
function parseAmount(line) {
    return parseNumer(line);
}
exports.parseAmount = parseAmount;
function parseBalance(line) {
    return parseNumer(line);
}
exports.parseBalance = parseBalance;
//# sourceMappingURL=helper.js.map