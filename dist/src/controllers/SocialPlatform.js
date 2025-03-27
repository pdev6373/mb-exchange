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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialPlatformController = void 0;
const tsoa_1 = require("tsoa");
const responseWrapper_1 = require("../utils/responseWrapper");
const customErrors_1 = require("../utils/customErrors");
const validateRequest_1 = require("../middleware/validateRequest");
const SocialPlatform_1 = require("../models/SocialPlatform");
const admin_1 = require("../schemas/admin");
const socialPlatform_1 = require("../schemas/socialPlatform");
let SocialPlatformController = class SocialPlatformController {
    async getSocialPlatforms() {
        const socialPlatforms = await SocialPlatform_1.SocialPlatformModel.find().lean();
        return (0, responseWrapper_1.successResponse)('Social Platforms fetched successfully', socialPlatforms);
    }
    async getSocialPlatform(id) {
        const socialPlatform = await SocialPlatform_1.SocialPlatformModel.findById(id).lean();
        if (!socialPlatform)
            throw new customErrors_1.NotFoundError('Social platform not found');
        return (0, responseWrapper_1.successResponse)('Social Platform fetched successfully', socialPlatform);
    }
    async addBank(data) {
        const { icon, name, url } = data;
        const socialPlatformExist = await SocialPlatform_1.SocialPlatformModel.findOne({ name });
        if (socialPlatformExist)
            throw new customErrors_1.BadRequestError('A social platform with this name already exists');
        await SocialPlatform_1.SocialPlatformModel.create({
            icon,
            name,
            url,
        });
        return (0, responseWrapper_1.successResponse)('Social platform added successfully');
    }
    async updatePassword(id, data, req) {
        const { icon, name, url } = data;
        const socialPlatform = await SocialPlatform_1.SocialPlatformModel.findById(id);
        if (!socialPlatform)
            throw new customErrors_1.NotFoundError('Social platform not found');
        if (name) {
            const socialPlatformExist = await SocialPlatform_1.SocialPlatformModel.findOne({
                name,
                _id: { $ne: id },
            });
            if (socialPlatformExist)
                throw new customErrors_1.BadRequestError('A social platform with name already exists');
            socialPlatform.name = name;
        }
        if (url)
            socialPlatform.url = url;
        if (icon)
            socialPlatform.icon = icon;
        await socialPlatform.save();
        return (0, responseWrapper_1.successResponse)('Social platform updated successfully');
    }
    async deleteSocialPlatform(id) {
        const deletedSocialPlatform = await SocialPlatform_1.SocialPlatformModel.findByIdAndDelete(id);
        if (!deletedSocialPlatform)
            throw new customErrors_1.NotFoundError('Social platform not found');
        return (0, responseWrapper_1.successResponse)('Social platform deleted successfully');
    }
};
exports.SocialPlatformController = SocialPlatformController;
__decorate([
    (0, tsoa_1.Get)('/'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SocialPlatformController.prototype, "getSocialPlatforms", null);
__decorate([
    (0, tsoa_1.Get)('/:id'),
    __param(0, (0, tsoa_1.Path)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SocialPlatformController.prototype, "getSocialPlatform", null);
__decorate([
    (0, tsoa_1.Post)('/'),
    (0, validateRequest_1.Validate)(socialPlatform_1.AddSocialPlatformSchema),
    (0, tsoa_1.Security)('BearerAuth', Object.values(admin_1.Role)),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SocialPlatformController.prototype, "addBank", null);
__decorate([
    (0, tsoa_1.Patch)('/:id'),
    (0, validateRequest_1.Validate)(socialPlatform_1.UpdateSocialPlatformSchema),
    (0, tsoa_1.Security)('BearerAuth', Object.values(admin_1.Role)),
    __param(0, (0, tsoa_1.Path)()),
    __param(1, (0, tsoa_1.Body)()),
    __param(2, (0, tsoa_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SocialPlatformController.prototype, "updatePassword", null);
__decorate([
    (0, tsoa_1.Delete)('/:id'),
    (0, tsoa_1.Security)('BearerAuth', Object.values(admin_1.Role)),
    __param(0, (0, tsoa_1.Path)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SocialPlatformController.prototype, "deleteSocialPlatform", null);
exports.SocialPlatformController = SocialPlatformController = __decorate([
    (0, tsoa_1.Tags)('Social Platforms'),
    (0, tsoa_1.Route)('social-platforms'),
    (0, tsoa_1.Security)('BearerAuth')
], SocialPlatformController);
//# sourceMappingURL=SocialPlatform.js.map