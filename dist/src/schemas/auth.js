"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcceptInviteSchema = exports.RefreshTokenSchema = exports.DeleteAccountSchema = exports.LoginSchema = exports.ConfirmPinSchema = exports.SetupPinSchema = exports.CompleteAdditionalProfileSchema = exports.CompleteBasicProfileSchema = exports.ResetPasswordSchema = exports.VerifyEmailSchema = exports.SendOtpSchema = exports.OTPType = exports.RegistrationStatus = void 0;
const helpers_1 = require("../utils/helpers");
const zod_1 = require("zod");
const user_1 = require("./user");
var RegistrationStatus;
(function (RegistrationStatus) {
    RegistrationStatus["INCOMPLETE"] = "incomplete";
    RegistrationStatus["COMPLETE"] = "complete";
    RegistrationStatus["ACTIVE"] = "active";
})(RegistrationStatus || (exports.RegistrationStatus = RegistrationStatus = {}));
var OTPType;
(function (OTPType) {
    OTPType["REGISTER"] = "register";
    OTPType["RESET"] = "reset";
})(OTPType || (exports.OTPType = OTPType = {}));
exports.SendOtpSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    type: zod_1.z.nativeEnum(OTPType).optional(),
});
exports.VerifyEmailSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    otp: zod_1.z
        .string()
        .length(6, 'OTP must be 6 digits')
        .regex(/^\d{6}$/, 'PIN must contain only numbers'),
});
exports.ResetPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    otp: zod_1.z
        .string()
        .length(6, 'OTP must be 6 digits')
        .regex(/^\d{6}$/, 'PIN must contain only numbers'),
    password: zod_1.z.string().min(6, 'New password must be at least 6 characters'),
});
exports.CompleteBasicProfileSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    firstName: zod_1.z.string().min(1, 'First name is required'),
    lastName: zod_1.z.string().min(1, 'Last name is required'),
    userName: zod_1.z.string().optional(),
    referrer: zod_1.z.string().optional(),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
});
exports.CompleteAdditionalProfileSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    country: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Country name is required'),
        code: zod_1.z.string().min(1, 'Country code is required'),
        callingCode: zod_1.z.string().min(1, 'Country calling code is required'),
        currency: zod_1.z.string().min(1, 'Country currency is required'),
    }),
    phoneNumber: zod_1.z.string().min(1, 'Phone number is required'),
    dateOfBirth: zod_1.z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
        .refine(helpers_1.isAdult, { message: 'You must be at least 18 years old' }),
    gender: zod_1.z.nativeEnum(user_1.Gender),
});
exports.SetupPinSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    pin: zod_1.z
        .string()
        .length(6, 'PIN must be 6 digits')
        .regex(/^\d{6}$/, 'PIN must contain only numbers'),
});
exports.ConfirmPinSchema = zod_1.z.object({
    pin: zod_1.z
        .string()
        .length(6, 'PIN must be 6 digits')
        .regex(/^\d{6}$/, 'PIN must contain only numbers'),
});
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
});
exports.DeleteAccountSchema = zod_1.z.object({
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    reason: zod_1.z.string().optional(),
});
exports.RefreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string(),
});
exports.AcceptInviteSchema = zod_1.z.object({
    token: zod_1.z.string(),
    password: zod_1.z
        .string()
        .min(6, 'Password must be at least 6 characters')
        .optional(),
    action: zod_1.z.enum(['accept', 'reject']).optional(),
});
//# sourceMappingURL=auth.js.map