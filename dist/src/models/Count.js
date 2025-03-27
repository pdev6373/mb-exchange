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
exports.CountModel = exports.Count = void 0;
const typegoose_1 = require("@typegoose/typegoose");
const helpers_1 = require("../utils/helpers");
class MonthlyTransactions {
}
__decorate([
    (0, typegoose_1.prop)({ required: true, default: (0, helpers_1.getCurrentMonth)() }),
    __metadata("design:type", Number)
], MonthlyTransactions.prototype, "key", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 0, required: true }),
    __metadata("design:type", Number)
], MonthlyTransactions.prototype, "all", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 0, required: true }),
    __metadata("design:type", Number)
], MonthlyTransactions.prototype, "pending", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 0, required: true }),
    __metadata("design:type", Number)
], MonthlyTransactions.prototype, "successful", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 0, required: true }),
    __metadata("design:type", Number)
], MonthlyTransactions.prototype, "failed", void 0);
class YearlyTransactions {
}
__decorate([
    (0, typegoose_1.prop)({ required: true, default: (0, helpers_1.getCurrentYear)() }),
    __metadata("design:type", Number)
], YearlyTransactions.prototype, "key", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 0, required: true }),
    __metadata("design:type", Number)
], YearlyTransactions.prototype, "all", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 0, required: true }),
    __metadata("design:type", Number)
], YearlyTransactions.prototype, "pending", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 0, required: true }),
    __metadata("design:type", Number)
], YearlyTransactions.prototype, "successful", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 0, required: true }),
    __metadata("design:type", Number)
], YearlyTransactions.prototype, "failed", void 0);
class MonthlyRewards {
}
__decorate([
    (0, typegoose_1.prop)({ required: true, default: (0, helpers_1.getCurrentMonth)() }),
    __metadata("design:type", Number)
], MonthlyRewards.prototype, "key", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 0, required: true }),
    __metadata("design:type", Number)
], MonthlyRewards.prototype, "all", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 0, required: true }),
    __metadata("design:type", Number)
], MonthlyRewards.prototype, "pending", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 0, required: true }),
    __metadata("design:type", Number)
], MonthlyRewards.prototype, "successful", void 0);
class YearlyRewards {
}
__decorate([
    (0, typegoose_1.prop)({ required: true, default: (0, helpers_1.getCurrentYear)() }),
    __metadata("design:type", Number)
], YearlyRewards.prototype, "key", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 0, required: true }),
    __metadata("design:type", Number)
], YearlyRewards.prototype, "all", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 0, required: true }),
    __metadata("design:type", Number)
], YearlyRewards.prototype, "pending", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 0, required: true }),
    __metadata("design:type", Number)
], YearlyRewards.prototype, "successful", void 0);
class MonthlyUsers {
}
__decorate([
    (0, typegoose_1.prop)({ required: true, default: (0, helpers_1.getCurrentMonth)() }),
    __metadata("design:type", Number)
], MonthlyUsers.prototype, "key", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 0, required: true }),
    __metadata("design:type", Number)
], MonthlyUsers.prototype, "active", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 0, required: true }),
    __metadata("design:type", Number)
], MonthlyUsers.prototype, "inactive", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 0, required: true }),
    __metadata("design:type", Number)
], MonthlyUsers.prototype, "all", void 0);
class YearlyUsers {
}
__decorate([
    (0, typegoose_1.prop)({ required: true, default: (0, helpers_1.getCurrentYear)() }),
    __metadata("design:type", Number)
], YearlyUsers.prototype, "key", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 0, required: true }),
    __metadata("design:type", Number)
], YearlyUsers.prototype, "active", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 0, required: true }),
    __metadata("design:type", Number)
], YearlyUsers.prototype, "inactive", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 0, required: true }),
    __metadata("design:type", Number)
], YearlyUsers.prototype, "all", void 0);
class Users {
}
__decorate([
    (0, typegoose_1.prop)({ default: 0, required: true }),
    __metadata("design:type", Number)
], Users.prototype, "all", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 0, required: true }),
    __metadata("design:type", Number)
], Users.prototype, "active", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 0, required: true }),
    __metadata("design:type", Number)
], Users.prototype, "inactive", void 0);
__decorate([
    (0, typegoose_1.prop)({
        type: () => MonthlyUsers,
        _id: false,
        default: () => new MonthlyUsers(),
    }),
    __metadata("design:type", MonthlyUsers)
], Users.prototype, "month", void 0);
__decorate([
    (0, typegoose_1.prop)({
        type: () => YearlyUsers,
        _id: false,
        default: () => new YearlyUsers(),
    }),
    __metadata("design:type", YearlyUsers)
], Users.prototype, "year", void 0);
class Transactions {
}
__decorate([
    (0, typegoose_1.prop)({ default: 0, required: true }),
    __metadata("design:type", Number)
], Transactions.prototype, "all", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 0, required: true }),
    __metadata("design:type", Number)
], Transactions.prototype, "pending", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 0, required: true }),
    __metadata("design:type", Number)
], Transactions.prototype, "successful", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 0, required: true }),
    __metadata("design:type", Number)
], Transactions.prototype, "failed", void 0);
__decorate([
    (0, typegoose_1.prop)({
        type: () => MonthlyTransactions,
        _id: false,
        default: () => new MonthlyTransactions(),
    }),
    __metadata("design:type", MonthlyTransactions)
], Transactions.prototype, "month", void 0);
__decorate([
    (0, typegoose_1.prop)({
        type: () => YearlyTransactions,
        _id: false,
        default: () => new YearlyTransactions(),
    }),
    __metadata("design:type", YearlyTransactions)
], Transactions.prototype, "year", void 0);
class Rewards {
}
__decorate([
    (0, typegoose_1.prop)({ default: 0, required: true }),
    __metadata("design:type", Number)
], Rewards.prototype, "all", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 0, required: true }),
    __metadata("design:type", Number)
], Rewards.prototype, "pending", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 0, required: true }),
    __metadata("design:type", Number)
], Rewards.prototype, "successful", void 0);
__decorate([
    (0, typegoose_1.prop)({
        type: () => MonthlyRewards,
        _id: false,
        default: () => new MonthlyRewards(),
    }),
    __metadata("design:type", MonthlyRewards)
], Rewards.prototype, "month", void 0);
__decorate([
    (0, typegoose_1.prop)({
        type: () => YearlyRewards,
        _id: false,
        default: () => new YearlyRewards(),
    }),
    __metadata("design:type", YearlyRewards)
], Rewards.prototype, "year", void 0);
class YearlyRevenue {
}
__decorate([
    (0, typegoose_1.prop)({ required: true, default: (0, helpers_1.getCurrentYear)() }),
    __metadata("design:type", Number)
], YearlyRevenue.prototype, "key", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 0, required: true }),
    __metadata("design:type", Number)
], YearlyRevenue.prototype, "revenue", void 0);
class MonthlyRevenue {
}
__decorate([
    (0, typegoose_1.prop)({ required: true, default: (0, helpers_1.getCurrentMonth)() }),
    __metadata("design:type", Number)
], MonthlyRevenue.prototype, "key", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 0, required: true }),
    __metadata("design:type", Number)
], MonthlyRevenue.prototype, "revenue", void 0);
class Revenue {
}
__decorate([
    (0, typegoose_1.prop)({ default: 0, required: true }),
    __metadata("design:type", Number)
], Revenue.prototype, "all", void 0);
__decorate([
    (0, typegoose_1.prop)({
        type: () => MonthlyRevenue,
        _id: false,
        default: () => new MonthlyRevenue(),
    }),
    __metadata("design:type", MonthlyRevenue)
], Revenue.prototype, "month", void 0);
__decorate([
    (0, typegoose_1.prop)({
        type: () => YearlyRevenue,
        _id: false,
        default: () => new YearlyRevenue(),
    }),
    __metadata("design:type", YearlyRevenue)
], Revenue.prototype, "year", void 0);
let Count = class Count {
};
exports.Count = Count;
__decorate([
    (0, typegoose_1.prop)({ type: () => Users, _id: false, default: () => new Users() }),
    __metadata("design:type", Users)
], Count.prototype, "users", void 0);
__decorate([
    (0, typegoose_1.prop)({
        type: () => Transactions,
        _id: false,
        default: () => new Transactions(),
    }),
    __metadata("design:type", Transactions)
], Count.prototype, "transactions", void 0);
__decorate([
    (0, typegoose_1.prop)({ type: () => Rewards, _id: false, default: () => new Rewards() }),
    __metadata("design:type", Rewards)
], Count.prototype, "rewards", void 0);
__decorate([
    (0, typegoose_1.prop)({ type: () => Revenue, _id: false, default: () => new Revenue() }),
    __metadata("design:type", Revenue)
], Count.prototype, "revenue", void 0);
exports.Count = Count = __decorate([
    (0, typegoose_1.modelOptions)({ schemaOptions: { timestamps: true } })
], Count);
exports.CountModel = (0, typegoose_1.getModelForClass)(Count);
//# sourceMappingURL=Count.js.map