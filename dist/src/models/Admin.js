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
exports.AdminModel = exports.Admin = void 0;
const typegoose_1 = require("@typegoose/typegoose");
const admin_1 = require("../schemas/admin");
class Admin {
}
exports.Admin = Admin;
__decorate([
    (0, typegoose_1.prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Admin.prototype, "email", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", String)
], Admin.prototype, "password", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true }),
    __metadata("design:type", String)
], Admin.prototype, "name", void 0);
__decorate([
    (0, typegoose_1.prop)({ default: admin_1.Role.ADMIN, enum: admin_1.Role }),
    __metadata("design:type", String)
], Admin.prototype, "role", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", String)
], Admin.prototype, "invitationToken", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", Date)
], Admin.prototype, "invitationExpires", void 0);
__decorate([
    (0, typegoose_1.prop)({ required: true, default: false }),
    __metadata("design:type", Boolean)
], Admin.prototype, "isActive", void 0);
__decorate([
    (0, typegoose_1.prop)(),
    __metadata("design:type", String)
], Admin.prototype, "refreshToken", void 0);
exports.AdminModel = (0, typegoose_1.getModelForClass)(Admin, {
    schemaOptions: {
        timestamps: true,
    },
});
//# sourceMappingURL=Admin.js.map