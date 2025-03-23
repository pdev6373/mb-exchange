import { isAdult } from '../utils/helpers';
import { z } from 'zod';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHERS = 'others',
}

export enum TransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'successful',
  FAILED = 'failed',
}

export enum RewardStatus {
  PENDING = 'pending',
  SUCCESS = 'successful',
}

export const UpdatecProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  userName: z.string().optional(),
  country: z
    .object({
      name: z.string().min(1, 'Country name is required'),
      code: z.string().min(1, 'Country colde is required'),
      callingCode: z.string().min(1, 'Country calling code is required'),
      currency: z.string().min(1, 'Country currency is required'),
    })
    .optional(),
  phoneNumber: z.string().optional(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .refine(isAdult, { message: 'You must be at least 18 years old' })
    .optional(),
  gender: z.nativeEnum(Gender).optional(),
});

export interface IUpdateProfileInput {
  firstName?: string;
  lastName?: string;
  userName?: string;
  country?: {
    name: string;
    code: string;
    callingCode: string;
    currency: string;
  };
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: Gender;
}

export const UpdatePasswordSchema = z.object({
  oldPassword: z.string().min(6, 'New password must be at least 6 characters'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export interface IUpdatePasswordInput {
  oldPassword: string;
  newPassword: string;
}

export const UpdatePinSchema = z.object({
  oldPin: z
    .string()
    .length(6, 'PIN must be 6 digits')
    .regex(/^\d{6}$/, 'PIN must contain only numbers'),
  newPin: z
    .string()
    .length(6, 'PIN must be 6 digits')
    .regex(/^\d{6}$/, 'PIN must contain only numbers'),
});

export interface IUpdatePinInput {
  oldPin: string;
  newPin: string;
}

export const EnableNotificationsSchema = z.object({
  enable: z.boolean(),
});

export interface IEnableNotificationsInput {
  enable: boolean;
}

export const MakeTransactionSchema = z.object({
  assetId: z.string().min(1, 'Asset is required'),
  platformId: z.string().min(1, 'Platform is required'),
  address: z.string().min(1, 'Platform name is required'),
  quantity: z.number().gte(1, { message: 'Quantity must be at least 1' }),
  proof: z
    .string()
    .url({ message: 'Invalid URL' })
    .min(1, { message: 'Proof is required' }),
});

export interface IMakeTransactionInput {
  assetId: string;
  platformId: string;
  address: string;
  quantity: number;
  proof: string;
}

export const AddBankSchema = z.object({
  bankName: z.string().min(1, 'Bank name is required'),
  accountName: z.string().min(1, 'Account name is required'),
  accountNumber: z.string().min(1, 'Account number is required'),
});

export interface IAddBankInput {
  bankName: string;
  accountName: string;
  accountNumber: string;
}

export const UpdateBankSchema = z.object({
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  accountName: z.string().optional(),
});

export interface IUpdateBankInput {
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
}
