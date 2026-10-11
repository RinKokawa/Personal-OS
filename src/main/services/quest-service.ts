import { and, desc, eq, isNull, ne } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { getDb } from '../db/client'
import { quests } from '../db/schema'
import { createActivityLog } from './activity-service'
import type {
  CreateQuestInput,
  ListQuestsInput,
  Quest,
  QuestPriority,
  QuestSource,
  QuestStatus,
  QuestType,
  UpdateQuestInput
} from '../../shared/models/quest'

function toQuest(row: typeof quests.$inferSelect): Quest {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type as QuestType,
    status: row.status as QuestStatus,
    priority: row.priority as QuestPriority,
    dueAt: row.dueAt,
    parentId: row.parentId,
    sortOrder: row.sortOrder,
    source: row.source as QuestSource,
    sourceRef: row.sourceRef,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    completedAt: row.completedAt,
    canceledAt: row.canceledAt,
    deletedAt: row.deletedAt
  }
}

function assertTitle(title: string): string {
  const value = title.trim()
  if (!value) throw new Error('任务标题不能为空')
  if (value.length > 120) throw new Error('任务标题不能超过 120 个字符')
  return value
}

export function listQuests(input: ListQuestsInput = {}): Quest[] {
  const limit = Math.min(Math.max(input.limit ?? 100, 1), 200)
  const status = input.status ?? 'all'
  const conditions = [isNull(quests.deletedAt)]

  if (status === 'open') {
    conditions.push(ne(quests.status, 'done'))
  } else if (status !== 'all') {
    conditions.push(eq(quests.status, status))
  }

  const rows = getDb()
    .select()
    .from(quests)
    .where(and(...conditions))
    .orderBy(desc(quests.createdAt))
    .limit(limit)
    .all()

  return rows.map(toQuest)
}

export function createQuest(input: CreateQuestInput): Quest {
  const now = new Date().toISOString()
  const row = {
    id: randomUUID(),
    title: assertTitle(input.title),
    description: input.description ?? null,
    type: input.type ?? 'side',
    status: 'todo',
    priority: input.priority ?? 'normal',
    dueAt: input.dueAt ?? null,
    parentId: null,
    sortOrder: 0,
    source: 'user',
    sourceRef: null,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    canceledAt: null,
    deletedAt: null
  } satisfies typeof quests.$inferInsert

  getDb().insert(quests).values(row).run()
  createActivityLog({
    type: 'quest',
    action: 'created',
    entityType: 'quest',
    entityId: row.id,
    title: '新任务已创建',
    detail: row.title,
    source: 'user',
    riskLevel: 'medium'
  })

  return toQuest(row)
}

export function updateQuest(input: UpdateQuestInput): Quest {
  const current = getDb()
    .select()
    .from(quests)
    .where(and(eq(quests.id, input.id), isNull(quests.deletedAt)))
    .get()

  if (!current) throw new Error('任务不存在')

  const now = new Date().toISOString()
  const patch: Partial<typeof quests.$inferInsert> = {
    updatedAt: now
  }

  if (input.title !== undefined) patch.title = assertTitle(input.title)
  if (input.description !== undefined) patch.description = input.description
  if (input.type !== undefined) patch.type = input.type
  if (input.priority !== undefined) patch.priority = input.priority
  if (input.dueAt !== undefined) patch.dueAt = input.dueAt
  if (input.status !== undefined) {
    patch.status = input.status
    patch.completedAt = input.status === 'done' ? now : null
    patch.canceledAt = input.status === 'canceled' ? now : null
  }

  getDb().update(quests).set(patch).where(eq(quests.id, input.id)).run()
  const updated = getDb().select().from(quests).where(eq(quests.id, input.id)).get()
  if (!updated) throw new Error('任务更新失败')

  createActivityLog({
    type: 'quest',
    action: 'updated',
    entityType: 'quest',
    entityId: input.id,
    title: '任务已更新',
    detail: updated.title,
    source: 'user',
    riskLevel: 'medium'
  })

  return toQuest(updated)
}

export function completeQuest(id: string): Quest {
  return updateQuest({ id, status: 'done' })
}

export function reopenQuest(id: string): Quest {
  return updateQuest({ id, status: 'todo' })
}

export function deleteQuest(id: string): void {
  const current = getDb()
    .select()
    .from(quests)
    .where(and(eq(quests.id, id), isNull(quests.deletedAt)))
    .get()

  if (!current) throw new Error('任务不存在')

  getDb().update(quests).set({ deletedAt: new Date().toISOString() }).where(eq(quests.id, id)).run()
  createActivityLog({
    type: 'quest',
    action: 'deleted',
    entityType: 'quest',
    entityId: id,
    title: '任务已删除',
    detail: current.title,
    source: 'user',
    riskLevel: 'high'
  })
}
