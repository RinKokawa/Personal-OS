# Personal OS 权限模型文档

> 依据：[`docs/DESIGN.md`](./DESIGN.md)、[`docs/ARCHITECTURE.md`](./ARCHITECTURE.md)、[`docs/DATA_MODEL.md`](./DATA_MODEL.md)  
> 阶段：VERSION 0.1 — 先定义边界，后实现 Agent 与自动化能力

## 1. 权限模型目标

Personal OS 的权限模型用于确保：

1. 宿主始终拥有最终决定权。
2. Renderer 不能绕过 Main 访问本地系统能力。
3. Agent、自动化、脚本、插件不得默认拥有高风险能力。
4. 文件、网络、命令执行、数据删除等操作必须按风险等级审批。
5. 所有重要操作都有活动日志，后续高风险操作还应有审批记录。

## 2. 核心原则

### 2.1 默认拒绝

除基础 UI 查询外，所有系统能力默认拒绝。

尤其是：

- 文件写入
- 任意路径读取
- 网络请求
- Shell 命令
- 批量修改
- 删除数据
- Agent 自动执行

### 2.2 最小授权

授权必须尽可能缩小范围。

示例：

```text
允许：读取 PersonalOS/journal/2026/ 下的 Markdown 文件
不允许：读取整个 C:\Users 目录
```

### 2.3 明确来源

每次操作应区分来源：

```text
user      用户主动操作
system    系统内部操作
agent     Agent 建议或执行
plugin    插件执行
automation 自动化规则执行
```

### 2.4 可撤销

长期授权必须可以撤销。

### 2.5 可审计

重要操作必须写入：

- `activity_logs`
- 后续高风险操作写入 `approval_records`

## 3. 权限主体

权限主体表示「谁」在请求能力。

```text
renderer       UI 层
system         Personal OS 内核
user           用户手动操作
agent          Agent / Pi / AI 执行器
plugin         插件或能力模块
automation     自动化规则
```

V0.1 只需要：

- `user`
- `system`
- `renderer`

V0.4 前必须补充：

- `agent`
- `plugin`
- `automation`

## 4. 权限命名

建议使用点分命名。

### 4.1 系统

```text
system.info.read
system.settings.read
system.settings.write
system.dataDirectory.read
system.dataDirectory.open
system.backup.create
system.backup.restore
system.reset
```

### 4.2 数据库

```text
database.read
database.write
database.delete
database.migrate
```

### 4.3 文件系统

```text
filesystem.read
filesystem.write
filesystem.delete
filesystem.openExternal
filesystem.export
filesystem.import
```

### 4.4 任务与日志

```text
quest.read
quest.write
quest.delete
journal.read
journal.write
journal.delete
activity.read
activity.write
```

### 4.5 网络

```text
network.request
network.download
network.upload
```

### 4.6 命令与进程

```text
process.spawn
process.kill
shell.execute
```

### 4.7 Agent

```text
agent.suggest
agent.readContext
agent.writeContext
agent.executeTool
agent.executeCommand
agent.modifyFiles
agent.networkAccess
```

## 5. 风险等级

所有受控操作都应映射到风险等级。

```text
low       低风险
medium    中风险
high      高风险
danger    危险
```

### 5.1 Low

无需弹出强确认，但应通过受控 API 执行。

示例：

- 读取应用版本。
- 读取任务列表。
- 读取日志元数据。
- 打开 STATUS 页面。
- 写入普通活动日志。

### 5.2 Medium

需要用户明确操作触发，可记录活动日志。

示例：

- 创建任务。
- 编辑任务。
- 完成任务。
- 创建日志。
- 更新日志。
- 修改 UI 设置。
- 打开数据目录。

### 5.3 High

需要确认弹窗，并写入活动日志。后续应写入审批记录。

示例：

- 删除任务。
- 删除日志。
- 导出全部数据。
- 导入数据。
- 备份恢复。
- 修改数据目录位置。
- Agent 修改文件。

### 5.4 Danger

必须二次确认。Agent / 自动化默认禁止。

示例：

- 清空全部数据。
- 删除数据目录。
- 覆盖数据库。
- 执行 Shell 命令。
- 批量修改文件。
- 上传本地日志或数据库到网络。
- Agent 无监督执行命令。

## 6. 操作矩阵

| 操作             | 权限                        | 风险   | V0.1 行为             |
| ---------------- | --------------------------- | ------ | --------------------- |
| 读取应用信息     | `system.info.read`          | low    | 允许                  |
| 读取数据目录状态 | `system.dataDirectory.read` | low    | 允许                  |
| 打开数据目录     | `system.dataDirectory.open` | medium | 用户点击触发          |
| 创建任务         | `quest.write`               | medium | 用户点击触发          |
| 完成任务         | `quest.write`               | medium | 用户点击触发          |
| 删除任务         | `quest.delete`              | high   | 确认后执行            |
| 创建日志         | `journal.write`             | medium | 用户点击触发          |
| 删除日志         | `journal.delete`            | high   | 确认后执行            |
| 写入活动日志     | `activity.write`            | low    | 系统内部允许          |
| 导出备份         | `system.backup.create`      | high   | 确认后执行            |
| 恢复备份         | `system.backup.restore`     | danger | V0.1 暂不实现         |
| 重置全部数据     | `system.reset`              | danger | V0.1 暂不实现或强确认 |
| 网络请求         | `network.request`           | high   | 默认禁用              |
| Shell 命令       | `shell.execute`             | danger | 默认禁用              |
| Agent 执行工具   | `agent.executeTool`         | high   | V0.1 不实现           |

