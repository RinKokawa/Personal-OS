import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const appSettings = sqliteTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  valueType: text('value_type').notNull().default('string'),
  description: text('description'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
})

export const permissionGrants = sqliteTable('permission_grants', {
  id: text('id').primaryKey(),
  subjectType: text('subject_type').notNull(),
  subjectId: text('subject_id'),
  permission: text('permission').notNull(),
  scopeJson: text('scope_json'),
  status: text('status').notNull(),
  expiresAt: text('expires_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
})

export const approvalRecords = sqliteTable('approval_records', {
  id: text('id').primaryKey(),
  requestType: text('request_type').notNull(),
  summary: text('summary').notNull(),
  riskLevel: text('risk_level').notNull(),
  status: text('status').notNull(),
  subjectType: text('subject_type'),
  subjectId: text('subject_id'),
  payloadJson: text('payload_json'),
  decidedAt: text('decided_at'),
  createdAt: text('created_at').notNull()
})

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

export const journalEntries = sqliteTable('journal_entries', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  entryDate: text('entry_date').notNull(),
  filePath: text('file_path').notNull(),
  excerpt: text('excerpt'),
  wordCount: integer('word_count').notNull().default(0),
  source: text('source').notNull().default('user'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at')
})
