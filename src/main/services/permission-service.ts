import { desc } from 'drizzle-orm'
import type {
  ApprovalRecord,
  PermissionCapability,
  PermissionGrant,
  PermissionOverview
} from '../../shared/models/permission'
import { getDb, getSqliteClient } from '../db/client'
import { approvalRecords, permissionGrants } from '../db/schema'

const capabilities: PermissionCapability[] = [
  {
    permission: 'system.dataDirectory.open',
    label: '打开本地数据目录',
    riskLevel: 'medium',
    status: 'allowed',
    description: '仅由宿主在 SYSTEM 页面主动触发。'
  },
  {
    permission: 'system.backup.create',
    label: '创建本地备份',
    riskLevel: 'high',
    status: 'approval-required',
    description: '执行前显示确认，结果写入活动日志。'
  },
  {
    permission: 'agent.readContext',
    label: 'Agent 读取本地上下文',
    riskLevel: 'high',
    status: 'not-granted',
    description: '尚未向 Agent 开放任务、日志或文件内容。'
  },
  {
    permission: 'agent.modifyFiles',
    label: 'Agent 修改文件',
    riskLevel: 'high',
    status: 'not-granted',
    description: '没有可用执行接口，默认拒绝。'
  },
  {
    permission: 'agent.networkAccess',
    label: 'Agent 网络访问',
    riskLevel: 'high',
    status: 'disabled',
    description: 'V0.1 不提供网络授权。'
  },
  {
    permission: 'shell.execute',
    label: 'Shell 命令执行',
    riskLevel: 'danger',
    status: 'disabled',
    description: '危险能力未接入 Renderer 或 Agent。'
  }
]

function parseJson(value: string | null): unknown {
  if (!value) return undefined
  try {
    return JSON.parse(value)
  } catch {
    return undefined
  }
}

function toPermissionGrant(row: typeof permissionGrants.$inferSelect): PermissionGrant {
  return {
    id: row.id,
    subjectType: row.subjectType as PermissionGrant['subjectType'],
    subjectId: row.subjectId,
    permission: row.permission,
    scope: parseJson(row.scopeJson),
    status: row.status as PermissionGrant['status'],
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }
}

function toApprovalRecord(row: typeof approvalRecords.$inferSelect): ApprovalRecord {
  return {
    id: row.id,
    requestType: row.requestType,
    summary: row.summary,
    riskLevel: row.riskLevel as ApprovalRecord['riskLevel'],
    status: row.status as ApprovalRecord['status'],
    subjectType: row.subjectType as ApprovalRecord['subjectType'],
    subjectId: row.subjectId,
    payload: parseJson(row.payloadJson),
    decidedAt: row.decidedAt,
    createdAt: row.createdAt
  }
}

export function getPermissionOverview(): PermissionOverview {
  const grants = getDb()
    .select()
    .from(permissionGrants)
    .orderBy(desc(permissionGrants.createdAt))
    .limit(50)
    .all()
    .map(toPermissionGrant)
  const recentApprovals = getDb()
    .select()
    .from(approvalRecords)
    .orderBy(desc(approvalRecords.createdAt))
    .limit(20)
    .all()
    .map(toApprovalRecord)
  const pendingRow = getSqliteClient()
    .prepare(`SELECT COUNT(*) AS count FROM approval_records WHERE status = 'pending'`)
    .get() as { count: number }

  return {
    capabilities,
    grants,
    recentApprovals,
    pendingApprovalCount: pendingRow.count
  }
}
