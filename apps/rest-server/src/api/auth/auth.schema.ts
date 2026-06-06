import { emailSchemaField, userSchema } from '@api/users/users.schema';
import type { Auth, AuthInput } from '@domain/model/auth.model.js';
import { type ZodType, z } from 'zod';

export const authSchema = z.object({ token: z.string(), user: userSchema }) satisfies ZodType<Auth>;

export const authInputSchema = z.object({
  email: emailSchemaField,
  password: z.string({ message: 'users.error.required-password' }),
}) satisfies ZodType<AuthInput>;
