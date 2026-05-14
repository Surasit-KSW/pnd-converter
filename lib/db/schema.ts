import { pgTable, text, integer, timestamp, uuid } from 'drizzle-orm/pg-core'

export const conversions = pgTable('conversions', {
  id: uuid('id').defaultRandom().primaryKey(),
  filename: text('filename').notNull(),
  pndType: text('pnd_type').notNull(),       // 'pnd3' | 'pnd53'
  rowCount: integer('row_count').notNull(),
  output: text('output').notNull(),           // full _rdprep.txt content
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type Conversion = typeof conversions.$inferSelect
export type NewConversion = typeof conversions.$inferInsert
