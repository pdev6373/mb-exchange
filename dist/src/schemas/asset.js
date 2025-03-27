"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateAssetSchema = exports.AddAssetSchema = void 0;
const zod_1 = require("zod");
exports.AddAssetSchema = zod_1.z.object({
    cryptoId: zod_1.z.string().min(1, 'Crypto ID is required'),
    name: zod_1.z.string().min(1, 'Asset name is required'),
    symbol: zod_1.z.string().min(1, 'Asset symbol is required'),
    image: zod_1.z.string().url({ message: 'Invalid URL' }).optional(),
    rate: zod_1.z.number().positive('Rate must be a positive number'),
    vipRate: zod_1.z.number().positive('VIP rate must be a positive number').optional(),
    description: zod_1.z.string().optional(),
    hasPlatforms: zod_1.z.boolean(),
    isActive: zod_1.z.boolean().optional(),
    platformAddresses: zod_1.z.array(zod_1.z.object({
        platform: zod_1.z.string().min(1, 'Platform name is required'),
        address: zod_1.z.string().min(1, 'Platform address is required'),
    })),
});
exports.UpdateAssetSchema = zod_1.z.object({
    rate: zod_1.z.number().positive('Rate must be a positive number').optional(),
    vipRate: zod_1.z.number().positive('VIP rate must be a positive number').optional(),
    hasPlatforms: zod_1.z.boolean().optional(),
    isActive: zod_1.z.boolean().optional(),
    platformAddresses: zod_1.z
        .array(zod_1.z.object({
        platform: zod_1.z.string().min(1, 'Platform name is required'),
        address: zod_1.z.string().min(1, 'Platform address is required'),
    }))
        .optional(),
});
//# sourceMappingURL=asset.js.map