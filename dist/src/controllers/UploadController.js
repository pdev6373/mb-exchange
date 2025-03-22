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
exports.UploadController = void 0;
const tsoa_1 = require("tsoa");
const cloudinary_1 = __importDefault(require("../utils/cloudinary"));
const responseWrapper_1 = require("../utils/responseWrapper");
const customErrors_1 = require("../utils/customErrors");
let UploadController = class UploadController {
    async uploadImage(description, file) {
        if (!file)
            throw new customErrors_1.NotFoundError('No file uploaded');
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary_1.default.uploader.upload_stream({
                folder: 'uploads',
                resource_type: 'auto',
            }, (error, result) => {
                if (error || !result)
                    return reject(new customErrors_1.BadRequestError('Failed to upload image'));
                resolve(result);
            });
            stream.end(file.buffer);
        });
        return (0, responseWrapper_1.successResponse)('Upload successful', {
            url: result.secure_url,
            publicId: result.public_id,
            description: description || '',
        });
    }
};
exports.UploadController = UploadController;
__decorate([
    (0, tsoa_1.Post)('/'),
    __param(0, (0, tsoa_1.FormField)()),
    __param(1, (0, tsoa_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "uploadImage", null);
exports.UploadController = UploadController = __decorate([
    (0, tsoa_1.Tags)('Upload Files'),
    (0, tsoa_1.Route)('upload')
], UploadController);
//# sourceMappingURL=UploadController.js.map