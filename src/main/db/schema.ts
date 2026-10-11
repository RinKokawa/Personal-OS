import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const activityLogs = sqliteTable('activity_logs', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type'),
  entityId: text('entity_id'),
  title: text('title').notNull(),
  detail: text('detail'),
  source: text('source').notNull().default('system'),
  riskLevel: text('risk_level').notNull().default('low'),
  metadataJson: text('metadata_json'),
  createdAt: text('created_at').notNull()
})
