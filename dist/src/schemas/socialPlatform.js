"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateSocialPlatformSchema = exports.AddSocialPlatformSchema = void 0;
const zod_1 = require("zod");
exports.AddSocialPlatformSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Social platform name is required'),
    url: zod_1.z
        .string()
        .url({ message: 'Invalid URL' })
        .min(1, { message: 'Social platform url is required' }),
    icon: zod_1.z.string().min(1, 'Social platform icon is required'),
});
exports.UpdateSocialPlatformSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    url: zod_1.z.string().url({ message: 'Invalid URL' }).optional(),
    icon: zod_1.z.string().optional(),
});
//# sourceMappingURL=socialPlatform.js.map