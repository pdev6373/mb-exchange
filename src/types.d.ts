import { Gender, RewardStatus, TransactionStatus } from './schemas/user';
import { Role } from './schemas/admin';

export type ApiResponse<T = any> = {
  success: boolean;
  message: string;
  data?: T;
};

export type Token = {
  accessToken?: string;
  refreshToken?: string;
};

export type RoleType = `${Role}`;
export type TransactionStatusType = `${TransactionStatus}`;
export type RewardStatusType = `${RewardStatus}`;
export type GenderType = `${Gender}`;

export type GenerateTokens = {
  email: string;
  type?: 'refresh' | 'access' | 'both';
  id?: string;
  accessExpiry?: any;
  refreshExpiry?: any;
  role?: RoleType;
};
