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
import { TransactionModel } from '../models/Transaction';
import { TransactionStatus } from '../schemas/user';

@Tags('Assets')
@Route('assets')
@Security('BearerAuth')
export class AssetController {
  @Get('/')
  public async getAllAssets() {
    await AssetModel.deleteMany();
    const assets = await AssetModel.find().sort({ createdAt: -1 }).lean();
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
      rate,
      symbol,
      ngnRate,
      ghcRate,
      image,
      hasPlatforms,
      description,
      isActive,
      cryptoId,
      platformAddresses,
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
      ngnRate,
      ghcRate,
      platformAddresses,
      hasPlatforms,
      description,
      isActive: isActive ?? true,
      cryptoId,
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
      platformAddresses,
      rate,
      ngnRate,
      ghcRate,
      hasPlatforms,
      isActive,
    } = data;

    const asset = await AssetModel.findById(id);
    if (!asset) throw new NotFoundError('Asset not found');

    if (rate) asset.rate = rate;
    if (ngnRate !== undefined) asset.ngnRate = ngnRate;
    if (ghcRate !== undefined) asset.ghcRate = ghcRate;
    if (hasPlatforms) asset.hasPlatforms = hasPlatforms;
    if (isActive !== undefined) asset.isActive = isActive;
    if (platformAddresses?.length) asset.platformAddresses = platformAddresses;

    await asset.save();
    return successResponse('Asset updated successfully', asset.toJSON());
  }

  @Delete('/:id')
  @Security('BearerAuth', Object.values(Role))
  public async deleteAsset(@Path() id: string) {
    const asset = await AssetModel.findById(id);
    if (!asset) throw new NotFoundError('Asset not found');
    const transactionExist = await TransactionModel.findOne({
      'asset.id': asset._id,
      status: TransactionStatus.PENDING,
    });

    if (transactionExist)
      throw new BadRequestError('Pending transaction exists for this asset');

    await asset.deleteOne();
    return successResponse('Asset deleted successfully');
  }
}
