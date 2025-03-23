import { z } from 'zod';

export const AddAssetSchema = z.object({
  cryptoId: z.string().min(1, 'Crypto ID is required'),
  name: z.string().min(1, 'Asset name is required'),
  symbol: z.string().min(1, 'Asset symbol is required'),
  image: z.string().url({ message: 'Invalid URL' }).optional(),
  rate: z.number().positive('Rate must be a positive number'),
  vipRate: z.number().positive('VIP rate must be a positive number'),
  description: z.string().optional(),
  platforms: z.record(z.string(), z.string()).optional(),
  isActive: z.boolean().optional(),
  networkAddresses: z.array(
    z.object({
      platform: z.string().min(1, 'Platform name is required'),
      address: z.string().min(1, 'Network address is required'),
    }),
  ),
});

export interface IAddAssetInput {
  cryptoId: string;
  name: string;
  symbol: string;
  image?: string;
  rate: number;
  vipRate: number;
  description?: string;
  platforms?: Record<string, string>;
  isActive?: boolean;
  networkAddresses: {
    platform: string;
    address: string;
  }[];
}

export const UpdateAssetSchema = z.object({
  rate: z.number().positive('Rate must be a positive number').optional(),
  vipRate: z.number().positive('VIP rate must be a positive number').optional(),
  platforms: z.record(z.string(), z.string()).optional(),
  isActive: z.boolean().optional(),
  networkAddresses: z
    .array(
      z.object({
        platform: z.string().min(1, 'Platform name is required'),
        address: z.string().min(1, 'Network address is required'),
      }),
    )
    .optional(),
});

export interface IUpdateAssetInput {
  rate?: number;
  vipRate?: number;
  platforms?: Record<string, string>;
  isActive?: boolean;
  networkAddresses?: {
    platform: string;
    address: string;
  }[];
}
