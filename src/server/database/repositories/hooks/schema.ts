import { sql } from 'drizzle-orm';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { wgInterface } from '../../schema';

export const hooks = sqliteTable('hooks_table', {
  /** same as `wgInterface.name` */
  id: text()
    .primaryKey()
    .references(() => wgInterface.name, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  preUp: text('pre_up').notNull(),
  postUp: text('post_up').notNull(),
  preDown: text('pre_down').notNull(),
  postDown: text('post_down').notNull(),
  jc: text('jc').notNull(),
  jmin: text('jmin').notNull(),
  jmax: text('jmax').notNull(),
  s1: text('s1').notNull(),
  s2: text('s2').notNull(),
  h1: text('h1').notNull(),
  h2: text('h2').notNull(),
  h3: text('h3').notNull(),
  h4: text('h4').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`)
    .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
});