## 7. Renderer 权限边界

Renderer 本身不拥有真实系统权限。

Renderer 只能：

- 通过 `window.api` 调用受控能力。
- 接收 `ApiResult<T>`。
- 展示确认弹窗。
- 展示错误。

Renderer 不能：

- 访问 `fs`。
- 访问 `child_process`。
- 访问 SQLite。
- 持有未封装的 `ipcRenderer`。
- 拼接任意文件路径要求 Main 执行危险操作。

## 8. 文件系统权限

### 8.1 数据目录内访问

V0.1 允许 Main 访问 Personal OS 数据目录：

```text
PersonalOS/
├── personal.db
├── journal/
└── backups/
```

### 8.2 路径限制

所有文件操作必须经过路径检查：

1. 解析为绝对路径。
2. 确认路径位于 Personal OS 数据目录内。
3. 禁止 `..` 越界。
4. 禁止跟随危险软链接访问数据目录外部位置。

### 8.3 用户选择路径

如果未来支持用户选择外部文件或目录，必须通过系统文件选择器，并记录授权范围。

## 9. 网络权限

V0.1 默认不需要网络权限。

未来如需：

- 模型 API
- 插件市场
- 远程同步
- 外部网页抓取

必须满足：

1. 明确告知将发送什么数据。
2. 明确目标服务。
3. 提供取消能力。
4. 写入活动日志。
5. 敏感数据外发需要 high 或 danger 审批。

## 10. Agent 权限边界

Agent 是最高风险模块之一。

### 10.1 默认状态

```text
文件读取：禁止
文件写入：禁止
网络访问：禁止
Shell 命令：禁止
数据库写入：禁止
```

### 10.2 允许的低风险能力

在用户明确打开 AGENT 模块后，可允许：

- 读取当前任务标题摘要。
- 基于用户输入生成建议。
- 生成但不执行计划。
- 将建议以草稿形式呈现给用户。

### 10.3 高风险能力

必须审批：

- 修改任务。
- 修改日志。
- 创建文件。
- 修改文件。
- 读取指定目录。
- 发起网络请求。
- 调用外部工具。

### 10.4 危险能力

默认禁止，除非后续有非常明确的安全沙箱和审批机制：

- 执行 Shell 命令。
- 批量删除文件。
- 覆盖数据库。
- 上传数据目录。
- 无人值守自动操作。

## 11. 审批模型

高风险与危险操作应生成审批请求。

```ts
export interface ApprovalRequest {
  id: string
  requestType: string
  summary: string
  riskLevel: 'high' | 'danger'
  subjectType: 'agent' | 'plugin' | 'automation' | 'system'
  subjectId?: string
  payload: unknown
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  createdAt: string
  decidedAt?: string
}
```

审批 UI 必须显示：

- 谁请求操作。
- 要做什么。
- 影响哪些文件、数据或网络目标。
- 风险等级。
- 执行后是否可撤销。

## 12. 活动日志与审计

### 12.1 普通活动日志

所有 medium 及以上操作建议写入 `activity_logs`。

### 12.2 审批记录

high / danger 操作后续写入 `approval_records`。

### 12.3 Agent 执行日志

未来 Agent 执行应额外写入：

```text
PersonalOS/agent-logs/
└── YYYY-MM-DD/
    └── session-id.log
```

包括：

- 输入摘要。
- 工具调用。
- 权限请求。
- 用户审批结果。
- 执行结果。

## 13. UI 表达规范

权限状态必须清楚显示，不能隐藏在实现细节中。

建议状态文本：

```text
LOCAL ONLY
NOT GRANTED
READ ONLY
APPROVAL REQUIRED
DISABLED
DANGER ZONE
```

AGENT 页面必须显示：

- 文件权限状态。
- 网络权限状态。
- 命令执行状态。
- 当前运行任务数量。
- 最近审批状态。

SYSTEM 页面必须显示：

- 数据目录位置。
- 数据库状态。
- 备份状态。
- 危险操作区域。

## 14. V0.1 实现范围

V0.1 必须实现：

- [x] Renderer 只能通过 `window.api` 访问系统能力。
- [x] Main 限制文件操作在数据目录内。
- [x] 删除任务前确认。
- [ ] 删除日志前确认（V0.1 尚未开放日志删除能力）。
- [x] 导出备份前确认。
- [x] 所有任务、日志、备份操作写入活动日志。
- [x] AGENT 页面显示 `NOT GRANTED` / `PLANNED` 状态。

V0.1 暂不实现：

- [ ] Agent 真实执行。
- [ ] 网络请求授权。
- [ ] Shell 命令执行。
- [ ] 插件权限系统。
- [ ] 复杂审批队列。

## 15. 后续版本要求

### V0.2

- 权限状态在 SYSTEM 中可查看。
- 数据导出 / 备份权限完善。

### V0.3

- ABILITIES 模块引入工具注册时，每个工具必须声明权限。

### V0.4

- Agent 接入前必须实现审批记录。
- Agent 每次工具调用必须经过权限检查。
- Agent 执行日志必须持久化。

### V0.5

- 自动化规则必须支持开关、范围、审批等级和回滚策略。

## 16. 权限模型验收标准

- [x] 文档明确区分 low / medium / high / danger。
- [x] 文档明确哪些操作必须审批。
- [x] Renderer 不直接拥有系统权限。
- [x] 文件操作限制在数据目录内。
- [x] Agent 默认无文件、网络、命令权限。
- [x] 高风险操作有确认流程设计。
- [x] 数据模型预留审批与授权记录。
