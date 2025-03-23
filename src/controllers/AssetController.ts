import {
  Route,
  Tags,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Path,
  Security,
} from 'tsoa';
import { AssetModel } from '../models/Asset';
import { successResponse } from '../utils/responseWrapper';
import { BadRequestError, NotFoundError } from '../utils/customErrors';
import { Validate } from '../middleware/validateRequest';
import {
  AddAssetSchema,
  IAddAssetInput,
  IUpdateAssetInput,
  UpdateAssetSchema,
} from '../schemas/asset';
import { Role } from '../schemas/admin';

@Tags('Assets')
@Route('assets')
@Security('BearerAuth')
export class AssetController {
  @Get('/')
  public async getAllAssets() {
    const assets = await AssetModel.find().lean();
    return successResponse('Assets fetched successfully', assets);
  }

  @Get('/:id')
  public async getAsset(@Path() id: string) {
    const asset = await AssetModel.findById(id).lean();
    if (!asset) throw new NotFoundError('Asset not found');
    return successResponse('Asset fetched successfully', asset);
  }

  @Post('/')
  @Validate(AddAssetSchema)
  @Security('BearerAuth', Object.values(Role))
  public async createAsset(@Body() data: IAddAssetInput) {
    const {
      name,
      networkAddresses,
      rate,
      symbol,
      vipRate,
      image,
      platforms,
      description,
      isActive,
      cryptoId,
    } = data;

    const existingAsset = await AssetModel.findOne({
      cryptoId,
    });

    if (existingAsset) throw new BadRequestError('Asset already exists');

    const asset = await AssetModel.create({
      name,
      symbol,
      image,
      rate,
      vipRate: vipRate || rate,
      networkAddresses,
      platforms,
      description,
      isActive: isActive ?? true,
    });

    return successResponse('Asset created successfully', asset.toJSON());
  }

  @Patch('/:id')
  @Validate(UpdateAssetSchema)
  @Security('BearerAuth', Object.values(Role))
  public async updateAsset(
    @Path() id: string,
    @Body() data: IUpdateAssetInput,
  ) {
    const {
      name,
      networkAddresses,
      rate,
      symbol,
      vipRate,
      image,
      platforms,
      description,
      isActive,
      cryptoId,
    } = data;

    const asset = await AssetModel.findById(id);
    if (!asset) throw new NotFoundError('Asset not found');

    if (cryptoId) {
      const existingAsset = await AssetModel.findOne({
        cryptoId,
        _id: { $ne: id },
      });

      if (existingAsset)
        throw new BadRequestError('Asset with this id already exists');
    }

    if (name) asset.name = name;
    if (symbol) asset.symbol = symbol;
    if (rate) asset.rate = rate;
    if (vipRate !== undefined) asset.vipRate = vipRate;
    if (image !== undefined) asset.image = image;
    if (platforms !== undefined) asset.platforms = platforms;
    if (description !== undefined) asset.description = description;
    if (isActive !== undefined) asset.isActive = isActive;
    if (networkAddresses?.length) asset.networkAddresses = networkAddresses;

    await asset.save();
    return successResponse('Asset updated successfully', asset.toJSON());
  }

  @Delete('/:id')
  @Security('BearerAuth', Object.values(Role))
  public async deleteAsset(@Path() id: string) {
    const asset = await AssetModel.findByIdAndDelete(id);
    if (!asset) throw new NotFoundError('Asset not found');
    return successResponse('Asset deleted successfully');
  }
}
