"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddNotificationSchema = exports.UpdateAdminSchema = exports.AddAdminSchema = exports.Role = void 0;
const zod_1 = require("zod");
var Role;
(function (Role) {
    Role["SUPER_ADMIN"] = "superadmin";
    Role["ADMIN"] = "admin";
    Role["EDITOR"] = "editor";
    Role["MODERATOR"] = "moderator";
})(Role || (exports.Role = Role = {}));
exports.AddAdminSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    name: zod_1.z.string().min(1, 'First name is required'),
    role: zod_1.z.nativeEnum(Role).refine((role) => role !== Role.SUPER_ADMIN, {
        message: 'Cannot assign superadmin role',
    }),
});
exports.UpdateAdminSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    role: zod_1.z
        .nativeEnum(Role)
        .refine((role) => role !== Role.SUPER_ADMIN, {
        message: 'Cannot assign superadmin role',
    })
        .optional(),
});
exports.AddNotificationSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required'),
    message: zod_1.z.string().min(1, 'Message is required'),
});
//# sourceMappingURL=admin.js.map