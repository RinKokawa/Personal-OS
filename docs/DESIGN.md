# Personal OS 设计文档

> 参考原型：[`docs/personal-os-prototype.html`](./personal-os-prototype.html)  
> 当前用途：将单文件交互原型拆解为可落地的产品交互、模块结构、数据需求与工程实现清单。

## 1. 原型定位

`personal-os-prototype.html` 是一个 **PRE-ALPHA 交互概念原型**，它使用浏览器 `localStorage` 模拟 Personal OS 的桌面运行环境。

原型已经表达出以下核心方向：

1. Personal OS 应具备强烈的「系统启动 / 主控台 / 模块化能力」体验。
2. 核心使用闭环是：
   - 查看状态
   - 创建任务
   - 完成任务
   - 记录日志
   - 查看事件历史
   - 管理能力模块
3. 数据优先保存在本地。
4. Agent 与自动化能力必须默认受限，并需要权限边界。
5. UI 不只是普通管理软件，而是面向个人成长和执行的「系统界面」。

## 2. 信息架构拆解

原型包含 7 个主视图：

| 原型视图 | 当前产品模块 | 说明 | V0.1 优先级 |
| --- | --- | --- | --- |
| `dashboard` / 系统主控台 | `STATUS` | 系统总览、今日状态、任务进度、最近事件 | P0 |
| `quests` / 任务系统 | `QUEST` | 任务列表、筛选、完成、删除、新建任务 | P0 |
| `journal` / 系统日志 | `JOURNAL` | 新建日志、日志列表、本地保存 | P0 |
| `abilities` / 能力中心 | `ABILITIES` | 模块卡片、启用/禁用状态、SDK 概念 | P2 |
| `agents` / 辅助智能 | `AGENT` | Agent 状态、模拟终端、权限提示 | P2 |
| `history` / 历史记录 | 可归入 `STATUS` / `SYSTEM` | 本地事件时间轴 | P1 |
| `settings` / 系统设置 | `SYSTEM` | 主题、动效、重播启动、导出、重置 | P1 |

当前 Electron/Vue 项目已有模块命名：

- `STATUS`
- `QUEST`
- `JOURNAL`
- `INVENTORY`
- `ABILITIES`
- `AGENT`
- `SYSTEM`

原型中的 `history` 不建议单独作为顶级模块，V0.1 可先作为 `STATUS` 的最近活动和 `SYSTEM` 的审计日志入口。

## 3. 主要交互拆解

### 3.1 启动序列 / Boot Sequence

原型行为：

1. 首次显示全屏启动层。
2. 依次推进启动阶段：
   - `INITIALIZING CORE`
   - `VERIFYING MODULES`
   - `ESTABLISHING MEMORY`
   - `CHECKING PERMISSIONS`
   - `RESTORING SESSION`
3. 进度到 100% 后显示「进入系统」。
4. 支持跳过启动序列。
5. 支持在设置中重播启动。
6. 如果系统偏好减少动效，则直接完成启动。

落地建议：

- V0.1 可保留为纯前端启动体验，不阻塞真实初始化。
- 真实初始化状态应来自 Main 进程：数据目录、数据库、设置、权限配置。
- 启动过程要允许失败状态，例如数据库初始化失败、数据目录不可写。

V0.1 实现范围：

- [ ] `BootOverlay` 组件
- [ ] `useBootStore` 管理启动阶段
- [ ] 读取 `window.api.system.getStartupStatus()`
- [ ] 支持「跳过启动」与「重播启动」

---

### 3.2 主应用壳 / App Shell

原型结构：

```text
Topbar
├── 品牌 / 版本
├── 面包屑
├── 命令面板入口 Ctrl+K
├── 系统时间
└── 在线状态点

Sidebar
├── SYSTEM CORE
│   ├── 系统总览
│   ├── 任务系统
│   ├── 系统日志
│   └── 能力中心
├── EXTENSIONS
│   ├── 辅助智能
│   ├── 历史记录
│   └── 系统设置
└── 用户信息

Main
└── 当前页面内容

Statusbar
├── CORE ONLINE
├── DATA: BROWSER-LOCAL / 后续应变为 DATA: LOCAL SQLITE
├── WORKSPACE: LOCAL
├── MODULES 03/06
└── 版本号
```

