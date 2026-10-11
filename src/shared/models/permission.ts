export type PermissionRiskLevel = 'low' | 'medium' | 'high' | 'danger'
export type PermissionSubjectType =
  'user' | 'system' | 'renderer' | 'agent' | 'plugin' | 'automation'
export type PermissionGrantStatus = 'active' | 'revoked' | 'expired'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired'
export type PermissionCapabilityStatus =
  'allowed' | 'approval-required' | 'not-granted' | 'disabled'

export interface PermissionGrant {
  id: string
  subjectType: PermissionSubjectType
  subjectId?: string | null
  permission: string
  scope?: unknown
  status: PermissionGrantStatus
  expiresAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface ApprovalRecord {
  id: string
  requestType: string
  summary: string
  riskLevel: Extract<PermissionRiskLevel, 'high' | 'danger'>
  status: ApprovalStatus
  subjectType?: PermissionSubjectType | null
  subjectId?: string | null
  payload?: unknown
  decidedAt?: string | null
  createdAt: string
}

export interface PermissionCapability {
  permission: string
  label: string
  riskLevel: PermissionRiskLevel
  status: PermissionCapabilityStatus
  description: string
}

export interface PermissionOverview {
  capabilities: PermissionCapability[]
  grants: PermissionGrant[]
  recentApprovals: ApprovalRecord[]
  pendingApprovalCount: number
}
