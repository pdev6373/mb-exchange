"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionModel = exports.Transaction = void 0;
const typegoose_1 = require("@typegoose/typegoose");
const user_1 = require("../schemas/user");
class TransactionInitiator {
}
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], TransactionInitiator.prototype, "id", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], TransactionInitiator.prototype, "firstName", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], TransactionInitiator.prototype, "lastName", void 0);
class TransactionPlatform {
}
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], TransactionPlatform.prototype, "platform", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], TransactionPlatform.prototype, "address", void 0);
class TransactionAsset {
}
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], TransactionAsset.prototype, "id", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], TransactionAsset.prototype, "name", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], TransactionAsset.prototype, "symbol", void 0);
class Transaction {
}
exports.Transaction = Transaction;
__decorate([
    (0, typegoose_1.prop)({ _id: false }),
    __metadata("design:type", TransactionInitiator)
], Transaction.prototype, "user", void 0);
__decorate([
    (0, typegoose_1.prop)({ _id: false }),
    __metadata("design:type", TransactionAsset)
], Transaction.prototype, "asset", void 0);
__decorate([
    (0, typegoose_1.prop)({ _id: false }),
    __metadata("design:type", TransactionPlatform)
], Transaction.prototype, "platform", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Transaction.prototype, "key", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Transaction.prototype, "address", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", Number)
], Transaction.prototype, "quantity", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", Number)
], Transaction.prototype, "rate", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", Number)
], Transaction.prototype, "amount", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Transaction.prototype, "proof", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", Date)
], Transaction.prototype, "dateApproved", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: user_1.TransactionStatus.PENDING, enum: user_1.TransactionStatus }),
    __metadata("design:type", String)
], Transaction.prototype, "status", void 0);
exports.TransactionModel = (0, typegoose_1.getModelForClass)(Transaction, {
    schemaOptions: {
        timestamps: true,
    },
});
//# sourceMappingURL=Transaction.js.map