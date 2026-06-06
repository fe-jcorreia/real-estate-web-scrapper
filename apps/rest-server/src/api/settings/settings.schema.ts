import type { ForceUpdate, ForceUpdatePlatform, Settings } from '@domain/model/settings.model.js';
import { type ZodType, z } from 'zod';

export const forceUpdatePlatformSchema = z.object({
  latest: z.number().int(),
  required: z.number().int(),
}) satisfies ZodType<ForceUpdatePlatform>;

export const forceUpdateSchema = z.object({
  android: forceUpdatePlatformSchema,
  ios: forceUpdatePlatformSchema,
}) satisfies ZodType<ForceUpdate>;

export const settingsSchema = z.object({
  forceUpdate: forceUpdateSchema,
}) satisfies ZodType<Settings>;
