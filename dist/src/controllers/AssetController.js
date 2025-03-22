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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetController = void 0;
const tsoa_1 = require("tsoa");
const Asset_1 = require("../models/Asset");
const responseWrapper_1 = require("../utils/responseWrapper");
const customErrors_1 = require("../utils/customErrors");
const validateRequest_1 = require("../middleware/validateRequest");
const asset_1 = require("../schemas/asset");
const admin_1 = require("../schemas/admin");
let AssetController = class AssetController {
    async getAllAssets() {
        const assets = await Asset_1.AssetModel.find().lean();
        return (0, responseWrapper_1.successResponse)('Assets fetched successfully', assets);
    }
    async getAsset(id) {
        const asset = await Asset_1.AssetModel.findById(id).lean();
        if (!asset)
            throw new customErrors_1.NotFoundError('Asset not found');
        return (0, responseWrapper_1.successResponse)('Asset fetched successfully', asset);
    }
    async createAsset(data) {
        const { name, networks, rate, symbol, vipRate, icon } = data;
        const existingAsset = await Asset_1.AssetModel.findOne({
            $or: [{ symbol }, { name }],
        });
        if (existingAsset)
            throw new customErrors_1.BadRequestError('Asset with this symbol already exists');
        const asset = await Asset_1.AssetModel.create({
            name,
            networks,
            rate,
            symbol,
            vipRate: vipRate || rate,
            icon,
        });
        return (0, responseWrapper_1.successResponse)('Asset created successfully', asset.toJSON());
    }
    async updateAsset(id, data) {
        const { name, networks, rate, symbol, vipRate } = data;
        const asset = await Asset_1.AssetModel.findById(id);
        if (!asset)
            throw new customErrors_1.NotFoundError('Asset not found');
        if (name || symbol) {
            const existingAsset = await Asset_1.AssetModel.findOne({
                $or: [{ symbol }, { name }],
                _id: { $ne: id },
            });
            if (existingAsset)
                throw new customErrors_1.BadRequestError('Asset with this symbol or name already exists');
        }
        if (name)
            asset.name = name;
        if (rate)
            asset.rate = rate;
        if (vipRate)
            asset.vipRate = vipRate;
        if (symbol)
            asset.symbol = symbol;
        if (networks?.length)
            asset.networks = networks;
        await asset.save();
        return (0, responseWrapper_1.successResponse)('Asset updated successfully', asset.toJSON());
    }
    async deleteAsset(id) {
        const asset = await Asset_1.AssetModel.findByIdAndDelete(id);
        if (!asset)
            throw new customErrors_1.NotFoundError('Asset not found');
        return (0, responseWrapper_1.successResponse)('Asset deleted successfully');
    }
};
exports.AssetController = AssetController;
__decorate([
    (0, tsoa_1.Get)('/'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AssetController.prototype, "getAllAssets", null);
__decorate([
    (0, tsoa_1.Get)('/:id'),
    __param(0, (0, tsoa_1.Path)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AssetController.prototype, "getAsset", null);
__decorate([
    (0, tsoa_1.Post)('/'),
    (0, validateRequest_1.Validate)(asset_1.AddAssetSchema),
    (0, tsoa_1.Security)('BearerAuth', Object.values(admin_1.Role)),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AssetController.prototype, "createAsset", null);
__decorate([
    (0, tsoa_1.Patch)('/:id'),
    (0, validateRequest_1.Validate)(asset_1.UpdateAssetSchema),
    (0, tsoa_1.Security)('BearerAuth', Object.values(admin_1.Role)),
    __param(0, (0, tsoa_1.Path)()),
    __param(1, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AssetController.prototype, "updateAsset", null);
__decorate([
    (0, tsoa_1.Delete)('/:id'),
    (0, tsoa_1.Security)('BearerAuth', Object.values(admin_1.Role)),
    __param(0, (0, tsoa_1.Path)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AssetController.prototype, "deleteAsset", null);
exports.AssetController = AssetController = __decorate([
    (0, tsoa_1.Tags)('Assets'),
    (0, tsoa_1.Route)('assets'),
    (0, tsoa_1.Security)('BearerAuth')
], AssetController);
//# sourceMappingURL=AssetController.js.map