"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateBankSchema = exports.AddBankSchema = exports.MakeTransactionSchema = exports.EnableNotificationsSchema = exports.UpdatePinSchema = exports.UpdatePasswordSchema = exports.UpdatecProfileSchema = exports.RewardStatus = exports.TransactionStatus = exports.Gender = void 0;
const helpers_1 = require("../utils/helpers");
const zod_1 = require("zod");
var Gender;
(function (Gender) {
    Gender["MALE"] = "male";
    Gender["FEMALE"] = "female";
    Gender["OTHERS"] = "others";
})(Gender || (exports.Gender = Gender = {}));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PENDING"] = "pending";
    TransactionStatus["SUCCESS"] = "successful";
    TransactionStatus["FAILED"] = "failed";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
var RewardStatus;
(function (RewardStatus) {
    RewardStatus["PENDING"] = "pending";
    RewardStatus["SUCCESS"] = "successful";
})(RewardStatus || (exports.RewardStatus = RewardStatus = {}));
exports.UpdatecProfileSchema = zod_1.z.object({
    firstName: zod_1.z.string().optional(),
    lastName: zod_1.z.string().optional(),
    userName: zod_1.z.string().optional(),
    country: zod_1.z
        .object({
        name: zod_1.z.string().min(1, 'Country name is required'),
        code: zod_1.z.string().min(1, 'Country colde is required'),
        callingCode: zod_1.z.string().min(1, 'Country calling code is required'),
        currency: zod_1.z.string().min(1, 'Country currency is required'),
    })
        .optional(),
    phoneNumber: zod_1.z.string().optional(),
    dateOfBirth: zod_1.z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
        .refine(helpers_1.isAdult, { message: 'You must be at least 18 years old' })
        .optional(),
    gender: zod_1.z.nativeEnum(Gender).optional(),
});
exports.UpdatePasswordSchema = zod_1.z.object({
    oldPassword: zod_1.z.string().min(6, 'New password must be at least 6 characters'),
    newPassword: zod_1.z.string().min(6, 'New password must be at least 6 characters'),
});
exports.UpdatePinSchema = zod_1.z.object({
    oldPin: zod_1.z
        .string()
        .length(6, 'PIN must be 6 digits')
        .regex(/^\d{6}$/, 'PIN must contain only numbers'),
    newPin: zod_1.z
        .string()
        .length(6, 'PIN must be 6 digits')
        .regex(/^\d{6}$/, 'PIN must contain only numbers'),
});
exports.EnableNotificationsSchema = zod_1.z.object({
    enable: zod_1.z.boolean(),
});
exports.MakeTransactionSchema = zod_1.z.object({
    assetId: zod_1.z.string().min(1, 'Asset is required'),
    networkId: zod_1.z.string().min(1, 'Network is required'),
    address: zod_1.z.string().min(1, 'Network name is required'),
    quantity: zod_1.z.number().gte(1, { message: 'Quantity must be at least 1' }),
    proof: zod_1.z
        .string()
        .url({ message: 'Invalid URL' })
        .min(1, { message: 'Proof is required' }),
});
exports.AddBankSchema = zod_1.z.object({
    bankName: zod_1.z.string().min(1, 'Bank name is required'),
    accountName: zod_1.z.string().min(1, 'Account name is required'),
    accountNumber: zod_1.z.string().min(1, 'Account number is required'),
});
exports.UpdateBankSchema = zod_1.z.object({
    bankName: zod_1.z.string().optional(),
    accountNumber: zod_1.z.string().optional(),
    accountName: zod_1.z.string().optional(),
});
//# sourceMappingURL=user.js.map