"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateAssetSchema = exports.AddAssetSchema = void 0;
const zod_1 = require("zod");
exports.AddAssetSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Asset name is required'),
    icon: zod_1.z
        .string()
        .url({ message: 'Invalid URL' })
        .min(1, { message: 'Asset icon is required' }),
    symbol: zod_1.z.string().min(1, 'Asset symbol is required'),
    rate: zod_1.z.number().positive('Rate must be a positive number'),
    vipRate: zod_1.z.number().positive('Rate must be a positive number').optional(),
    networks: zod_1.z.array(zod_1.z.object({
        icon: zod_1.z.string().url({ message: 'Invalid URL' }).optional(),
        name: zod_1.z.string().min(1, 'Crypto network name is required'),
        address: zod_1.z.string().min(1, 'Crypto network address is required'),
    })),
});
exports.UpdateAssetSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    icon: zod_1.z.string().url({ message: 'Invalid URL' }).optional(),
    symbol: zod_1.z.string().optional(),
    rate: zod_1.z.number().positive('Rate must be a positive number').optional(),
    vipRate: zod_1.z.number().positive('Rate must be a positive number').optional(),
    networks: zod_1.z
        .array(zod_1.z.object({
        name: zod_1.z.string().min(1, 'Crypto network name is required'),
        address: zod_1.z.string().min(1, 'Crypto network address is required'),
        icon: zod_1.z.string().url({ message: 'Invalid URL' }).optional(),
    }))
        .optional(),
});
//# sourceMappingURL=asset.js.map