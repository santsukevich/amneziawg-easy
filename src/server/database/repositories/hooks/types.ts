import type { InferSelectModel } from 'drizzle-orm';
import z from 'zod';
import type { hooks } from './schema';

export type HooksType = InferSelectModel<typeof hooks>;

export type HooksUpdateType = Omit<HooksType, 'id' | 'createdAt' | 'updatedAt'>;

export const HooksUpdateSchema = schemaForType<HooksUpdateType>()(
  z.object({
    preUp: HookSchema,
    postUp: HookSchema,
    preDown: HookSchema,
    jc: HookSchema,
	jmin: HookSchema,
	jmax: HookSchema,
	s1: HookSchema,
	s2: HookSchema,
	h1: HookSchema,
	h2: HookSchema,
	h3: HookSchema,
	h4: HookSchema,
  })
);
