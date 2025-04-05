import { Route, Post, Body, Tags, Security, Request, Get } from 'tsoa';
import { AdminModel } from '../models/Admin';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Validate } from '../middleware/validateRequest';
import { successResponse } from '../utils/responseWrapper';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../utils/customErrors';
import { Request as ExpressRequest } from 'express';
import {
  AcceptInviteSchema,
  IAcceptInviteInput,
  ILoginInput,
  IRefreshTokenInput,
  LoginSchema,
  RefreshTokenSchema,
} from '../schemas/auth';
import {
  ACCESS_TOKEN_SECRET,
  generateTokens,
  REFRESH_TOKEN_SECRET,
} from '../utils/helpers';

const ACCESS_TOKEN_EXPIRY = '1d';
const REFRESH_TOKEN_EXPIRY = '7d';

@Tags('Admin Auth')
@Route('admin-auth')
export class AdminAuthController {
  @Post('/login')
  @Validate(LoginSchema)
  public async login(@Body() data: ILoginInput) {
    const { email, password } = data;
    const admin = await AdminModel.findOne({ email });
    if (!admin) throw new NotFoundError('Admin not found');
    if (!admin.isActive) throw new NotFoundError('Admin not verified');

    const isMatch = await bcrypt.compare(password, admin.password!);
    if (!isMatch) throw new BadRequestError('Invalid email or password');

    const tokens = generateTokens({
      id: admin._id.toString(),
      email: admin.email,
      accessExpiry: ACCESS_TOKEN_EXPIRY,
      refreshExpiry: REFRESH_TOKEN_EXPIRY,
      role: admin?.role,
    });
    admin.refreshToken = tokens.refreshToken;
    await admin.save();

    return successResponse('Login successfully', tokens);
  }

  @Get('/logout')
  @Security('BearerAuth')
  public async logout(@Request() req: ExpressRequest) {
    const admin = await AdminModel.findById(req.user?._id);
    if (!admin) throw new NotFoundError('User not found');

    admin.refreshToken = undefined;
    await admin.save();
    return successResponse('Logged out successfully');
  }

  @Post('/refresh-token')
  @Validate(RefreshTokenSchema)
  public async refreshToken(@Body() data: IRefreshTokenInput) {
    const { refreshToken } = data;
    const decoded: any = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);

    const admin = await AdminModel.findById(decoded._id);
    if (!admin) throw new ForbiddenError('Invalid refresh token');

    const token = generateTokens({
      id: admin._id.toString(),
      email: admin.email,
      accessExpiry: ACCESS_TOKEN_EXPIRY,
      type: 'access',
      role: admin.role,
    });
    return successResponse('Token generated successfully', token);
  }

  @Post('/accept-invite')
  @Validate(AcceptInviteSchema)
  public async acceptInvite(@Body() data: IAcceptInviteInput) {
    const { token, password, action } = data;
    try {
      const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as {
        email: string;
        _id: string;
      };

      const admin = await AdminModel.findById(decoded._id);
      if (!admin || !admin.invitationToken || admin.isActive)
        throw new UnauthorizedError('Invalid or expired invitation');

      if (!action) return successResponse('Valid Token');
      if (action == 'reject') {
        await admin.deleteOne();
        return successResponse('Admin invitation rejected');
      }

      if (new Date() > new Date(admin.invitationExpires!)) {
        await admin.deleteOne();
        throw new UnauthorizedError('Invitation expired');
      }

      if (!password) throw new BadRequestError('Password is required');
      const hashedPassword = await bcrypt.hash(password, 10);
      admin.password = hashedPassword;
      admin.isActive = true;
      admin.invitationToken = undefined;
      admin.invitationExpires = undefined;
      await admin.save();
      return successResponse('Admin invitation accepted');
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }
}
