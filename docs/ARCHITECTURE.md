# Personal OS 架构文档

> 依据：[`docs/DESIGN.md`](./DESIGN.md)、[`docs/WORK_PLAN.md`](./WORK_PLAN.md)  
> 阶段：VERSION 0.1 — 系统觉醒

## 1. 架构目标

Personal OS V0.1 的架构目标不是一次性实现完整系统，而是建立可持续扩展的本地优先桌面应用底座。

核心目标：

1. **Local First**：宿主数据默认保存在本地。
2. **安全边界清晰**：Renderer 不直接访问 Node、文件系统、数据库或命令执行能力。
3. **类型可追踪**：IPC 输入、输出、错误结构有 TypeScript 类型。
4. **模块可成长**：STATUS、QUEST、JOURNAL、SYSTEM 等模块可以逐步接入真实数据。
5. **Agent Ready**：为后续 Pi / Agent 接入预留权限、日志、审批与审计边界。

## 2. 总体分层

```text
Personal OS
├── Electron Main Process
│   ├── App lifecycle
│   ├── Window / Tray / Native APIs
│   ├── IPC handlers
│   ├── Services
│   ├── SQLite / Drizzle
│   ├── Markdown / File storage
│   └── Backup / Export
│
├── Preload
│   ├── contextBridge
│   ├── window.api
│   └── Typed IPC client
│
├── Renderer / Vue
│   ├── AppShell
│   ├── STATUS
│   ├── QUEST
│   ├── JOURNAL
│   ├── INVENTORY
│   ├── ABILITIES
│   ├── AGENT
│   └── SYSTEM
│
└── Shared Types
    ├── IPC contracts
    ├── API result
    ├── Domain models
    └── Error codes
```

## 3. 进程职责

### 3.1 Main Process

Main 是唯一允许访问本地系统能力的层。

职责：

- 创建和管理 Electron 窗口。
- 初始化应用数据目录。
- 初始化 SQLite 数据库。
- 读写 Markdown 日志文件。
- 处理 IPC 请求。
- 记录活动日志。
- 执行备份和导出。
- 管理托盘、开机启动、单实例、窗口状态与全局快捷键。
- 后续管理 Agent 执行；当前已预留权限、审批与审计数据边界。

禁止：

- 将未受控的 Node 能力直接暴露给 Renderer。
- 让 Renderer 直接传入任意文件路径进行危险读写。
- 在无权限模型的情况下接入命令执行或 Agent 自动操作。

### 3.2 Preload

Preload 是 Main 与 Renderer 之间的最小桥接层。

职责：

- 使用 `contextBridge.exposeInMainWorld` 暴露 `window.api`。
- 将 Renderer 的方法调用映射为受控 IPC。
- 不包含业务逻辑。
- 不暴露 `ipcRenderer` 原始对象。

目标形态：

```ts
window.api.system.getAppInfo()
window.api.system.getDataDirectoryStatus()
window.api.quest.list(input)
window.api.quest.create(input)
window.api.journal.save(input)
window.api.activity.list(input)
```

### 3.3 Renderer

Renderer 是纯 UI 层。

职责：

- 渲染页面和交互。
- 调用 `window.api` 获取或修改数据。
- 处理表单、筛选、弹窗、命令面板。
- 展示统一错误。

禁止：

- 直接访问 Node `fs`、`path`、`child_process`。
- 直接连接 SQLite。
- 直接读取或写入任意本地文件。
- 直接执行 Shell 命令。

### 3.4 Shared Types

Shared 层用于主进程、Preload、Renderer 共享类型。

建议目录：

```text
src/shared/
├── api-result.ts
├── errors.ts
├── ipc.ts
├── models/
│   ├── activity.ts
│   ├── journal.ts
│   ├── quest.ts
│   └── system.ts
└── permissions.ts
```

## 4. 建议目录结构

```text
src/
├── main/
│   ├── index.ts
│   ├── ipc/
│   │   ├── index.ts
│   │   ├── system.ipc.ts
│   │   ├── quest.ipc.ts
│   │   ├── journal.ipc.ts
│   │   ├── activity.ipc.ts
│   │   └── backup.ipc.ts
│   ├── services/
│   │   ├── app-info-service.ts
│   │   ├── data-directory-service.ts
│   │   ├── database-service.ts
│   │   ├── quest-service.ts
│   │   ├── journal-service.ts
│   │   ├── activity-service.ts
│   │   └── backup-service.ts
│   ├── db/
│   │   ├── schema.ts
│   │   ├── migrate.ts
│   │   └── client.ts
│   └── filesystem/
│       ├── journal-files.ts
│       └── safe-path.ts
│
├── preload/
│   ├── index.ts
│   └── api.ts
│
├── renderer/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── router/
│       ├── stores/
│       └── main.ts
│
└── shared/
    ├── api-result.ts
    ├── ipc.ts
    ├── permissions.ts
    └── models/
```

## 5. 数据目录

默认数据目录由 Main 进程初始化。

