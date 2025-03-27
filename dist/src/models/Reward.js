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
exports.RewardModel = exports.Reward = void 0;
const typegoose_1 = require("@typegoose/typegoose");
const user_1 = require("../schemas/user");
class RewardInitiator {
}
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], RewardInitiator.prototype, "id", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], RewardInitiator.prototype, "firstName", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], RewardInitiator.prototype, "lastName", void 0);
class Reward {
}
exports.Reward = Reward;
__decorate([
    (0, typegoose_1.prop)({ _id: false }),
    __metadata("design:type", RewardInitiator)
], Reward.prototype, "user", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", Number)
], Reward.prototype, "amount", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Reward.prototype, "key", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: user_1.RewardStatus.PENDING, enum: user_1.RewardStatus }),
    __metadata("design:type", String)
], Reward.prototype, "status", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", Date)
], Reward.prototype, "dateApproved", void 0);
exports.RewardModel = (0, typegoose_1.getModelForClass)(Reward, {
    schemaOptions: {
        timestamps: true,
    },
});
//# sourceMappingURL=Reward.js.map