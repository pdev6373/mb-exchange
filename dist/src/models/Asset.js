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
exports.AssetModel = exports.Asset = exports.CryptoNetwork = void 0;
const typegoose_1 = require("@typegoose/typegoose");
class CryptoNetwork {
}
exports.CryptoNetwork = CryptoNetwork;
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], CryptoNetwork.prototype, "name", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], CryptoNetwork.prototype, "address", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: 'https://icon.png' }),
    __metadata("design:type", String)
], CryptoNetwork.prototype, "icon", void 0);
let Asset = class Asset {
};
exports.Asset = Asset;
__decorate([
    (0, typegoose_1.prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Asset.prototype, "name", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Asset.prototype, "symbol", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Asset.prototype, "icon", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", Number)
], Asset.prototype, "rate", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", Number)
], Asset.prototype, "vipRate", void 0);
__decorate([
    (0, typegoose_1.prop)({ type: () => [CryptoNetwork], default: [] }),
    __metadata("design:type", Array)
], Asset.prototype, "networks", void 0);
exports.Asset = Asset = __decorate([
    (0, typegoose_1.modelOptions)({ schemaOptions: { timestamps: true } })
], Asset);
exports.AssetModel = (0, typegoose_1.getModelForClass)(Asset, {
    schemaOptions: {
        timestamps: true,
    },
});
//# sourceMappingURL=Asset.js.map