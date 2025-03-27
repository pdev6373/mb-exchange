"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expressAuthentication = expressAuthentication;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const customErrors_1 = require("../utils/customErrors");
const Admin_1 = require("../models/Admin");
const helpers_1 = require("../utils/helpers");
async function expressAuthentication(request, securityName, scopes) {
    if (securityName !== 'BearerAuth')
        throw new customErrors_1.BadRequestError('Unknown authentication type');
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer '))
        throw new customErrors_1.ForbiddenError('Invalid token');
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, helpers_1.ACCESS_TOKEN_SECRET);
        let user;
        if (decoded.role)
            user = await Admin_1.AdminModel.findById(decoded._id).select('-password').lean();
        else
            user = await User_1.UserModel.findById(decoded._id)
                .select('-password -pin')
                .lean();
        if (!user)
            throw new customErrors_1.NotFoundError(`${decoded.role || 'user'} not found`);
        if (!user.refreshToken)
            throw new customErrors_1.ForbiddenError('Logged out');
        if (scopes?.length && (!decoded?.role || !scopes.includes(decoded?.role)))
            throw new customErrors_1.UnauthorizedError('Insufficient permissions');
        request.user = user;
        return user;
    }
    catch (error) {
        if (error instanceof customErrors_1.UnauthorizedError || error instanceof customErrors_1.NotFoundError)
            throw error;
        else
            throw new customErrors_1.ForbiddenError('Invalid token');
    }
}
//# sourceMappingURL=authentication.js.map