import { z } from 'zod';

export const AddAssetSchema = z.object({
  cryptoId: z.string().min(1, 'Crypto ID is required'),
  name: z.string().min(1, 'Asset name is required'),
  symbol: z.string().min(1, 'Asset symbol is required'),
  image: z.string().url({ message: 'Invalid URL' }).optional(),
  rate: z.number().positive('Rate must be a positive number'),
  ngnRate: z.number().positive('NGN rate must be a positive number'),
  description: z.string().optional(),
  hasPlatforms: z.boolean(),
  isActive: z.boolean().optional(),
  platformAddresses: z.array(
    z.object({
      platform: z.string().min(1, 'Platform name is required'),
      address: z.string().min(1, 'Platform address is required'),
    }),
  ),
});

export interface IAddAssetInput {
  cryptoId: string;
  name: string;
  symbol: string;
  image?: string;
  rate: number;
  ngnRate: number;
  description?: string;
  hasPlatforms: boolean;
  isActive?: boolean;
  platformAddresses: {
    platform: string;
    address: string;
  }[];
}

export const UpdateAssetSchema = z.object({
  rate: z.number().positive('Rate must be a positive number').optional(),
  ngnRate: z.number().positive('NGN rate must be a positive number').optional(),
  hasPlatforms: z.boolean().optional(),
  isActive: z.boolean().optional(),
  platformAddresses: z
    .array(
      z.object({
        platform: z.string().min(1, 'Platform name is required'),
        address: z.string().min(1, 'Platform address is required'),
      }),
    )
    .optional(),
});

export interface IUpdateAssetInput {
  rate?: number;
  ngnRate?: number;
  hasPlatforms?: boolean;
  isActive?: boolean;
  platformAddresses?: {
    platform: string;
    address: string;
  }[];
}
