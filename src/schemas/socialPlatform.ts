import { z } from 'zod';

export const AddSocialPlatformSchema = z.object({
  name: z.string().min(1, 'Social platform name is required'),
  url: z
    .string()
    .url({ message: 'Invalid URL' })
    .min(1, { message: 'Social platform url is required' }),
  icon: z.string().min(1, 'Social platform icon is required'),
});

export interface IAddSocialPlatformInput {
  name: string;
  url: string;
  icon: string;
}

export const UpdateSocialPlatformSchema = z.object({
  name: z.string().optional(),
  url: z.string().url({ message: 'Invalid URL' }).optional(),
  icon: z.string().optional(),
});

export interface IUpdateSocialPlatformInput {
  name?: string;
  url?: string;
  icon?: string;
}
