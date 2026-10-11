export type QuestType = 'main' | 'side' | 'daily' | 'dynamic'
export type QuestStatus = 'todo' | 'in_progress' | 'done' | 'canceled'
export type QuestPriority = 'low' | 'normal' | 'high' | 'urgent'
export type QuestSource = 'user' | 'system' | 'agent' | 'import'

export interface Quest {
  id: string
  title: string
  description?: string | null
  type: QuestType
  status: QuestStatus
  priority: QuestPriority
  dueAt?: string | null
  parentId?: string | null
  sortOrder: number
  source: QuestSource
  sourceRef?: string | null
  createdAt: string
  updatedAt: string
  completedAt?: string | null
  canceledAt?: string | null
  deletedAt?: string | null
}

export interface ListQuestsInput {
  status?: QuestStatus | 'all' | 'open'
  limit?: number
}

export interface CreateQuestInput {
  title: string
  description?: string | null
  type?: QuestType
  priority?: QuestPriority
  dueAt?: string | null
}

export interface UpdateQuestInput {
  id: string
  title?: string
  description?: string | null
  type?: QuestType
  status?: QuestStatus
  priority?: QuestPriority
  dueAt?: string | null
}
