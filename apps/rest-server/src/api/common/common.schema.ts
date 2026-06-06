import { z } from 'zod';

const errorSchema = z.object({
  code: z.string(),
  message: z.string(),
  uuid: z.string().optional(),
  details: z.string().or(z.object({}).passthrough()).optional(),
});

export type ErrorBody = z.infer<typeof errorSchema>;

export const errorsSchema = z.object({
  errors: z.array(errorSchema),
});

export const emptyBodySchema = z.string().length(0);
