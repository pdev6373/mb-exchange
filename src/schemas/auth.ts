import { isAdult } from '../utils/helpers';
import { z } from 'zod';
import { Gender } from './user';
import { GenderType } from '../types';

export enum RegistrationStatus {
  INCOMPLETE = 'incomplete',
  COMPLETE = 'complete',
  ACTIVE = 'active',
}

export enum OTPType {
  REGISTER = 'register',
  RESET = 'reset',
}

export const SendOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  type: z.nativeEnum(OTPType).optional(),
});

export interface ISendOtpInput {
  email: string;
  type?: OTPType;
}

export const VerifyEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d{6}$/, 'PIN must contain only numbers'),
});

export interface IVerifyEmailInput {
  email: string;
  otp: string;
}

export const ResetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d{6}$/, 'PIN must contain only numbers'),
  password: z.string().min(6, 'New password must be at least 6 characters'),
});

export interface IResetPasswordInput {
  email: string;
  otp: string;
  password: string;
}

export const CompleteBasicProfileSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  userName: z.string().optional(),
  referrer: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export interface ICompleteBasicProfileInput {
  email: string;
  firstName: string;
  lastName: string;
  userName?: string;
  referrer?: string;
  password: string;
}

export const CompleteAdditionalProfileSchema = z.object({
  email: z.string().email('Invalid email address'),
  country: z.object({
    name: z.string().min(1, 'Country name is required'),
    code: z.string().min(1, 'Country code is required'),
    callingCode: z.string().min(1, 'Country calling code is required'),
    currency: z.string().min(1, 'Country currency is required'),
  }),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .refine(isAdult, { message: 'You must be at least 18 years old' }),
  gender: z.nativeEnum(Gender),
  // nin: z.string().min(1, 'Nin is required'),
  nin: z.string().optional(),
});

export interface ICompleteAdditionalProfileInput {
  email: string;
  country: {
    name: string;
    code: string;
    callingCode: string;
    currency: string;
  };
  phoneNumber: string;
  dateOfBirth: string;
  gender: GenderType;
  nin?: string;
}

export const SetupPinSchema = z.object({
  email: z.string().email('Invalid email address'),
  pin: z
    .string()
    .length(6, 'PIN must be 6 digits')
    .regex(/^\d{6}$/, 'PIN must contain only numbers'),
});

export interface ISetupPinInput {
  email: string;
  pin: string;
}

export const ConfirmPinSchema = z.object({
  pin: z
    .string()
    .length(6, 'PIN must be 6 digits')
    .regex(/^\d{6}$/, 'PIN must contain only numbers'),
});

export interface IConfirmPinInput {
  pin: string;
}

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export interface ILoginInput {
  email: string;
  password: string;
}

export const DeleteAccountSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  reason: z.string().optional(),
});

export interface IDeleteAccountInput {
  password: string;
  reason?: string;
}

export const RefreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export interface IRefreshTokenInput {
  refreshToken: string;
}

export const AcceptInviteSchema = z.object({
  token: z.string(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .optional(),
  action: z.enum(['accept', 'reject']).optional(),
});

export interface IAcceptInviteInput {
  token: string;
  password?: string;
  action?: 'accept' | 'reject';
}
