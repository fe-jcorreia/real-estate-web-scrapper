import type { UpdateUserInput, User, UserInput } from '@domain/model/users.model.js';
import { type ZodType, z } from 'zod';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\d])(?=.*\S).{8,}$/;
const FULL_NAME_REGEX = /^[A-Za-z]+\s([A-Za-z]+\s)*[A-Za-z]+$/;

const isValidName = (name: string) => name.match(FULL_NAME_REGEX);
const isValidPassword = (password: string) => password.match(PASSWORD_REGEX);

export const emailSchemaField = z.string({ message: 'users.error.invalid-email' }).email('users.error.invalid-email');

export const userSchema = z.object({
  id: z.string(),
  email: emailSchemaField,
  name: z.string().refine(isValidName, 'users.error.invalid-name'),
}) satisfies ZodType<User>;

export const userInputSchema = userSchema.omit({ id: true }).extend({
  password: z.string().refine(isValidPassword, 'users.error.invalid-password'),
}) satisfies ZodType<UserInput>;

export const updateUserInputSchema = userInputSchema
  .omit({ email: true })
  .extend({ oldPassword: z.string().meta({ description: 'Required if password is sent' }) })
  .partial() satisfies ZodType<UpdateUserInput>;
