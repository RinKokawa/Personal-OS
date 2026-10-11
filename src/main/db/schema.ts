import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

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

export const quests = sqliteTable('quests', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  type: text('type').notNull().default('side'),
  status: text('status').notNull().default('todo'),
  priority: text('priority').notNull().default('normal'),
  dueAt: text('due_at'),
  parentId: text('parent_id'),
  sortOrder: integer('sort_order').notNull().default(0),
  source: text('source').notNull().default('user'),
  sourceRef: text('source_ref'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  completedAt: text('completed_at'),
  canceledAt: text('canceled_at'),
  deletedAt: text('deleted_at')
})
