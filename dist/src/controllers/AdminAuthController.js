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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminAuthController = void 0;
const tsoa_1 = require("tsoa");
const Admin_1 = require("../models/Admin");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const validateRequest_1 = require("../middleware/validateRequest");
const responseWrapper_1 = require("../utils/responseWrapper");
const customErrors_1 = require("../utils/customErrors");
const auth_1 = require("../schemas/auth");
const helpers_1 = require("../utils/helpers");
const ACCESS_TOKEN_EXPIRY = '1d';
const REFRESH_TOKEN_EXPIRY = '7d';
let AdminAuthController = class AdminAuthController {
    async login(data) {
        const { email, password } = data;
        const admin = await Admin_1.AdminModel.findOne({ email });
        if (!admin)
            throw new customErrors_1.NotFoundError('Admin not found');
        if (!admin.isActive)
            throw new customErrors_1.NotFoundError('Admin not verified');
        const isMatch = await bcryptjs_1.default.compare(password, admin.password);
        if (!isMatch)
            throw new customErrors_1.BadRequestError('Invalid email or password');
        const tokens = (0, helpers_1.generateTokens)({
            id: admin._id.toString(),
            email: admin.email,
            accessExpiry: ACCESS_TOKEN_EXPIRY,
            refreshExpiry: REFRESH_TOKEN_EXPIRY,
            role: admin?.role,
        });
        admin.refreshToken = tokens.refreshToken;
        await admin.save();
        return (0, responseWrapper_1.successResponse)('Login successfully', tokens);
    }
    async logout(req) {
        const admin = await Admin_1.AdminModel.findById(req.user?._id);
        if (!admin)
            throw new customErrors_1.NotFoundError('User not found');
        admin.refreshToken = undefined;
        await admin.save();
        return (0, responseWrapper_1.successResponse)('Logged out successfully');
    }
    async refreshToken(data) {
        const { refreshToken } = data;
        const decoded = jsonwebtoken_1.default.verify(refreshToken, helpers_1.REFRESH_TOKEN_SECRET);
        const admin = await Admin_1.AdminModel.findById(decoded._id);
        if (!admin)
            throw new customErrors_1.ForbiddenError('Invalid refresh token');
        const token = (0, helpers_1.generateTokens)({
            id: admin._id.toString(),
            email: admin.email,
            accessExpiry: ACCESS_TOKEN_EXPIRY,
            type: 'access',
            role: admin.role,
        });
        return (0, responseWrapper_1.successResponse)('Access token generated successfully', token);
    }
    async acceptInvite(data) {
        const { token, password, action } = data;
        try {
            const decoded = jsonwebtoken_1.default.verify(token, helpers_1.ACCESS_TOKEN_SECRET);
            const admin = await Admin_1.AdminModel.findById(decoded._id);
            if (!admin || !admin.invitationToken || admin.isActive)
                throw new customErrors_1.UnauthorizedError('Invalid or expired invitation');
            if (!action)
                return (0, responseWrapper_1.successResponse)('Valid Token');
            if (action == 'reject') {
                await admin.deleteOne();
                return (0, responseWrapper_1.successResponse)('Admin invitation rejected');
            }
            if (new Date() > new Date(admin.invitationExpires)) {
                await admin.deleteOne();
                throw new customErrors_1.UnauthorizedError('Invitation expired');
            }
            if (!password)
                throw new customErrors_1.BadRequestError('Password is required');
            const hashedPassword = await bcryptjs_1.default.hash(password, 10);
            admin.password = hashedPassword;
            admin.isActive = true;
            admin.invitationToken = undefined;
            admin.invitationExpires = undefined;
            await admin.save();
            return (0, responseWrapper_1.successResponse)('Admin invitation accepted');
        }
        catch (error) {
            throw new customErrors_1.UnauthorizedError('Invalid or expired token');
        }
    }
};
exports.AdminAuthController = AdminAuthController;
__decorate([
    (0, tsoa_1.Post)('/login'),
    (0, validateRequest_1.Validate)(auth_1.LoginSchema),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminAuthController.prototype, "login", null);
__decorate([
    (0, tsoa_1.Get)('/logout'),
    (0, tsoa_1.Security)('BearerAuth'),
    __param(0, (0, tsoa_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminAuthController.prototype, "logout", null);
__decorate([
    (0, tsoa_1.Post)('/refresh-token'),
    (0, validateRequest_1.Validate)(auth_1.RefreshTokenSchema),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminAuthController.prototype, "refreshToken", null);
__decorate([
    (0, tsoa_1.Post)('/accept-invite'),
    (0, validateRequest_1.Validate)(auth_1.AcceptInviteSchema),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminAuthController.prototype, "acceptInvite", null);
exports.AdminAuthController = AdminAuthController = __decorate([
    (0, tsoa_1.Tags)('Admin Auth'),
    (0, tsoa_1.Route)('admin-auth')
], AdminAuthController);
//# sourceMappingURL=AdminAuthController.js.map