落地建议：

- 当前项目已有 `AppShell.vue`，可继续沿用。
- 顶部 `COMMAND` 按钮应改为真正的命令面板入口。
- `NEW LOG` 应跳转到 Journal 快速记录或打开新建日志弹窗。
- 底部状态栏可在 V0.1 增加，用于显示本地数据、IPC、数据库状态。

---

### 3.3 命令面板 / Command Palette

原型行为：

- `Ctrl+K` 打开命令面板。
- 支持关键词过滤。
- 支持方向键选择。
- `Enter` 执行命令。
- `Esc` 关闭。

原型命令：

| 命令 | 行为 |
| --- | --- |
| 返回系统主控台 | 跳转 STATUS |
| 查看任务系统 | 跳转 QUEST |
| 新建每日任务 | 打开新建任务弹窗 |
| 记录系统日志 | 跳转 JOURNAL |
| 打开能力中心 | 跳转 ABILITIES |
| 辅助智能控制台 | 跳转 AGENT |
| 查看历史事件 | 跳转 HISTORY |
| 打开系统设置 | 跳转 SYSTEM |
| 导出本地数据 | 触发导出 |
| 重播系统觉醒 | 显示启动序列 |

V0.1 建议命令：

- `Go: STATUS`
- `Go: QUEST`
- `Go: JOURNAL`
- `Quest: New Quest`
- `Journal: New Entry`
- `System: Open Data Directory`
- `System: Export Backup`
- `System: Reboot UI`

---

### 3.4 STATUS / 系统主控台

原型内容：

1. 欢迎区：日期、宿主状态、系统在线。
2. 指标卡：
   - 已完成任务数 / 总任务数
   - 已加载能力数量
   - 日志数量
   - Agent 进程数量
3. 当前任务队列。
4. 任务进度条。
5. 快速能力入口。
6. 宿主状态。
7. 最近系统事件。

V0.1 应接入真实数据：

| UI 区域 | 数据来源 |
| --- | --- |
| QUESTS COMPLETE | `quests` 表统计 |
| JOURNAL ENTRIES | `journal_entries` 表统计 |
| RECENT ACTIVITY | `activity_logs` 表 |
| DATA 状态 | Main 进程数据目录 / 数据库状态 |
| AGENT 状态 | 先显示 `PLANNED / NOT AUTHORIZED` |

---

### 3.5 QUEST / 任务系统

原型能力：

- 创建任务
- 标记完成 / 取消完成
- 删除任务
- 高优先级标记
- 标签
- 任务筛选：全部、未完成、已完成
- 任务完成进度统计
- 创建 / 完成 / 删除时写入事件流

原型任务结构：

```ts
interface PrototypeTask {
  id: string
  title: string
  high: boolean
  done: boolean
  tag: string
  created: number
}
```

正式模型应扩展为：

```ts
interface Quest {
  id: string
  title: string
  description?: string
  type: 'main' | 'side' | 'daily' | 'dynamic'
  status: 'todo' | 'in_progress' | 'done' | 'canceled'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  dueAt?: string
  tags: string[]
  createdAt: string
  updatedAt: string
  completedAt?: string
}
```

V0.1 最小闭环：

- [ ] 新建任务
- [ ] 编辑任务
- [ ] 完成 / 取消完成
- [ ] 删除任务
- [ ] 筛选任务
- [ ] 写入活动日志
- [ ] 重启应用后数据仍存在

---

### 3.6 JOURNAL / 系统日志

原型能力：

- 输入标题
- 输入正文
- 保存日志
- 展示历史日志列表
- 保存后写入事件流

原型日志结构：

