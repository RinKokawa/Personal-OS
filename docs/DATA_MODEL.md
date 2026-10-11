# Personal OS 数据模型文档

> 依据：[`docs/DESIGN.md`](./DESIGN.md)、[`docs/ARCHITECTURE.md`](./ARCHITECTURE.md)  
> 阶段：VERSION 0.1 — 系统觉醒

## 1. 数据设计原则

1. **Local First**：核心数据默认保存在本地 SQLite 与 Markdown 文件中。
2. **开放可迁移**：日志正文使用 Markdown，避免被数据库锁死。
3. **元数据结构化**：任务、日志索引、标签、关联关系、活动记录使用 SQLite。
4. **可审计**：重要操作写入 `activity_logs`。
5. **可扩展**：为 Agent、权限、资源、技能、插件预留字段和关联表。
6. **不伪造事实**：技能等级、AI 推测、动态任务等必须可区分来源和置信度。

## 2. 存储布局

```text
PersonalOS/
├── personal.db
├── journal/
│   └── YYYY/
│       └── YYYY-MM-DD.md
├── notes/
├── attachments/
├── agent-logs/
├── exports/
└── backups/
```

V0.1 必需：

- `personal.db`
- `journal/`
- `backups/`

## 3. ID 与时间规范

### 3.1 ID

建议使用字符串 ID。

可选方案：

- `crypto.randomUUID()`
- 后续如需排序友好，可切换为 ULID

### 3.2 时间

SQLite 中统一保存 ISO 8601 字符串：

```text
2026-10-11T06:30:00.000Z
```

显示时由 Renderer 按本地时区格式化。

### 3.3 软删除

V0.1 可先使用硬删除，但建议关键表预留：

```text
deleted_at TEXT NULL
```

尤其是后续 Agent、审计、资源等模块不应轻易物理删除。

## 4. 表结构总览

V0.1 初始表：

| 表名                | 说明                | 优先级 |
| ------------------- | ------------------- | ------ |
| `app_settings`      | 应用设置            | P0     |
| `activity_logs`     | 活动日志 / 事件历史 | P0     |
| `quests`            | 任务系统            | P0     |
| `journal_entries`   | 日志元数据          | P0     |
| `resources`         | 资源 / 物品栏预留   | P2     |
| `tags`              | 标签                | P1     |
| `entity_tags`       | 实体与标签关联      | P1     |
| `entity_links`      | 实体互相关联        | P1     |
| `permission_grants` | 权限授权记录预留    | P2     |
| `approval_records`  | 审批记录预留        | P2     |

V0.1 可以先实现 P0 表，但迁移设计应考虑后续表。

## 5. `app_settings`

用于保存应用设置和用户偏好。

```sql
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  value_type TEXT NOT NULL DEFAULT 'string',
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

示例：

| key                    | value    | value_type | 说明             |
| ---------------------- | -------- | ---------- | ---------------- |
| `ui.accent`            | `cyan`   | `string`   | 强调色           |
| `ui.motion.enabled`    | `true`   | `boolean`  | 是否启用动效     |
| `boot.showOnStart`     | `true`   | `boolean`  | 是否显示启动序列 |
| `data.version`         | `1`      | `number`   | 数据模型版本     |
| `system.initializedAt` | ISO 时间 | `string`   | 首次初始化时间   |

## 6. `activity_logs`

活动日志是 Personal OS 的事件流，承接任务、日志、系统初始化、备份、Agent 等操作记录。

```sql
CREATE TABLE activity_logs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  title TEXT NOT NULL,
  detail TEXT,
  source TEXT NOT NULL DEFAULT 'system',
  risk_level TEXT NOT NULL DEFAULT 'low',
  metadata_json TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_type ON activity_logs(type);
```

字段说明：

| 字段            | 说明                                                            |
| --------------- | --------------------------------------------------------------- |
| `type`          | `system` / `quest` / `journal` / `agent` / `backup`             |
| `action`        | `created` / `updated` / `completed` / `deleted` / `exported` 等 |
| `entity_type`   | 关联实体类型，例如 `quest`、`journal_entry`                     |
| `entity_id`     | 关联实体 ID                                                     |
| `source`        | `user` / `system` / `agent`                                     |
| `risk_level`    | `low` / `medium` / `high` / `danger`                            |
| `metadata_json` | 扩展信息，JSON 字符串                                           |

示例事件：

```json
{
  "type": "quest",
  "action": "completed",
  "entityType": "quest",
  "title": "任务已完成",
  "source": "user",
  "riskLevel": "low"
}
```

## 7. `quests`

任务系统核心表。

```sql
CREATE TABLE quests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'side',
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'normal',
  due_at TEXT,
  parent_id TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'user',
  source_ref TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  canceled_at TEXT,
  deleted_at TEXT
);

