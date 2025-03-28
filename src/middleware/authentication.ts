import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserModel } from '../models/User';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../utils/customErrors';
import { Admin, AdminModel } from '../models/Admin';
import { Types } from 'mongoose';
import { RoleType } from '../types';
import { ACCESS_TOKEN_SECRET } from '../utils/helpers';

export async function expressAuthentication(
  request: Request,
  securityName: string,
  scopes?: RoleType[],
): Promise<any> {
  if (securityName !== 'BearerAuth')
    throw new BadRequestError('Unknown authentication type');

  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    throw new ForbiddenError('Invalid token');
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as {
      _id: string;
      role?: RoleType;
    };

    let user;
    if (decoded.role)
      user = await AdminModel.findById(decoded._id).select('-password').lean();
    else
      user = await UserModel.findById(decoded._id)
        .select('-password -pin')
        .lean();

    if (!user) throw new NotFoundError(`${decoded.role || 'user'} not found`);
    if (!user.refreshToken) throw new ForbiddenError('Logged out');
    if (scopes?.length && (!decoded?.role || !scopes.includes(decoded?.role)))
      throw new UnauthorizedError('Insufficient permissions');

    request.user = user as
      | (User & { _id: Types.ObjectId })
      | (Admin & {
          _id: Types.ObjectId;
          role: 'superadmin' | 'editor' | 'moderator';
        });
    return user;
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof NotFoundError)
      throw error;
    else throw new ForbiddenError('Invalid token');
  }
}