```ts
interface PrototypeJournalEntry {
  title: string
  body: string
  at: number
}
```

正式模型建议：

```ts
interface JournalEntry {
  id: string
  title: string
  date: string
  filePath: string
  excerpt: string
  tags: string[]
  createdAt: string
  updatedAt: string
}
```

正文不建议长期只存在数据库中。V0.1 应采用：

```text
PersonalOS/
├── personal.db
└── journal/
    └── 2026/
        └── 2026-10-11.md
```

SQLite 保存元数据，Markdown 文件保存正文。

V0.1 最小闭环：

- [ ] 创建今日日志
- [ ] 保存 Markdown 正文
- [ ] 列出日志
- [ ] 重新打开后继续编辑
- [ ] 保存活动日志

---

### 3.7 ABILITIES / 能力中心

原型能力：

- 展示模块注册表。
- 启用 / 禁用模块。
- 显示模块状态：`INITIALIZED` / `NOT INSTALLED`。
- 展示未来 SDK 示例。

原型模块：

| ID | 名称 | 对应正式模块 |
| --- | --- | --- |
| `planner` | QUEST MANAGER | QUEST |
| `journal` | MEMORY ARCHIVE | JOURNAL |
| `agent` | AGENT ADAPTER | AGENT |
| `inventory` | INVENTORY | INVENTORY |
| `skills` | SKILL MATRIX | SKILLS |
| `automation` | AUTOMATION | ABILITIES |

V0.1 建议仅作为只读模块状态页，不实现真实插件机制。

V0.3 后再考虑：

- 能力注册表
- 本地脚本注册
- 统一命令调用
- 插件 SDK
- 插件权限声明

---

### 3.8 AGENT / 辅助智能

原型能力：

- 模拟启动 Agent 任务。
- 模拟终端输出。
- 显示文件权限、网络权限、执行进程。
- 明确提示「不会执行真实命令」。

正式系统原则：

1. Agent 默认无文件写入、无网络、无命令执行权限。
2. 任何高风险操作必须有审批记录。
3. Agent 运行日志必须持久化。
4. Agent 与任务、日志、资源之间的关联必须可追踪。

V0.1：仅保留占位状态。

V0.4：再接入 Pi / Agent 执行日志与权限审批。

---

### 3.9 HISTORY / 事件历史

原型事件结构：

```ts
interface PrototypeEvent {
  title: string
  detail: string
  at: number
}
```

正式模型建议：

```ts
interface ActivityLog {
  id: string
  type: string
  action: string
  entityType?: string
  entityId?: string
  title: string
  detail?: string
  riskLevel: 'low' | 'medium' | 'high' | 'danger'
  createdAt: string
}
```

V0.1 事件来源：

- 创建任务
- 更新任务
- 完成任务
- 删除任务
- 创建日志
- 更新日志
- 初始化数据目录
- 数据备份

---

### 3.10 SYSTEM / 系统设置

原型能力：

- 切换强调色：青、琥珀、紫。
- 开关界面动效。
- 重播启动序列。
- 导出演示数据。
- 重置演示数据。

V0.1 设置建议：

| 设置项 | 是否落地 | 说明 |
| --- | --- | --- |
| 主题强调色 | P2 | 可先固定暗色科技风 |
| 减少动效 | P1 | 尊重系统 `prefers-reduced-motion` |
| 重播启动 | P2 | 纯前端体验 |
| 数据目录位置 | P0 | 必须可查看 |
| 打开数据目录 | P0 | 调用 Main 进程 |
| 备份数据 | P1 | 复制数据库与 Markdown |
| 重置数据 | P2 | 危险操作，需要确认 |

## 4. 原型状态与正式数据映射

原型所有数据都保存在一个 localStorage key 中：

```ts
const storeKey = 'personal-os-concept-v1'
```

结构：

```ts
interface PrototypeState {
  tasks: PrototypeTask[]
  entries: PrototypeJournalEntry[]
  modules: string[]
  events: PrototypeEvent[]
  accent: 'cyan' | 'amber' | 'violet'
  motion: boolean
}
```

