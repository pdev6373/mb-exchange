"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterRoutes = RegisterRoutes;
const runtime_1 = require("@tsoa/runtime");
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
const UserController_1 = require("./../src/controllers/UserController");
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
const UploadController_1 = require("./../src/controllers/UploadController");
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
const SocialPlatform_1 = require("./../src/controllers/SocialPlatform");
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
const HealthController_1 = require("./../src/controllers/HealthController");
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
const AuthController_1 = require("./../src/controllers/AuthController");
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
const AssetController_1 = require("./../src/controllers/AssetController");
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
const AdminController_1 = require("./../src/controllers/AdminController");
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
const AdminAuthController_1 = require("./../src/controllers/AdminAuthController");
const authentication_1 = require("./../src/middleware/authentication");
const multer = require('multer');
const expressAuthenticationRecasted = authentication_1.expressAuthentication;
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
const models = {
    "Referrer": {
        "dataType": "refObject",
        "properties": {
            "id": { "dataType": "string", "required": true },
            "firstName": { "dataType": "string" },
            "lastName": { "dataType": "string" },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Country": {
        "dataType": "refObject",
        "properties": {
            "code": { "dataType": "string", "required": true },
            "name": { "dataType": "string", "required": true },
            "flag": { "dataType": "string", "required": true },
            "currency": { "dataType": "string", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GenderType": {
        "dataType": "refAlias",
        "type": { "dataType": "enum", "enums": ["male", "female", "others"], "validators": {} },
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RegistrationStatus": {
        "dataType": "refEnum",
        "enums": ["incomplete", "complete", "active"],
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Bank": {
        "dataType": "refObject",
        "properties": {
            "bankName": { "dataType": "string", "required": true },
            "accountNumber": { "dataType": "string", "required": true },
            "accountName": { "dataType": "string", "required": true },
            "default": { "dataType": "boolean", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "User": {
        "dataType": "refObject",
        "properties": {
            "email": { "dataType": "string", "required": true },
            "firstName": { "dataType": "string" },
            "lastName": { "dataType": "string" },
            "referred": { "dataType": "double" },
            "referrer": { "ref": "Referrer" },
            "userName": { "dataType": "string" },
            "referralCode": { "dataType": "string" },
            "password": { "dataType": "string" },
            "country": { "ref": "Country" },
            "phoneNumber": { "dataType": "string" },
            "dateOfBirth": { "dataType": "datetime" },
            "gender": { "ref": "GenderType" },
            "pin": { "dataType": "string" },
            "notificationsEnabled": { "dataType": "boolean" },
            "emailVerified": { "dataType": "boolean" },
            "registrationStatus": { "ref": "RegistrationStatus" },
            "refreshToken": { "dataType": "string" },
            "otp": { "dataType": "string" },
            "points": { "dataType": "double" },
            "successfulTransactions": { "dataType": "double" },
            "failedTransactions": { "dataType": "double" },
            "pendingTransactions": { "dataType": "double" },
            "totalTransactions": { "dataType": "double" },
            "successfulRewards": { "dataType": "double" },
            "pendingRewards": { "dataType": "double" },
            "totalRewards": { "dataType": "double" },
            "otpExpiresAt": { "dataType": "datetime" },
            "banks": { "dataType": "array", "array": { "dataType": "refObject", "ref": "Bank" } },
            "createdAt": { "dataType": "datetime" },
            "updatedAt": { "dataType": "datetime" },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Gender": {
        "dataType": "refEnum",
        "enums": ["male", "female", "others"],
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IUpdateProfileInput": {
        "dataType": "refObject",
        "properties": {
            "firstName": { "dataType": "string" },
            "lastName": { "dataType": "string" },
            "userName": { "dataType": "string" },
            "country": { "dataType": "nestedObjectLiteral", "nestedProperties": { "currency": { "dataType": "string", "required": true }, "callingCode": { "dataType": "string", "required": true }, "code": { "dataType": "string", "required": true }, "name": { "dataType": "string", "required": true } } },
            "phoneNumber": { "dataType": "string" },
            "dateOfBirth": { "dataType": "string" },
            "gender": { "ref": "Gender" },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IUpdatePasswordInput": {
        "dataType": "refObject",
        "properties": {
            "oldPassword": { "dataType": "string", "required": true },
            "newPassword": { "dataType": "string", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IUpdatePinInput": {
        "dataType": "refObject",
        "properties": {
            "oldPin": { "dataType": "string", "required": true },
            "newPin": { "dataType": "string", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IEnableNotificationsInput": {
        "dataType": "refObject",
        "properties": {
            "enable": { "dataType": "boolean", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RewardInitiator": {
        "dataType": "refObject",
        "properties": {
            "id": { "dataType": "string", "required": true },
            "firstName": { "dataType": "string", "required": true },
            "lastName": { "dataType": "string", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RewardStatusType": {
        "dataType": "refAlias",
        "type": { "dataType": "enum", "enums": ["pending", "successful"], "validators": {} },
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Reward": {
        "dataType": "refObject",
        "properties": {
            "user": { "ref": "RewardInitiator", "required": true },
            "amount": { "dataType": "double", "required": true },
            "key": { "dataType": "string", "required": true },
            "status": { "ref": "RewardStatusType", "required": true },
            "dateApproved": { "dataType": "datetime" },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TransactionInitiator": {
        "dataType": "refObject",
        "properties": {
            "id": { "dataType": "string", "required": true },
            "firstName": { "dataType": "string", "required": true },
            "lastName": { "dataType": "string", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TransactionAsset": {
        "dataType": "refObject",
        "properties": {
            "id": { "dataType": "string", "required": true },
            "name": { "dataType": "string", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TransactionNetwork": {
        "dataType": "refObject",
        "properties": {
            "id": { "dataType": "string", "required": true },
            "name": { "dataType": "string", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TransactionStatusType": {
        "dataType": "refAlias",
        "type": { "dataType": "enum", "enums": ["pending", "successful", "failed"], "validators": {} },
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Transaction": {
        "dataType": "refObject",
        "properties": {
            "user": { "ref": "TransactionInitiator", "required": true },
            "asset": { "ref": "TransactionAsset", "required": true },
            "network": { "ref": "TransactionNetwork", "required": true },
            "key": { "dataType": "string", "required": true },
            "address": { "dataType": "string", "required": true },
            "quantity": { "dataType": "double", "required": true },
            "rate": { "dataType": "double", "required": true },
            "amount": { "dataType": "double", "required": true },
            "proof": { "dataType": "string", "required": true },
            "dateApproved": { "dataType": "datetime" },
            "status": { "ref": "TransactionStatusType", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IMakeTransactionInput": {
        "dataType": "refObject",
        "properties": {
            "assetId": { "dataType": "string", "required": true },
            "networkId": { "dataType": "string", "required": true },
            "address": { "dataType": "string", "required": true },
            "quantity": { "dataType": "double", "required": true },
            "proof": { "dataType": "string", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IAddBankInput": {
        "dataType": "refObject",
        "properties": {
            "bankName": { "dataType": "string", "required": true },
            "accountName": { "dataType": "string", "required": true },
            "accountNumber": { "dataType": "string", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IUpdateBankInput": {
        "dataType": "refObject",
        "properties": {
            "bankName": { "dataType": "string" },
            "accountNumber": { "dataType": "string" },
            "accountName": { "dataType": "string" },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CandleData": {
        "dataType": "refObject",
        "properties": {
            "timestamp": { "dataType": "double", "required": true },
            "open": { "dataType": "double", "required": true },
            "high": { "dataType": "double", "required": true },
            "low": { "dataType": "double", "required": true },
            "close": { "dataType": "double", "required": true },
            "volume": { "dataType": "double", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "mongoose.FlattenMaps__name-string--url-string--icon-string__": {
        "dataType": "refAlias",
        "type": { "dataType": "nestedObjectLiteral", "nestedProperties": {}, "validators": {} },
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "mongoose.Types.ObjectId": {
        "dataType": "refAlias",
        "type": { "dataType": "string", "validators": {} },
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IAddSocialPlatformInput": {
        "dataType": "refObject",
        "properties": {
            "name": { "dataType": "string", "required": true },
            "url": { "dataType": "string", "required": true },
            "icon": { "dataType": "string", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IUpdateSocialPlatformInput": {
        "dataType": "refObject",
        "properties": {
            "name": { "dataType": "string" },
            "url": { "dataType": "string" },
            "icon": { "dataType": "string" },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "OTPType": {
        "dataType": "refEnum",
        "enums": ["register", "reset"],
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ISendOtpInput": {
        "dataType": "refObject",
        "properties": {
            "email": { "dataType": "string", "required": true },
            "type": { "ref": "OTPType" },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IVerifyEmailInput": {
        "dataType": "refObject",
        "properties": {
            "email": { "dataType": "string", "required": true },
            "otp": { "dataType": "string", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ICompleteBasicProfileInput": {
        "dataType": "refObject",
        "properties": {
            "email": { "dataType": "string", "required": true },
            "firstName": { "dataType": "string", "required": true },
            "lastName": { "dataType": "string", "required": true },
            "userName": { "dataType": "string" },
            "referrer": { "dataType": "string" },
            "password": { "dataType": "string", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ICompleteAdditionalProfileInput": {
        "dataType": "refObject",
        "properties": {
            "email": { "dataType": "string", "required": true },
            "country": { "dataType": "nestedObjectLiteral", "nestedProperties": { "currency": { "dataType": "string", "required": true }, "callingCode": { "dataType": "string", "required": true }, "code": { "dataType": "string", "required": true }, "name": { "dataType": "string", "required": true } }, "required": true },
            "phoneNumber": { "dataType": "string", "required": true },
            "dateOfBirth": { "dataType": "string", "required": true },
            "gender": { "ref": "GenderType", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_Token_": {
        "dataType": "refAlias",
        "type": { "dataType": "nestedObjectLiteral", "nestedProperties": {}, "validators": {} },
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ISetupPinInput": {
        "dataType": "refObject",
        "properties": {
            "email": { "dataType": "string", "required": true },
            "pin": { "dataType": "string", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ILoginInput": {
        "dataType": "refObject",
        "properties": {
            "email": { "dataType": "string", "required": true },
            "password": { "dataType": "string", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IConfirmPinInput": {
        "dataType": "refObject",
        "properties": {
            "pin": { "dataType": "string", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IDeleteAccountInput": {
        "dataType": "refObject",
        "properties": {
            "password": { "dataType": "string", "required": true },
            "reason": { "dataType": "string" },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IRefreshTokenInput": {
        "dataType": "refObject",
        "properties": {
            "refreshToken": { "dataType": "string", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IResetPasswordInput": {
        "dataType": "refObject",
        "properties": {
            "email": { "dataType": "string", "required": true },
            "otp": { "dataType": "string", "required": true },
            "password": { "dataType": "string", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "mongoose.FlattenMaps__name-string--symbol-string--icon-string--rate-number--vipRate-number--networks_58__name-string--address-string--icon_63_-string_-Array__": {
        "dataType": "refAlias",
        "type": { "dataType": "nestedObjectLiteral", "nestedProperties": {}, "validators": {} },
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "mongoose.FlattenMaps_Asset-and-__id-mongoose.Types.ObjectId_-and-___v-number__": {
        "dataType": "refAlias",
        "type": { "dataType": "nestedObjectLiteral", "nestedProperties": {}, "validators": {} },
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IAddAssetInput": {
        "dataType": "refObject",
        "properties": {
            "name": { "dataType": "string", "required": true },
            "icon": { "dataType": "string", "required": true },
            "symbol": { "dataType": "string", "required": true },
            "rate": { "dataType": "double", "required": true },
            "vipRate": { "dataType": "double" },
            "networks": { "dataType": "array", "array": { "dataType": "nestedObjectLiteral", "nestedProperties": { "icon": { "dataType": "string" }, "address": { "dataType": "string", "required": true }, "name": { "dataType": "string", "required": true } } }, "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IUpdateAssetInput": {
        "dataType": "refObject",
        "properties": {
            "name": { "dataType": "string" },
            "icon": { "dataType": "string" },
            "symbol": { "dataType": "string" },
            "rate": { "dataType": "double" },
            "vipRate": { "dataType": "double" },
            "networks": { "dataType": "array", "array": { "dataType": "nestedObjectLiteral", "nestedProperties": { "icon": { "dataType": "string" }, "address": { "dataType": "string", "required": true }, "name": { "dataType": "string", "required": true } } } },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IAddAdminInput": {
        "dataType": "refObject",
        "properties": {
            "email": { "dataType": "string", "required": true },
            "name": { "dataType": "string", "required": true },
            "role": { "dataType": "union", "subSchemas": [{ "dataType": "enum", "enums": ["admin"] }, { "dataType": "enum", "enums": ["editor"] }, { "dataType": "enum", "enums": ["moderator"] }], "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RoleType": {
        "dataType": "refAlias",
        "type": { "dataType": "enum", "enums": ["superadmin", "admin", "editor", "moderator"], "validators": {} },
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Admin": {
        "dataType": "refObject",
        "properties": {
            "email": { "dataType": "string", "required": true },
            "password": { "dataType": "string" },
            "name": { "dataType": "string", "required": true },
            "role": { "ref": "RoleType", "required": true },
            "invitationToken": { "dataType": "string" },
            "invitationExpires": { "dataType": "datetime" },
            "isActive": { "dataType": "boolean", "required": true },
            "refreshToken": { "dataType": "string" },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IUpdateAdminInput": {
        "dataType": "refObject",
        "properties": {
            "name": { "dataType": "string" },
            "role": { "dataType": "union", "subSchemas": [{ "dataType": "enum", "enums": ["admin"] }, { "dataType": "enum", "enums": ["editor"] }, { "dataType": "enum", "enums": ["moderator"] }] },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Notification": {
        "dataType": "refObject",
        "properties": {
            "title": { "dataType": "string", "required": true },
            "message": { "dataType": "string", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IAddNotificationInput": {
        "dataType": "refObject",
        "properties": {
            "title": { "dataType": "string", "required": true },
            "message": { "dataType": "string", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "mongoose.FlattenMaps__users_58__all-number--active-number--inactive-number--month_58__key-number--active-number--inactive-number--all-number_--year_58__key-number--active-number--inactive-number--all-number__--transactions_58__all-number--pending-number--successful-number--failed-number--month_58__key-number--all-number--pending-number--successful-number--failed-number_--year_58__key-number--all-number--pending-number--successful-number--failed-number__--rewards_58__all-number--pending-number--successful-number--month_58__key-number--all-number--pending-number--successful-number_--year_58__key-number--all-number--pending-number--successful-number__--revenue_58__all-number--month_58__key-number--revenue-number_--year_58__key-number--revenue-number____": {
        "dataType": "refAlias",
        "type": { "dataType": "nestedObjectLiteral", "nestedProperties": {}, "validators": {} },
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IAcceptInviteInput": {
        "dataType": "refObject",
        "properties": {
            "token": { "dataType": "string", "required": true },
            "password": { "dataType": "string" },
            "action": { "dataType": "union", "subSchemas": [{ "dataType": "enum", "enums": ["accept"] }, { "dataType": "enum", "enums": ["reject"] }] },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new runtime_1.ExpressTemplateService(models, { "noImplicitAdditionalProperties": "throw-on-extras", "bodyCoercion": true });
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
function RegisterRoutes(app, opts) {
    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################
    const upload = opts?.multer || multer({ "limits": { "fileSize": 8388608 } });
    const argsUserController_getUser = {
        req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
    };
    app.get('/user', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController)), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController.prototype.getUser)), async function UserController_getUser(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsUserController_getUser, request, response });
            const controller = new UserController_1.UserController();
            await templateService.apiHandler({
                methodName: 'getUser',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsUserController_updateUser = {
        data: { "in": "body", "name": "data", "required": true, "ref": "IUpdateProfileInput" },
        req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
    };
    app.patch('/user', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController)), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController.prototype.updateUser)), async function UserController_updateUser(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsUserController_updateUser, request, response });
            const controller = new UserController_1.UserController();
            await templateService.apiHandler({
                methodName: 'updateUser',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsUserController_updatePassword = {
        data: { "in": "body", "name": "data", "required": true, "ref": "IUpdatePasswordInput" },
        req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
    };
    app.patch('/user/password', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController)), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController.prototype.updatePassword)), async function UserController_updatePassword(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsUserController_updatePassword, request, response });
            const controller = new UserController_1.UserController();
            await templateService.apiHandler({
                methodName: 'updatePassword',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsUserController_updatePin = {
        data: { "in": "body", "name": "data", "required": true, "ref": "IUpdatePinInput" },
        req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
    };
    app.patch('/user/pin', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController)), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController.prototype.updatePin)), async function UserController_updatePin(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsUserController_updatePin, request, response });
            const controller = new UserController_1.UserController();
            await templateService.apiHandler({
                methodName: 'updatePin',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsUserController_enableNotifications = {
        data: { "in": "body", "name": "data", "required": true, "ref": "IEnableNotificationsInput" },
        req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
    };
    app.post('/user/enable-notifications', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController)), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController.prototype.enableNotifications)), async function UserController_enableNotifications(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsUserController_enableNotifications, request, response });
            const controller = new UserController_1.UserController();
            await templateService.apiHandler({
                methodName: 'enableNotifications',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsUserController_getAllBanks = {
        country: { "in": "path", "name": "country", "required": true, "dataType": "string" },
    };
    app.get('/user/all-banks/:country', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController)), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController.prototype.getAllBanks)), async function UserController_getAllBanks(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsUserController_getAllBanks, request, response });
            const controller = new UserController_1.UserController();
            await templateService.apiHandler({
                methodName: 'getAllBanks',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsUserController_getRewards = {
        req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
    };
    app.get('/user/rewards', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController)), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController.prototype.getRewards)), async function UserController_getRewards(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsUserController_getRewards, request, response });
            const controller = new UserController_1.UserController();
            await templateService.apiHandler({
                methodName: 'getRewards',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsUserController_getTransactions = {
        req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
    };
    app.get('/user/transactions', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController)), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController.prototype.getTransactions)), async function UserController_getTransactions(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsUserController_getTransactions, request, response });
            const controller = new UserController_1.UserController();
            await templateService.apiHandler({
                methodName: 'getTransactions',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsUserController_getTransaction = {
        id: { "in": "path", "name": "id", "required": true, "dataType": "string" },
    };
    app.get('/user/transactions/:id', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController)), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController.prototype.getTransaction)), async function UserController_getTransaction(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsUserController_getTransaction, request, response });
            const controller = new UserController_1.UserController();
            await templateService.apiHandler({
                methodName: 'getTransaction',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsUserController_makeTransaction = {
        data: { "in": "body", "name": "data", "required": true, "ref": "IMakeTransactionInput" },
        req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
    };
    app.post('/user/transaction', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController)), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController.prototype.makeTransaction)), async function UserController_makeTransaction(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsUserController_makeTransaction, request, response });
            const controller = new UserController_1.UserController();
            await templateService.apiHandler({
                methodName: 'makeTransaction',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsUserController_payReward = {
        req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
    };
    app.get('/user/reward', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController)), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController.prototype.payReward)), async function UserController_payReward(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsUserController_payReward, request, response });
            const controller = new UserController_1.UserController();
            await templateService.apiHandler({
                methodName: 'payReward',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsUserController_getBanks = {
        req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
    };
    app.get('/user/banks', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController)), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController.prototype.getBanks)), async function UserController_getBanks(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsUserController_getBanks, request, response });
            const controller = new UserController_1.UserController();
            await templateService.apiHandler({
                methodName: 'getBanks',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsUserController_getBank = {
        id: { "in": "path", "name": "id", "required": true, "dataType": "string" },
        req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
    };
    app.get('/user/bank/:id', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController)), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController.prototype.getBank)), async function UserController_getBank(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsUserController_getBank, request, response });
            const controller = new UserController_1.UserController();
            await templateService.apiHandler({
                methodName: 'getBank',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsUserController_addBank = {
        data: { "in": "body", "name": "data", "required": true, "ref": "IAddBankInput" },
        req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
    };
    app.post('/user/bank', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController)), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController.prototype.addBank)), async function UserController_addBank(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsUserController_addBank, request, response });
            const controller = new UserController_1.UserController();
            await templateService.apiHandler({
                methodName: 'addBank',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsUserController_updateBank = {
        id: { "in": "path", "name": "id", "required": true, "dataType": "string" },
        req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
        bank: { "in": "body", "name": "bank", "required": true, "ref": "IUpdateBankInput" },
    };
    app.patch('/user/bank/:id', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController)), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController.prototype.updateBank)), async function UserController_updateBank(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsUserController_updateBank, request, response });
            const controller = new UserController_1.UserController();
            await templateService.apiHandler({
                methodName: 'updateBank',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsUserController_deleteBank = {
        id: { "in": "path", "name": "id", "required": true, "dataType": "string" },
        req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
    };
    app.delete('/user/bank/:id', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController)), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController.prototype.deleteBank)), async function UserController_deleteBank(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsUserController_deleteBank, request, response });
            const controller = new UserController_1.UserController();
            await templateService.apiHandler({
                methodName: 'deleteBank',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsUserController_setDefaultBank = {
        id: { "in": "path", "name": "id", "required": true, "dataType": "string" },
        req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
    };
    app.patch('/user/bank/default/:id', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController)), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController.prototype.setDefaultBank)), async function UserController_setDefaultBank(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsUserController_setDefaultBank, request, response });
            const controller = new UserController_1.UserController();
            await templateService.apiHandler({
                methodName: 'setDefaultBank',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsUserController_getCryptoHistoricalData = {
        symbol: { "in": "query", "name": "symbol", "required": true, "dataType": "string" },
        timeframe: { "in": "query", "name": "timeframe", "required": true, "dataType": "string" },
        limit: { "in": "query", "name": "limit", "required": true, "dataType": "string" },
    };
    app.get('/user/crypto/historical', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController)), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController.prototype.getCryptoHistoricalData)), async function UserController_getCryptoHistoricalData(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsUserController_getCryptoHistoricalData, request, response });
            const controller = new UserController_1.UserController();
            await templateService.apiHandler({
                methodName: 'getCryptoHistoricalData',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsUploadController_uploadImage = {
        description: { "in": "formData", "name": "description", "dataType": "string" },
        file: { "in": "formData", "name": "file", "dataType": "file" },
    };
    app.post('/upload', upload.fields([
        {
            name: "file",
            maxCount: 1
        }
    ]), ...((0, runtime_1.fetchMiddlewares)(UploadController_1.UploadController)), ...((0, runtime_1.fetchMiddlewares)(UploadController_1.UploadController.prototype.uploadImage)), async function UploadController_uploadImage(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsUploadController_uploadImage, request, response });
            const controller = new UploadController_1.UploadController();
            await templateService.apiHandler({
                methodName: 'uploadImage',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsSocialPlatformController_getSocialPlatforms = {};
    app.get('/social-platforms', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(SocialPlatform_1.SocialPlatformController)), ...((0, runtime_1.fetchMiddlewares)(SocialPlatform_1.SocialPlatformController.prototype.getSocialPlatforms)), async function SocialPlatformController_getSocialPlatforms(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsSocialPlatformController_getSocialPlatforms, request, response });
            const controller = new SocialPlatform_1.SocialPlatformController();
            await templateService.apiHandler({
                methodName: 'getSocialPlatforms',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsSocialPlatformController_getSocialPlatform = {
        id: { "in": "path", "name": "id", "required": true, "dataType": "string" },
    };
    app.get('/social-platforms/:id', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(SocialPlatform_1.SocialPlatformController)), ...((0, runtime_1.fetchMiddlewares)(SocialPlatform_1.SocialPlatformController.prototype.getSocialPlatform)), async function SocialPlatformController_getSocialPlatform(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsSocialPlatformController_getSocialPlatform, request, response });
            const controller = new SocialPlatform_1.SocialPlatformController();
            await templateService.apiHandler({
                methodName: 'getSocialPlatform',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsSocialPlatformController_addBank = {
        data: { "in": "body", "name": "data", "required": true, "ref": "IAddSocialPlatformInput" },
    };
    app.post('/social-platforms', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(SocialPlatform_1.SocialPlatformController)), ...((0, runtime_1.fetchMiddlewares)(SocialPlatform_1.SocialPlatformController.prototype.addBank)), async function SocialPlatformController_addBank(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsSocialPlatformController_addBank, request, response });
            const controller = new SocialPlatform_1.SocialPlatformController();
            await templateService.apiHandler({
                methodName: 'addBank',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsSocialPlatformController_updatePassword = {
        id: { "in": "path", "name": "id", "required": true, "dataType": "string" },
        data: { "in": "body", "name": "data", "required": true, "ref": "IUpdateSocialPlatformInput" },
        req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
    };
    app.patch('/social-platforms/:id', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(SocialPlatform_1.SocialPlatformController)), ...((0, runtime_1.fetchMiddlewares)(SocialPlatform_1.SocialPlatformController.prototype.updatePassword)), async function SocialPlatformController_updatePassword(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsSocialPlatformController_updatePassword, request, response });
            const controller = new SocialPlatform_1.SocialPlatformController();
            await templateService.apiHandler({
                methodName: 'updatePassword',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsSocialPlatformController_deleteSocialPlatform = {
        id: { "in": "path", "name": "id", "required": true, "dataType": "string" },
    };
    app.delete('/social-platforms/:id', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(SocialPlatform_1.SocialPlatformController)), ...((0, runtime_1.fetchMiddlewares)(SocialPlatform_1.SocialPlatformController.prototype.deleteSocialPlatform)), async function SocialPlatformController_deleteSocialPlatform(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsSocialPlatformController_deleteSocialPlatform, request, response });
            const controller = new SocialPlatform_1.SocialPlatformController();
            await templateService.apiHandler({
                methodName: 'deleteSocialPlatform',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsHealthController_getHealthStatus = {};
    app.get('/health', ...((0, runtime_1.fetchMiddlewares)(HealthController_1.HealthController)), ...((0, runtime_1.fetchMiddlewares)(HealthController_1.HealthController.prototype.getHealthStatus)), async function HealthController_getHealthStatus(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsHealthController_getHealthStatus, request, response });
            const controller = new HealthController_1.HealthController();
            await templateService.apiHandler({
                methodName: 'getHealthStatus',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAuthController_sendOtp = {
        data: { "in": "body", "name": "data", "required": true, "ref": "ISendOtpInput" },
    };
    app.post('/auth/send-otp', ...((0, runtime_1.fetchMiddlewares)(AuthController_1.AuthController)), ...((0, runtime_1.fetchMiddlewares)(AuthController_1.AuthController.prototype.sendOtp)), async function AuthController_sendOtp(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_sendOtp, request, response });
            const controller = new AuthController_1.AuthController();
            await templateService.apiHandler({
                methodName: 'sendOtp',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAuthController_verifyEmail = {
        data: { "in": "body", "name": "data", "required": true, "ref": "IVerifyEmailInput" },
    };
    app.post('/auth/verify-email', ...((0, runtime_1.fetchMiddlewares)(AuthController_1.AuthController)), ...((0, runtime_1.fetchMiddlewares)(AuthController_1.AuthController.prototype.verifyEmail)), async function AuthController_verifyEmail(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_verifyEmail, request, response });
            const controller = new AuthController_1.AuthController();
            await templateService.apiHandler({
                methodName: 'verifyEmail',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAuthController_completeBasicProfile = {
        data: { "in": "body", "name": "data", "required": true, "ref": "ICompleteBasicProfileInput" },
    };
    app.post('/auth/complete-basic-profile', ...((0, runtime_1.fetchMiddlewares)(AuthController_1.AuthController)), ...((0, runtime_1.fetchMiddlewares)(AuthController_1.AuthController.prototype.completeBasicProfile)), async function AuthController_completeBasicProfile(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_completeBasicProfile, request, response });
            const controller = new AuthController_1.AuthController();
            await templateService.apiHandler({
                methodName: 'completeBasicProfile',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAuthController_completeAdditionalProfile = {
        data: { "in": "body", "name": "data", "required": true, "ref": "ICompleteAdditionalProfileInput" },
    };
    app.post('/auth/complete-additional-profile', ...((0, runtime_1.fetchMiddlewares)(AuthController_1.AuthController)), ...((0, runtime_1.fetchMiddlewares)(AuthController_1.AuthController.prototype.completeAdditionalProfile)), async function AuthController_completeAdditionalProfile(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_completeAdditionalProfile, request, response });
            const controller = new AuthController_1.AuthController();
            await templateService.apiHandler({
                methodName: 'completeAdditionalProfile',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAuthController_setupPin = {
        data: { "in": "body", "name": "data", "required": true, "ref": "ISetupPinInput" },
    };
    app.post('/auth/setup-pin', ...((0, runtime_1.fetchMiddlewares)(AuthController_1.AuthController)), ...((0, runtime_1.fetchMiddlewares)(AuthController_1.AuthController.prototype.setupPin)), async function AuthController_setupPin(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_setupPin, request, response });
            const controller = new AuthController_1.AuthController();
            await templateService.apiHandler({
                methodName: 'setupPin',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAuthController_login = {
        data: { "in": "body", "name": "data", "required": true, "ref": "ILoginInput" },
    };
    app.post('/auth/login', ...((0, runtime_1.fetchMiddlewares)(AuthController_1.AuthController)), ...((0, runtime_1.fetchMiddlewares)(AuthController_1.AuthController.prototype.login)), async function AuthController_login(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_login, request, response });
            const controller = new AuthController_1.AuthController();
            await templateService.apiHandler({
                methodName: 'login',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAuthController_confirmPin = {
        data: { "in": "body", "name": "data", "required": true, "ref": "IConfirmPinInput" },
        req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
    };
    app.post('/auth/confirm-pin', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(AuthController_1.AuthController)), ...((0, runtime_1.fetchMiddlewares)(AuthController_1.AuthController.prototype.confirmPin)), async function AuthController_confirmPin(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_confirmPin, request, response });
            const controller = new AuthController_1.AuthController();
            await templateService.apiHandler({
                methodName: 'confirmPin',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAuthController_logout = {
        req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
    };
    app.get('/auth/logout', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(AuthController_1.AuthController)), ...((0, runtime_1.fetchMiddlewares)(AuthController_1.AuthController.prototype.logout)), async function AuthController_logout(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_logout, request, response });
            const controller = new AuthController_1.AuthController();
            await templateService.apiHandler({
                methodName: 'logout',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAuthController_deleteAccount = {
        req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
        data: { "in": "body", "name": "data", "required": true, "ref": "IDeleteAccountInput" },
    };
    app.delete('/auth/delete-account', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(AuthController_1.AuthController)), ...((0, runtime_1.fetchMiddlewares)(AuthController_1.AuthController.prototype.deleteAccount)), async function AuthController_deleteAccount(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_deleteAccount, request, response });
            const controller = new AuthController_1.AuthController();
            await templateService.apiHandler({
                methodName: 'deleteAccount',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAuthController_refreshToken = {
        data: { "in": "body", "name": "data", "required": true, "ref": "IRefreshTokenInput" },
    };
    app.post('/auth/refresh-token', ...((0, runtime_1.fetchMiddlewares)(AuthController_1.AuthController)), ...((0, runtime_1.fetchMiddlewares)(AuthController_1.AuthController.prototype.refreshToken)), async function AuthController_refreshToken(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_refreshToken, request, response });
            const controller = new AuthController_1.AuthController();
            await templateService.apiHandler({
                methodName: 'refreshToken',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAuthController_resetPassword = {
        data: { "in": "body", "name": "data", "required": true, "ref": "IResetPasswordInput" },
    };
    app.patch('/auth/reset-password', ...((0, runtime_1.fetchMiddlewares)(AuthController_1.AuthController)), ...((0, runtime_1.fetchMiddlewares)(AuthController_1.AuthController.prototype.resetPassword)), async function AuthController_resetPassword(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_resetPassword, request, response });
            const controller = new AuthController_1.AuthController();
            await templateService.apiHandler({
                methodName: 'resetPassword',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAssetController_getAllAssets = {};
    app.get('/assets', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(AssetController_1.AssetController)), ...((0, runtime_1.fetchMiddlewares)(AssetController_1.AssetController.prototype.getAllAssets)), async function AssetController_getAllAssets(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAssetController_getAllAssets, request, response });
            const controller = new AssetController_1.AssetController();
            await templateService.apiHandler({
                methodName: 'getAllAssets',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAssetController_getAsset = {
        id: { "in": "path", "name": "id", "required": true, "dataType": "string" },
    };
    app.get('/assets/:id', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(AssetController_1.AssetController)), ...((0, runtime_1.fetchMiddlewares)(AssetController_1.AssetController.prototype.getAsset)), async function AssetController_getAsset(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAssetController_getAsset, request, response });
            const controller = new AssetController_1.AssetController();
            await templateService.apiHandler({
                methodName: 'getAsset',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAssetController_createAsset = {
        data: { "in": "body", "name": "data", "required": true, "ref": "IAddAssetInput" },
    };
    app.post('/assets', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(AssetController_1.AssetController)), ...((0, runtime_1.fetchMiddlewares)(AssetController_1.AssetController.prototype.createAsset)), async function AssetController_createAsset(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAssetController_createAsset, request, response });
            const controller = new AssetController_1.AssetController();
            await templateService.apiHandler({
                methodName: 'createAsset',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAssetController_updateAsset = {
        id: { "in": "path", "name": "id", "required": true, "dataType": "string" },
        data: { "in": "body", "name": "data", "required": true, "ref": "IUpdateAssetInput" },
    };
    app.patch('/assets/:id', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(AssetController_1.AssetController)), ...((0, runtime_1.fetchMiddlewares)(AssetController_1.AssetController.prototype.updateAsset)), async function AssetController_updateAsset(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAssetController_updateAsset, request, response });
            const controller = new AssetController_1.AssetController();
            await templateService.apiHandler({
                methodName: 'updateAsset',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAssetController_deleteAsset = {
        id: { "in": "path", "name": "id", "required": true, "dataType": "string" },
    };
    app.delete('/assets/:id', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(AssetController_1.AssetController)), ...((0, runtime_1.fetchMiddlewares)(AssetController_1.AssetController.prototype.deleteAsset)), async function AssetController_deleteAsset(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAssetController_deleteAsset, request, response });
            const controller = new AssetController_1.AssetController();
            await templateService.apiHandler({
                methodName: 'deleteAsset',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAdminController_getAdmin = {
        req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
    };
    app.get('/admin', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController)), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController.prototype.getAdmin)), async function AdminController_getAdmin(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAdminController_getAdmin, request, response });
            const controller = new AdminController_1.AdminController();
            await templateService.apiHandler({
                methodName: 'getAdmin',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAdminController_addAdmin = {
        data: { "in": "body", "name": "data", "required": true, "ref": "IAddAdminInput" },
        req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
    };
    app.post('/admin', authenticateMiddleware([{ "BearerAuth": ["superadmin"] }]), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController)), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController.prototype.addAdmin)), async function AdminController_addAdmin(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAdminController_addAdmin, request, response });
            const controller = new AdminController_1.AdminController();
            await templateService.apiHandler({
                methodName: 'addAdmin',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAdminController_getAdmins = {};
    app.get('/admin/all', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController)), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController.prototype.getAdmins)), async function AdminController_getAdmins(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAdminController_getAdmins, request, response });
            const controller = new AdminController_1.AdminController();
            await templateService.apiHandler({
                methodName: 'getAdmins',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAdminController_updateAdmin = {
        data: { "in": "body", "name": "data", "required": true, "ref": "IUpdateAdminInput" },
        req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
    };
    app.patch('/admin', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController)), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController.prototype.updateAdmin)), async function AdminController_updateAdmin(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAdminController_updateAdmin, request, response });
            const controller = new AdminController_1.AdminController();
            await templateService.apiHandler({
                methodName: 'updateAdmin',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAdminController_updateAdminData = {
        id: { "in": "path", "name": "id", "required": true, "dataType": "string" },
        data: { "in": "body", "name": "data", "required": true, "ref": "IUpdateAdminInput" },
        req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
    };
    app.patch('/admin/:id', authenticateMiddleware([{ "BearerAuth": ["superadmin"] }]), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController)), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController.prototype.updateAdminData)), async function AdminController_updateAdminData(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAdminController_updateAdminData, request, response });
            const controller = new AdminController_1.AdminController();
            await templateService.apiHandler({
                methodName: 'updateAdminData',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAdminController_removeAdmin = {
        id: { "in": "path", "name": "id", "required": true, "dataType": "string" },
        req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
    };
    app.delete('/admin/:id', authenticateMiddleware([{ "BearerAuth": ["superadmin"] }]), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController)), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController.prototype.removeAdmin)), async function AdminController_removeAdmin(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAdminController_removeAdmin, request, response });
            const controller = new AdminController_1.AdminController();
            await templateService.apiHandler({
                methodName: 'removeAdmin',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAdminController_updatePassword = {
        data: { "in": "body", "name": "data", "required": true, "ref": "IUpdatePasswordInput" },
        req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
    };
    app.patch('/admin/password', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController)), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController.prototype.updatePassword)), async function AdminController_updatePassword(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAdminController_updatePassword, request, response });
            const controller = new AdminController_1.AdminController();
            await templateService.apiHandler({
                methodName: 'updatePassword',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAdminController_getUsers = {
        page: { "default": 1, "in": "query", "name": "page", "dataType": "double" },
        limit: { "default": 10, "in": "query", "name": "limit", "dataType": "double" },
        status: { "default": "all", "in": "query", "name": "status", "dataType": "union", "subSchemas": [{ "dataType": "enum", "enums": ["active"] }, { "dataType": "enum", "enums": ["inactive"] }, { "dataType": "enum", "enums": ["all"] }] },
        sort: { "in": "query", "name": "sort", "dataType": "union", "subSchemas": [{ "dataType": "enum", "enums": ["asc"] }, { "dataType": "enum", "enums": ["desc"] }] },
        search: { "in": "query", "name": "search", "dataType": "string" },
    };
    app.get('/admin/users', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController)), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController.prototype.getUsers)), async function AdminController_getUsers(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAdminController_getUsers, request, response });
            const controller = new AdminController_1.AdminController();
            await templateService.apiHandler({
                methodName: 'getUsers',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAdminController_getUser = {
        id: { "in": "path", "name": "id", "required": true, "dataType": "string" },
    };
    app.get('/admin/users/:id', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController)), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController.prototype.getUser)), async function AdminController_getUser(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAdminController_getUser, request, response });
            const controller = new AdminController_1.AdminController();
            await templateService.apiHandler({
                methodName: 'getUser',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAdminController_deleteUser = {
        id: { "in": "path", "name": "id", "required": true, "dataType": "string" },
    };
    app.delete('/admin/users/:id', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController)), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController.prototype.deleteUser)), async function AdminController_deleteUser(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAdminController_deleteUser, request, response });
            const controller = new AdminController_1.AdminController();
            await templateService.apiHandler({
                methodName: 'deleteUser',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAdminController_getTransactions = {
        page: { "default": 1, "in": "query", "name": "page", "dataType": "double" },
        limit: { "default": 10, "in": "query", "name": "limit", "dataType": "double" },
        status: { "default": "all", "in": "query", "name": "status", "dataType": "union", "subSchemas": [{ "dataType": "enum", "enums": ["pending"] }, { "dataType": "enum", "enums": ["successful"] }, { "dataType": "enum", "enums": ["failed"] }, { "dataType": "enum", "enums": ["all"] }] },
        sort: { "in": "query", "name": "sort", "dataType": "union", "subSchemas": [{ "dataType": "enum", "enums": ["asc"] }, { "dataType": "enum", "enums": ["desc"] }] },
        search: { "in": "query", "name": "search", "dataType": "string" },
    };
    app.get('/admin/transactions', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController)), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController.prototype.getTransactions)), async function AdminController_getTransactions(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAdminController_getTransactions, request, response });
            const controller = new AdminController_1.AdminController();
            await templateService.apiHandler({
                methodName: 'getTransactions',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAdminController_getTransaction = {
        id: { "in": "path", "name": "id", "required": true, "dataType": "string" },
    };
    app.get('/admin/transactions/:id', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController)), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController.prototype.getTransaction)), async function AdminController_getTransaction(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAdminController_getTransaction, request, response });
            const controller = new AdminController_1.AdminController();
            await templateService.apiHandler({
                methodName: 'getTransaction',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAdminController_getUserTransactions = {
        id: { "in": "path", "name": "id", "required": true, "dataType": "string" },
    };
    app.get('/admin/transactions/user/:id', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController)), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController.prototype.getUserTransactions)), async function AdminController_getUserTransactions(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAdminController_getUserTransactions, request, response });
            const controller = new AdminController_1.AdminController();
            await templateService.apiHandler({
                methodName: 'getUserTransactions',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAdminController_validateTransaction = {
        id: { "in": "path", "name": "id", "required": true, "dataType": "string" },
        status: { "in": "path", "name": "status", "required": true, "ref": "TransactionStatusType" },
    };
    app.patch('/admin/transactions/:id/:status', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController)), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController.prototype.validateTransaction)), async function AdminController_validateTransaction(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAdminController_validateTransaction, request, response });
            const controller = new AdminController_1.AdminController();
            await templateService.apiHandler({
                methodName: 'validateTransaction',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAdminController_getRewards = {
        page: { "default": 1, "in": "query", "name": "page", "dataType": "double" },
        limit: { "default": 10, "in": "query", "name": "limit", "dataType": "double" },
        status: { "default": "all", "in": "query", "name": "status", "dataType": "union", "subSchemas": [{ "dataType": "enum", "enums": ["pending"] }, { "dataType": "enum", "enums": ["successful"] }, { "dataType": "enum", "enums": ["all"] }] },
        sort: { "in": "query", "name": "sort", "dataType": "union", "subSchemas": [{ "dataType": "enum", "enums": ["asc"] }, { "dataType": "enum", "enums": ["desc"] }] },
        search: { "in": "query", "name": "search", "dataType": "string" },
    };
    app.get('/admin/rewards', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController)), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController.prototype.getRewards)), async function AdminController_getRewards(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAdminController_getRewards, request, response });
            const controller = new AdminController_1.AdminController();
            await templateService.apiHandler({
                methodName: 'getRewards',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAdminController_getReward = {
        id: { "in": "path", "name": "id", "required": true, "dataType": "string" },
    };
    app.get('/admin/rewards/:id', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController)), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController.prototype.getReward)), async function AdminController_getReward(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAdminController_getReward, request, response });
            const controller = new AdminController_1.AdminController();
            await templateService.apiHandler({
                methodName: 'getReward',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAdminController_getUserRewards = {
        id: { "in": "path", "name": "id", "required": true, "dataType": "string" },
    };
    app.get('/admin/rewards/user/:id', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController)), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController.prototype.getUserRewards)), async function AdminController_getUserRewards(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAdminController_getUserRewards, request, response });
            const controller = new AdminController_1.AdminController();
            await templateService.apiHandler({
                methodName: 'getUserRewards',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAdminController_validateReward = {
        id: { "in": "path", "name": "id", "required": true, "dataType": "string" },
        status: { "in": "path", "name": "status", "required": true, "ref": "RewardStatusType" },
    };
    app.patch('/admin/rewards/:id/:status', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController)), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController.prototype.validateReward)), async function AdminController_validateReward(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAdminController_validateReward, request, response });
            const controller = new AdminController_1.AdminController();
            await templateService.apiHandler({
                methodName: 'validateReward',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAdminController_getNotifications = {
        page: { "default": 1, "in": "query", "name": "page", "dataType": "double" },
        limit: { "default": 10, "in": "query", "name": "limit", "dataType": "double" },
        sort: { "in": "query", "name": "sort", "dataType": "union", "subSchemas": [{ "dataType": "enum", "enums": ["asc"] }, { "dataType": "enum", "enums": ["desc"] }] },
        search: { "in": "query", "name": "search", "dataType": "string" },
    };
    app.get('/admin/notifications', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController)), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController.prototype.getNotifications)), async function AdminController_getNotifications(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAdminController_getNotifications, request, response });
            const controller = new AdminController_1.AdminController();
            await templateService.apiHandler({
                methodName: 'getNotifications',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAdminController_addNotification = {
        data: { "in": "body", "name": "data", "required": true, "ref": "IAddNotificationInput" },
    };
    app.post('/admin/notifications', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController)), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController.prototype.addNotification)), async function AdminController_addNotification(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAdminController_addNotification, request, response });
            const controller = new AdminController_1.AdminController();
            await templateService.apiHandler({
                methodName: 'addNotification',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAdminController_getCounts = {};
    app.get('/admin/counts', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController)), ...((0, runtime_1.fetchMiddlewares)(AdminController_1.AdminController.prototype.getCounts)), async function AdminController_getCounts(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAdminController_getCounts, request, response });
            const controller = new AdminController_1.AdminController();
            await templateService.apiHandler({
                methodName: 'getCounts',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAdminAuthController_login = {
        data: { "in": "body", "name": "data", "required": true, "ref": "ILoginInput" },
    };
    app.post('/admin-auth/login', ...((0, runtime_1.fetchMiddlewares)(AdminAuthController_1.AdminAuthController)), ...((0, runtime_1.fetchMiddlewares)(AdminAuthController_1.AdminAuthController.prototype.login)), async function AdminAuthController_login(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAdminAuthController_login, request, response });
            const controller = new AdminAuthController_1.AdminAuthController();
            await templateService.apiHandler({
                methodName: 'login',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAdminAuthController_logout = {
        req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
    };
    app.get('/admin-auth/logout', authenticateMiddleware([{ "BearerAuth": [] }]), ...((0, runtime_1.fetchMiddlewares)(AdminAuthController_1.AdminAuthController)), ...((0, runtime_1.fetchMiddlewares)(AdminAuthController_1.AdminAuthController.prototype.logout)), async function AdminAuthController_logout(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAdminAuthController_logout, request, response });
            const controller = new AdminAuthController_1.AdminAuthController();
            await templateService.apiHandler({
                methodName: 'logout',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAdminAuthController_refreshToken = {
        data: { "in": "body", "name": "data", "required": true, "ref": "IRefreshTokenInput" },
    };
    app.post('/admin-auth/refresh-token', ...((0, runtime_1.fetchMiddlewares)(AdminAuthController_1.AdminAuthController)), ...((0, runtime_1.fetchMiddlewares)(AdminAuthController_1.AdminAuthController.prototype.refreshToken)), async function AdminAuthController_refreshToken(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAdminAuthController_refreshToken, request, response });
            const controller = new AdminAuthController_1.AdminAuthController();
            await templateService.apiHandler({
                methodName: 'refreshToken',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAdminAuthController_acceptInvite = {
        data: { "in": "body", "name": "data", "required": true, "ref": "IAcceptInviteInput" },
    };
    app.post('/admin-auth/accept-invite', ...((0, runtime_1.fetchMiddlewares)(AdminAuthController_1.AdminAuthController)), ...((0, runtime_1.fetchMiddlewares)(AdminAuthController_1.AdminAuthController.prototype.acceptInvite)), async function AdminAuthController_acceptInvite(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAdminAuthController_acceptInvite, request, response });
            const controller = new AdminAuthController_1.AdminAuthController();
            await templateService.apiHandler({
                methodName: 'acceptInvite',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    function authenticateMiddleware(security = []) {
        return async function runAuthenticationMiddleware(request, response, next) {
            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
            // keep track of failed auth attempts so we can hand back the most
            // recent one.  This behavior was previously existing so preserving it
            // here
            const failedAttempts = [];
            const pushAndRethrow = (error) => {
                failedAttempts.push(error);
                throw error;
            };
            const secMethodOrPromises = [];
            for (const secMethod of security) {
                if (Object.keys(secMethod).length > 1) {
                    const secMethodAndPromises = [];
                    for (const name in secMethod) {
                        secMethodAndPromises.push(expressAuthenticationRecasted(request, name, secMethod[name], response)
                            .catch(pushAndRethrow));
                    }
                    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
                    secMethodOrPromises.push(Promise.all(secMethodAndPromises)
                        .then(users => { return users[0]; }));
                }
                else {
                    for (const name in secMethod) {
                        secMethodOrPromises.push(expressAuthenticationRecasted(request, name, secMethod[name], response)
                            .catch(pushAndRethrow));
                    }
                }
            }
            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
            try {
                request['user'] = await Promise.any(secMethodOrPromises);
                // Response was sent in middleware, abort
                if (response.writableEnded) {
                    return;
                }
                next();
            }
            catch (err) {
                // Show most recent error as response
                const error = failedAttempts.pop();
                error.status = error.status || 401;
                // Response was sent in middleware, abort
                if (response.writableEnded) {
                    return;
                }
                next(error);
            }
            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        };
    }
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
//# sourceMappingURL=routes.js.map