建议位置：

```text
app.getPath('userData')/PersonalOS/
```

计划结构：

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

V0.1 必须创建：

- `personal.db`
- `journal/`
- `backups/`

后续预留：

- `attachments/`
- `agent-logs/`
- `exports/`

## 6. IPC 设计原则

### 6.1 命名规范

```text
system:get-app-info
system:get-data-directory-status
system:open-data-directory
system:get-desktop-settings
system:set-open-at-login
system:set-global-shortcut-enabled

quest:list
quest:create
quest:update
quest:complete
quest:reopen
quest:delete

journal:list
journal:get
journal:save

activity:list
backup:list
backup:create
permission:get-overview
```

### 6.2 统一返回结构

```ts
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError }

export interface ApiError {
  code: string
  message: string
  detail?: unknown
}
```

Renderer 必须处理 `ok: false` 的情况。

### 6.3 错误分类

```text
VALIDATION_ERROR       输入不合法
NOT_FOUND              目标不存在
CONFLICT               状态冲突
PERMISSION_DENIED      权限不足
DATA_DIR_ERROR         数据目录错误
DATABASE_ERROR         数据库错误
FILE_IO_ERROR          文件读写错误
UNKNOWN_ERROR          未知错误
```

## 7. 服务层职责

### 7.1 System Service

- 获取应用版本。
- 获取数据目录路径。
- 检查数据目录是否存在、可读、可写。
- 打开数据目录。
- 返回启动状态。

### 7.2 Quest Service

- 创建任务。
- 查询任务。
- 更新任务。
- 完成 / 取消完成任务。
- 删除任务。
- 写入活动日志。

### 7.3 Journal Service

- 创建或更新 Markdown 日志文件。
- 保存 SQLite 元数据。
- 读取日志列表。
- 读取日志正文。
- 写入活动日志。

### 7.4 Activity Service

- 写入活动日志。
- 查询最近活动。
- 支持按类型、实体、时间过滤。

### 7.5 Backup Service

- 使用 SQLite 在线备份生成一致性数据库快照。
- 复制 Markdown、Notes 与 Attachments 本地目录。
- 写入备份清单并忽略未完成快照。
- 后续支持受审批保护的恢复。

### 7.6 Permission Service

- 返回能力风险与授权状态。
- 查询持久授权、最近审批与待审批数量。
- V0.1 不向 Renderer 开放授权或审批写入接口。

## 8. Renderer 模块结构

### STATUS

展示：

- 任务统计。
- 日志统计。
- 最近活动。
- 数据目录状态。
- Agent 状态占位。

### QUEST

提供：

- 新建任务。
- 编辑任务。
- 完成 / 取消完成。
- 删除任务。
- 筛选任务。

### JOURNAL

提供：

- 创建今日日志。
- 编辑日志。
- 日志列表。
- 基础搜索预留。

### SYSTEM

提供：

- 查看数据目录。
- 打开数据目录。
- 备份入口。
- 权限状态展示。
- 启动序列设置预留。

## 9. 启动流程

```text
requestSingleInstanceLock()
└── app.whenReady()
    ├── 设置 AppUserModelId
    ├── 初始化数据目录
    ├── 初始化数据库
    ├── 执行迁移
    ├── 注册 IPC handlers
    ├── 创建并恢复主窗口
    ├── 创建系统托盘
    ├── 恢复受控全局快捷键
    └── Renderer 请求启动状态并展示 STATUS
```

失败处理：

- 数据目录不可写：进入受限模式，只显示错误和设置入口。
- 数据库初始化失败：禁止进入 QUEST/JOURNAL 写操作。
- 迁移失败：提示备份并停止写入。

## 10. 安全边界

V0.1 必须满足：

- `contextIsolation: true`。
- Renderer 不暴露 Node。
- `window.api` 是唯一系统能力入口。
- 所有 IPC 输入需要验证。
- 所有文件路径必须限定在数据目录内。
- 删除、重置、恢复等危险操作必须有确认流程。

## 11. 与原型的关系

来自原型的保留项：

- 启动序列。
- 主控台布局。
- 命令面板。
- 任务 CRUD 交互。
- 日志记录交互。
- 活动历史。
- 能力 / Agent 占位。

不直接继承：

- `localStorage` 持久化。
- 单文件 HTML 结构。
- `confirm()` 原生确认。
- Agent 模拟执行逻辑。

## 12. V0.1 架构验收标准

- [x] 应用启动时创建数据目录。
- [x] 应用启动时创建或打开 SQLite 数据库。
- [x] Renderer 只能通过 `window.api` 访问系统能力。
- [x] IPC 返回统一 `ApiResult<T>`。
- [x] STATUS 能读取真实统计数据。
- [x] QUEST 能持久化任务。
- [x] JOURNAL 能保存 Markdown 文件。
- [x] 操作会写入 `activity_logs`。
- [x] `npm run typecheck` 通过。
- [x] `npm run lint` 通过。
