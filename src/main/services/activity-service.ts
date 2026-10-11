import { desc } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { getDb } from '../db/client'
import { activityLogs } from '../db/schema'
import type {
  ActivityLog,
  CreateActivityLogInput,
  ListActivityLogsInput
} from '../../shared/models/activity'

function toActivityLog(row: typeof activityLogs.$inferSelect): ActivityLog {
  return {
    id: row.id,
    type: row.type,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    title: row.title,
    detail: row.detail,
    source: row.source as ActivityLog['source'],
    riskLevel: row.riskLevel as ActivityLog['riskLevel'],
    metadata: row.metadataJson ? JSON.parse(row.metadataJson) : undefined,
    createdAt: row.createdAt
  }
}

export function createActivityLog(input: CreateActivityLogInput): ActivityLog {
  const now = new Date().toISOString()
  const row = {
    id: randomUUID(),
    type: input.type,
    action: input.action,
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    title: input.title,
    detail: input.detail ?? null,
    source: input.source ?? 'system',
    riskLevel: input.riskLevel ?? 'low',
    metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
    createdAt: now
  } satisfies typeof activityLogs.$inferInsert

  getDb().insert(activityLogs).values(row).run()

  return toActivityLog(row)
}

export function listActivityLogs(input: ListActivityLogsInput = {}): ActivityLog[] {
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 100)
  const rows = getDb()
    .select()
    .from(activityLogs)
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit)
    .all()

  return rows.map(toActivityLog)
}
