import {
  Route,
  Tags,
  Request,
  Get,
  Security,
  Patch,
  Body,
  Path,
  Post,
  Delete,
} from 'tsoa';
import { successResponse } from '../utils/responseWrapper';
import { BadRequestError, NotFoundError } from '../utils/customErrors';
import { Request as ExpressRequest } from 'express';
import { Validate } from '../middleware/validateRequest';
import { SocialPlatformModel } from '../models/SocialPlatform';
import { Role } from '../schemas/admin';
import {
  AddSocialPlatformSchema,
  IAddSocialPlatformInput,
  IUpdateSocialPlatformInput,
  UpdateSocialPlatformSchema,
} from '../schemas/socialPlatform';

@Tags('Social Platforms')
@Route('social-platforms')
@Security('BearerAuth')
export class SocialPlatformController {
  @Get('/')
  public async getSocialPlatforms() {
    const socialPlatforms = await SocialPlatformModel.find().lean();
    return successResponse(
      'Social Platforms fetched successfully',
      socialPlatforms,
    );
  }

  @Get('/:id')
  public async getSocialPlatform(@Path() id: string) {
    const socialPlatform = await SocialPlatformModel.findById(id).lean();
    if (!socialPlatform) throw new NotFoundError('Social platform not found');

    return successResponse(
      'Social Platform fetched successfully',
      socialPlatform,
    );
  }

  @Post('/')
  @Validate(AddSocialPlatformSchema)
  @Security('BearerAuth', Object.values(Role))
  public async addBank(@Body() data: IAddSocialPlatformInput) {
    const { icon, name, url } = data;
    const socialPlatformExist = await SocialPlatformModel.findOne({ name });
    if (socialPlatformExist)
      throw new BadRequestError(
        'A social platform with this name already exists',
      );

    await SocialPlatformModel.create({
      icon,
      name,
      url,
    });
    return successResponse('Social platform added successfully');
  }

  @Patch('/:id')
  @Validate(UpdateSocialPlatformSchema)
  @Security('BearerAuth', Object.values(Role))
  public async updatePassword(
    @Path() id: string,
    @Body() data: IUpdateSocialPlatformInput,
    @Request() req: ExpressRequest,
  ) {
    const { icon, name, url } = data;
    const socialPlatform = await SocialPlatformModel.findById(id);

    if (!socialPlatform) throw new NotFoundError('Social platform not found');

    if (name) {
      const socialPlatformExist = await SocialPlatformModel.findOne({
        name,
        _id: { $ne: id },
      });

      if (socialPlatformExist)
        throw new BadRequestError('A social platform with name already exists');

      socialPlatform.name = name;
    }

    if (url) socialPlatform.url = url;
    if (icon) socialPlatform.icon = icon;
    await socialPlatform.save();

    return successResponse('Social platform updated successfully');
  }

  @Delete('/:id')
  @Security('BearerAuth', Object.values(Role))
  public async deleteSocialPlatform(@Path() id: string) {
    const deletedSocialPlatform = await SocialPlatformModel.findByIdAndDelete(
      id,
    );
    if (!deletedSocialPlatform)
      throw new NotFoundError('Social platform not found');

    return successResponse('Social platform deleted successfully');
  }
}
