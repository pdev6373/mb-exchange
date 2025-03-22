import { z } from 'zod';

export enum Role {
  SUPER_ADMIN = 'superadmin',
  ADMIN = 'admin',
  EDITOR = 'editor',
  MODERATOR = 'moderator',
}

export const AddAdminSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'First name is required'),
  role: z.nativeEnum(Role).refine((role) => role !== Role.SUPER_ADMIN, {
    message: 'Cannot assign superadmin role',
  }),
});

export interface IAddAdminInput {
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'moderator';
}

export const UpdateAdminSchema = z.object({
  name: z.string().optional(),
  role: z
    .nativeEnum(Role)
    .refine((role) => role !== Role.SUPER_ADMIN, {
      message: 'Cannot assign superadmin role',
    })
    .optional(),
});

export interface IUpdateAdminInput {
  name?: string;
  role?: 'admin' | 'editor' | 'moderator';
}

export const AddNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
});

export interface IAddNotificationInput {
  title: string;
  message: string;
}
