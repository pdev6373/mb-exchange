import { z } from 'zod';

export const AddAssetSchema = z.object({
  name: z.string().min(1, 'Asset name is required'),
  icon: z
    .string()
    .url({ message: 'Invalid URL' })
    .min(1, { message: 'Asset icon is required' }),
  symbol: z.string().min(1, 'Asset symbol is required'),
  rate: z.number().positive('Rate must be a positive number'),
  vipRate: z.number().positive('Rate must be a positive number').optional(),
  networks: z.array(
    z.object({
      icon: z.string().url({ message: 'Invalid URL' }).optional(),
      name: z.string().min(1, 'Crypto network name is required'),
      address: z.string().min(1, 'Crypto network address is required'),
    }),
  ),
});

export interface IAddAssetInput {
  name: string;
  icon: string;
  symbol: string;
  rate: number;
  vipRate?: number;
  networks: { name: string; address: string; icon?: string }[];
}

export const UpdateAssetSchema = z.object({
  name: z.string().optional(),
  icon: z.string().url({ message: 'Invalid URL' }).optional(),
  symbol: z.string().optional(),
  rate: z.number().positive('Rate must be a positive number').optional(),
  vipRate: z.number().positive('Rate must be a positive number').optional(),
  networks: z
    .array(
      z.object({
        name: z.string().min(1, 'Crypto network name is required'),
        address: z.string().min(1, 'Crypto network address is required'),
        icon: z.string().url({ message: 'Invalid URL' }).optional(),
      }),
    )
    .optional(),
});

export interface IUpdateAssetInput {
  name?: string;
  icon?: string;
  symbol?: string;
  rate?: number;
  vipRate?: number;
  networks?: { name: string; address: string; icon?: string }[];
}