CREATE INDEX idx_quests_status ON quests(status);
CREATE INDEX idx_quests_type ON quests(type);
CREATE INDEX idx_quests_due_at ON quests(due_at);
CREATE INDEX idx_quests_parent_id ON quests(parent_id);
```

### 7.1 `type`

```text
main      主线任务
side      支线任务
daily     每日任务
dynamic   AI / 系统建议任务
```

### 7.2 `status`

```text
todo          待处理
in_progress   进行中
done          已完成
canceled      已取消
```

### 7.3 `priority`

```text
low
normal
high
urgent
```

### 7.4 `source`

```text
user      用户创建
system    系统生成
agent     Agent 建议
import    导入
```

### 7.5 TypeScript 类型

```ts
export interface Quest {
  id: string
  title: string
  description?: string | null
  type: 'main' | 'side' | 'daily' | 'dynamic'
  status: 'todo' | 'in_progress' | 'done' | 'canceled'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  dueAt?: string | null
  parentId?: string | null
  sortOrder: number
  source: 'user' | 'system' | 'agent' | 'import'
  sourceRef?: string | null
  createdAt: string
  updatedAt: string
  completedAt?: string | null
  canceledAt?: string | null
  deletedAt?: string | null
}
```

## 8. `journal_entries`

日志元数据表。正文保存在 Markdown 文件中。

```sql
CREATE TABLE journal_entries (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  entry_date TEXT NOT NULL,
  file_path TEXT NOT NULL,
  excerpt TEXT,
  word_count INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'user',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE INDEX idx_journal_entries_entry_date ON journal_entries(entry_date);
CREATE UNIQUE INDEX idx_journal_entries_file_path ON journal_entries(file_path);
```

字段说明：

| 字段         | 说明                                   |
| ------------ | -------------------------------------- |
| `entry_date` | 日志所属日期，例如 `2026-10-11`        |
| `file_path`  | 相对数据目录的 Markdown 路径           |
| `excerpt`    | 正文摘要，用于列表展示                 |
| `word_count` | 字数统计                               |
| `source`     | `user` / `system` / `agent` / `import` |

Markdown 文件示例：

```md
# 2026-10-11

今天完成了 Personal OS 的原型拆解。

## 决策

- 日志正文使用 Markdown 文件保存。
- SQLite 只保存元数据。
```

TypeScript：

```ts
export interface JournalEntry {
  id: string
  title: string
  entryDate: string
  filePath: string
  excerpt?: string | null
  wordCount: number
  source: 'user' | 'system' | 'agent' | 'import'
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}
```

## 9. `resources`

INVENTORY 资源索引预留表。

```sql
CREATE TABLE resources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  uri TEXT NOT NULL,
  description TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE INDEX idx_resources_type ON resources(type);
```

类型预留：

```text
file
folder
project
repository
url
tool
note
other
```

V0.1 可暂不实现 UI，但保留设计。

## 10. 标签模型

### 10.1 `tags`

```sql
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### 10.2 `entity_tags`

```sql
CREATE TABLE entity_tags (
  id TEXT PRIMARY KEY,
  tag_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(tag_id, entity_type, entity_id)
);

CREATE INDEX idx_entity_tags_entity ON entity_tags(entity_type, entity_id);
```

支持任务、日志、资源共用标签。

## 11. 实体关联 `entity_links`

用于连接任务、日志、资源、Agent 记录等实体。

```sql
CREATE TABLE entity_links (
  id TEXT PRIMARY KEY,
  from_type TEXT NOT NULL,
  from_id TEXT NOT NULL,
  to_type TEXT NOT NULL,
  to_id TEXT NOT NULL,
  relation TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(from_type, from_id, to_type, to_id, relation)
);

CREATE INDEX idx_entity_links_from ON entity_links(from_type, from_id);
CREATE INDEX idx_entity_links_to ON entity_links(to_type, to_id);
```

关系类型示例：

```text
mentions
blocks
supports
generated_from
related_to
created_by_agent
```

## 12. 权限与审批预留

权限模型详见 [`docs/PERMISSION_MODEL.md`](./PERMISSION_MODEL.md)。

### 12.1 `permission_grants`

```sql
CREATE TABLE permission_grants (
  id TEXT PRIMARY KEY,
  subject_type TEXT NOT NULL,
  subject_id TEXT,
  permission TEXT NOT NULL,
  scope_json TEXT,
  status TEXT NOT NULL,
  expires_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### 12.2 `approval_records`

```sql
CREATE TABLE approval_records (
  id TEXT PRIMARY KEY,
  request_type TEXT NOT NULL,
  summary TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  status TEXT NOT NULL,
  subject_type TEXT,
  subject_id TEXT,
  payload_json TEXT,
  decided_at TEXT,
  created_at TEXT NOT NULL
);
```

V0.1 已建立 `permission_grants` 与 `approval_records` 表及只读状态查询，为后续 Agent 审批流预留；当前不开放 Renderer 创建授权或审批记录。

## 13. 查询需求

### 13.1 STATUS

需要：

- 今日任务总数。
- 未完成任务数。
- 已完成任务数。
- 日志数量。
- 最近活动。
- 数据目录状态。

### 13.2 QUEST

需要：

- 按状态筛选。
- 按截止时间排序。
- 按创建时间排序。
- 按类型筛选。
- 基础搜索标题。

### 13.3 JOURNAL

需要：

- 按日期倒序。
- 读取单篇正文。
- 保存时更新摘要和字数。
- 后续全文搜索。

### 13.4 ACTIVITY

需要：

- 最近 N 条。
- 按实体查询。
- 按类型查询。

## 14. 迁移策略

建议建立迁移表：

```sql
CREATE TABLE migrations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL
);
```

迁移原则：

1. 每个迁移可重复检测。
2. 迁移前应确保数据目录可写。
3. 危险迁移前应自动备份。
4. 迁移失败必须阻止继续写入。

## 15. V0.1 最小实现顺序

1. `app_settings`
2. `activity_logs`
3. `quests`
4. `journal_entries`
5. Markdown 文件保存
6. `tags` / `entity_tags` 可延后
7. `entity_links` 可延后
8. 权限与审批表可先建文档，后续实现

## 16. 数据模型验收标准

- [ ] 首次启动创建 `personal.db`。
- [ ] 首次启动创建 `journal/` 和 `backups/`。
- [ ] 可写入一条 `activity_logs`。
- [ ] 可创建、更新、完成、删除任务。
- [ ] 可保存日志元数据。
- [ ] 可保存 Markdown 正文。
- [ ] 重启后任务和日志仍存在。
- [ ] STATUS 统计来自真实数据。