正式系统应拆分为：

| 原型字段 | 正式位置 |
| --- | --- |
| `tasks` | SQLite `quests` |
| `entries` | SQLite `journal_entries` + Markdown 文件 |
| `modules` | SQLite `app_settings` / 后续模块注册表 |
| `events` | SQLite `activity_logs` |
| `accent` | SQLite `app_settings` |
| `motion` | SQLite `app_settings` |

## 5. 组件拆分建议

建议将原型拆为以下 Vue 组件：

```text
src/renderer/src/components/
├── AppShell.vue
├── BootOverlay.vue
├── CommandPalette.vue
├── StatusBar.vue
├── PageHeader.vue
├── PanelCard.vue
├── MetricCard.vue
├── TaskRow.vue
├── ActivityTimeline.vue
├── ModuleCard.vue
├── AgentTerminal.vue
└── ConfirmDialog.vue
```

页面：

```text
src/renderer/src/pages/
├── DashboardPage.vue       # STATUS
├── TodoPage.vue            # QUEST，后续建议改名 QuestPage.vue
├── JournalPage.vue
├── ProjectsPage.vue        # INVENTORY
├── ToolboxPage.vue         # ABILITIES
├── AgentHubPage.vue        # AGENT
└── SettingsPage.vue        # SYSTEM
```

状态管理：

```text
src/renderer/src/stores/
├── app.ts
├── boot.ts
├── command.ts
├── quest.ts
├── journal.ts
├── activity.ts
└── system.ts
```

## 6. IPC/API 拆分建议

Renderer 不直接访问 Node、文件系统或 SQLite。建议 Preload 暴露：

```ts
window.api.system.getAppInfo()
window.api.system.getDataDirectoryStatus()
window.api.system.openDataDirectory()

window.api.quest.list(input)
window.api.quest.create(input)
window.api.quest.update(input)
window.api.quest.complete(id)
window.api.quest.delete(id)

window.api.journal.list(input)
window.api.journal.get(id)
window.api.journal.save(input)

window.api.activity.list(input)

window.api.backup.export()
```

统一返回结构：

```ts
type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; detail?: unknown } }
```

## 7. V0.1 从原型继承的产品验收标准

V0.1 不要求实现所有视觉细节，但必须实现原型表达出的最小可用系统闭环：

1. 应用可启动并显示主控台。
2. 主控台能显示真实任务统计、日志统计、最近事件。
3. 可创建任务。
4. 可完成任务。
5. 可删除任务。
6. 可记录 Markdown 日志。
7. 任务和日志重启后仍存在。
8. 所有重要操作写入活动历史。
9. 系统设置能显示本地数据目录状态。
10. Renderer 只能通过 `window.api` 访问本地能力。

## 8. 不应从原型直接继承的部分

以下内容只作为概念参考，不应原样照搬：

- `localStorage` 数据持久化：正式版必须使用 SQLite + Markdown 文件。
- 单文件 HTML 结构：正式版应组件化。
- `confirm()` 删除确认：正式版应使用统一确认弹窗。
- 内联 SVG 图标表：正式版可使用图标库或组件。
- 原型中的 Agent 模拟逻辑：正式版需要独立权限模型。
- 原型中的 `history` 顶级导航：V0.1 可合并到 STATUS/SYSTEM。

## 9. 当前实现优先级

建议基于该原型调整最近开发顺序：

1. 建立架构、数据模型、权限模型文档。
2. 建立类型安全 IPC。
3. 建立数据目录与 SQLite。
4. 实现 `activity_logs`，因为任务和日志都依赖它。
5. 实现 QUEST CRUD。
6. 实现 JOURNAL Markdown 保存。
7. STATUS 接入真实数据。
8. 增加命令面板。
9. 增加启动序列与状态栏。
10. 最后再完善 ABILITIES / AGENT 的占位体验。
