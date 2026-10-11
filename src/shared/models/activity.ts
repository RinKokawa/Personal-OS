export type ActivityRiskLevel = 'low' | 'medium' | 'high' | 'danger'
export type ActivitySource = 'user' | 'system' | 'agent' | 'plugin' | 'automation'

export interface ActivityLog {
  id: string
  type: string
  action: string
  entityType?: string | null
  entityId?: string | null
  title: string
  detail?: string | null
  source: ActivitySource
  riskLevel: ActivityRiskLevel
  metadata?: unknown
  createdAt: string
}

export interface ListActivityLogsInput {
  limit?: number
}

export interface CreateActivityLogInput {
  type: string
  action: string
  entityType?: string | null
  entityId?: string | null
  title: string
  detail?: string | null
  source?: ActivitySource
  riskLevel?: ActivityRiskLevel
  metadata?: unknown
}
