import { sql, relations } from 'drizzle-orm';
import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { oneTimeLink, user, wgInterface } from '../../schema';

function getRandomNumberString(min, max) {
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}


/** null means use value from userConfig */

export const client = sqliteTable('clients_table', {
  id: int().primaryKey({ autoIncrement: true }),
  userId: int('user_id')
    .notNull()
    .references(() => user.id, {
      onDelete: 'restrict',
      onUpdate: 'cascade',
    }),
  interfaceId: text('interface_id')
    .notNull()
    .references(() => wgInterface.name, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  name: text().notNull(),
  ipv4Address: text('ipv4_address').notNull().unique(),
  ipv6Address: text('ipv6_address').notNull().unique(),
  preUp: text('pre_up').default('').notNull(),
  postUp: text('post_up').default('').notNull(),
  preDown: text('pre_down').default('').notNull(),
  postDown: text('post_down').default('').notNull(),
  jc: text('jc').default(getRandomNumberString(2, 120)).notNull(),
  jmin: text('jmin').default('10').notNull(),
  jmax: text('jmax').default('50').notNull(),
  s1: text('s1').default(getRandomNumberString(15, 150)).notNull(),
  s2: text('s2').default(getRandomNumberString(15, 150)).notNull(),
  h1: text('h1').default(getRandomNumberString(0, 999999)).notNull(),
  h2: text('h2').default(getRandomNumberString(0, 999999)).notNull(),
  h3: text('h3').default(getRandomNumberString(0, 999999)).notNull(),
  h4: text('h4').default(getRandomNumberString(0, 999999)).notNull(),
  privateKey: text('private_key').notNull(),
  publicKey: text('public_key').notNull(),
  preSharedKey: text('pre_shared_key').notNull(),
  expiresAt: text('expires_at'),
  allowedIps: text('allowed_ips', { mode: 'json' }).$type<string[]>(),
  serverAllowedIps: text('server_allowed_ips', { mode: 'json' })
    .$type<string[]>()
    .notNull(),
  persistentKeepalive: int('persistent_keepalive').notNull(),
  mtu: int().notNull(),
  dns: text({ mode: 'json' }).$type<string[]>(),
  serverEndpoint: text('server_endpoint'),
  enabled: int({ mode: 'boolean' }).notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`)
    .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
});

export const clientsRelations = relations(client, ({ one }) => ({
  oneTimeLink: one(oneTimeLink, {
    fields: [client.id],
    references: [oneTimeLink.id],
  }),
  user: one(user, {
    fields: [client.userId],
    references: [user.id],
  }),
  interface: one(wgInterface, {
    fields: [client.interfaceId],
    references: [wgInterface.name],
  }),
}));
