<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { NButton, NPopconfirm, NSwitch, useMessage } from 'naive-ui'
import PageHeader from '@renderer/components/PageHeader.vue'
import type { BackupSummary } from '../../../shared/models/backup'
import type { PermissionOverview } from '../../../shared/models/permission'
import type { AppInfo, DataDirectoryStatus, DesktopSettings } from '../../../shared/models/system'

const message = useMessage()
const appInfo = ref<AppInfo | null>(null)
const dataDirectory = ref<DataDirectoryStatus | null>(null)
const desktopSettings = ref<DesktopSettings | null>(null)
const backups = ref<BackupSummary[]>([])
const permissionOverview = ref<PermissionOverview | null>(null)
const loading = ref(false)
const creatingBackup = ref(false)
const updatingOpenAtLogin = ref(false)
const updatingGlobalShortcut = ref(false)

const dataStatus = computed(() => {
  if (!dataDirectory.value) return '读取中'
  if (dataDirectory.value.initialized) return '已初始化 / 可读写'
  if (!dataDirectory.value.exists) return '尚未创建'
  return '需要检查权限'
})

const settings = [
  ['系统强调色', '电光青 / CYAN', '更换所有系统状态、边框和交互高亮色。'],
  ['界面动态效果', 'ENABLED', '关闭旋转与过渡动效，适用于减少动态效果偏好。'],
  ['启动序列', 'SESSION ONLY', '重播系统觉醒启动序列。'],
  ['数据备份', 'LOCAL SNAPSHOT', '将数据库与 Markdown 文件保存为可检查的本地快照。']
]

async function loadSystemStatus(): Promise<void> {
  loading.value = true
  try {
    const [
      appInfoResult,
      dataDirectoryResult,
      desktopSettingsResult,
      backupsResult,
      permissionResult
    ] = await Promise.all([
      window.api.system.getAppInfo(),
      window.api.system.getDataDirectoryStatus(),
      window.api.system.getDesktopSettings(),
      window.api.backup.list(),
      window.api.permission.getOverview()
    ])

    if (appInfoResult.ok) {
      appInfo.value = appInfoResult.data
    } else {
      message.error(appInfoResult.error.message)
    }

    if (dataDirectoryResult.ok) {
      dataDirectory.value = dataDirectoryResult.data
    } else {
      message.error(dataDirectoryResult.error.message)
    }

    if (desktopSettingsResult.ok) {
      desktopSettings.value = desktopSettingsResult.data
    } else {
      message.error(desktopSettingsResult.error.message)
    }

    if (backupsResult.ok) {
      backups.value = backupsResult.data
    } else {
      message.error(backupsResult.error.message)
    }

    if (permissionResult.ok) {
      permissionOverview.value = permissionResult.data
    } else {
      message.error(permissionResult.error.message)
    }
  } finally {
    loading.value = false
  }
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / 1024 / 1024).toFixed(1)} MB`
}

async function createBackup(): Promise<void> {
  creatingBackup.value = true
  try {
    const result = await window.api.backup.create()
    if (result.ok) {
      backups.value = [result.data, ...backups.value.filter((item) => item.id !== result.data.id)]
      message.success('本地备份已创建')
    } else {
      message.error(result.error.message)
    }
  } finally {
    creatingBackup.value = false
  }
}

async function updateGlobalShortcut(enabled: boolean): Promise<void> {
  updatingGlobalShortcut.value = true
  try {
    const result = await window.api.system.setGlobalShortcutEnabled(enabled)
    if (result.ok) {
      desktopSettings.value = result.data
      message.success(enabled ? '全局唤醒快捷键已启用' : '全局唤醒快捷键已关闭')
    } else {
      message.error(result.error.message)
    }
  } finally {
    updatingGlobalShortcut.value = false
  }
}

async function updateOpenAtLogin(enabled: boolean): Promise<void> {
  updatingOpenAtLogin.value = true
  try {
    const result = await window.api.system.setOpenAtLogin(enabled)
    if (result.ok) {
      desktopSettings.value = result.data
      message.success(enabled ? '开机启动已启用' : '开机启动已关闭')
    } else {
      message.error(result.error.message)
    }
  } finally {
    updatingOpenAtLogin.value = false
  }
}

async function openDataDirectory(): Promise<void> {
  const result = await window.api.system.openDataDirectory()

  if (result.ok) {
    message.success('数据目录已打开')
    await loadSystemStatus()
  } else {
    message.error(result.error.message)
  }
}

onMounted(loadSystemStatus)
</script>

<template>
  <PageHeader
    eyebrow="SYSTEM / 07 — SYSTEM SETTINGS"
    title="系统核心"
    description="本地优先、模块化、权限可控。核心数据默认保存在本地设备中，并提供备份、恢复和导出机制。"
  />

  <div class="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
    <section class="border border-cyan-200/10 bg-[#101923]/80 p-6">
      <div class="label-line">SYSTEM STATUS</div>
      <h3 class="mt-2 text-base font-semibold text-white">运行状态</h3>
      <div class="mt-6 space-y-3 text-sm">
        <div class="flex justify-between border-t border-cyan-200/10 pt-3">
          <span class="text-slate-400">SYSTEM</span
          ><span class="font-mono text-cyan-200">{{ appInfo?.name ?? 'PERSONAL OS' }}</span>
        </div>
        <div class="flex justify-between border-t border-cyan-200/10 pt-3">
          <span class="text-slate-400">VERSION</span
          ><span class="font-mono text-slate-300">{{ appInfo?.version ?? 'UNKNOWN' }}</span>
        </div>
        <div class="flex justify-between border-t border-cyan-200/10 pt-3">
          <span class="text-slate-400">MODE</span
          ><span class="font-mono text-slate-300">{{ appInfo?.mode ?? 'LOCAL FIRST' }}</span>
        </div>
        <div class="flex justify-between border-t border-cyan-200/10 pt-3">
          <span class="text-slate-400">PLATFORM</span
          ><span class="font-mono text-slate-300">{{ appInfo?.platform ?? 'UNKNOWN' }}</span>
        </div>
      </div>
    </section>

    <section class="border border-cyan-200/10 bg-[#101923]/80 p-6">
      <div class="mb-5 flex items-center justify-between">
        <div>
          <div class="label-line">LOCAL DATA</div>
          <h3 class="mt-2 text-base font-semibold text-white">本地数据</h3>
        </div>
        <span
          class="border border-cyan-200/25 px-2 py-1 font-mono text-[9px] tracking-[0.16em] text-cyan-200"
          >{{ dataStatus }}</span
        >
      </div>

      <div class="space-y-3 text-sm">
        <div class="border-t border-cyan-200/10 pt-3">
          <div class="text-slate-500">根目录</div>
          <div class="mt-1 break-all font-mono text-slate-300">
            {{ dataDirectory?.path ?? '读取中' }}
          </div>
        </div>
        <div class="border-t border-cyan-200/10 pt-3">
          <div class="text-slate-500">Journal</div>
          <div class="mt-1 break-all font-mono text-slate-300">
            {{ dataDirectory?.directories.journal ?? '读取中' }}
          </div>
        </div>
        <div class="border-t border-cyan-200/10 pt-3">
          <div class="text-slate-500">Backups</div>
          <div class="mt-1 break-all font-mono text-slate-300">
            {{ dataDirectory?.directories.backups ?? '读取中' }}
          </div>
        </div>
      </div>

      <div class="mt-5 flex flex-wrap gap-3">
        <NPopconfirm positive-text="确认备份" negative-text="取消" @positive-click="createBackup">
          <template #trigger>
            <NButton type="primary" :loading="creatingBackup">立即备份</NButton>
          </template>
          将创建数据库与 Markdown 本地快照。是否继续？
        </NPopconfirm>
        <NButton secondary :loading="loading" @click="openDataDirectory">打开数据目录</NButton>
        <NButton secondary :loading="loading" @click="loadSystemStatus">刷新状态</NButton>
      </div>

      <div class="mt-5 border-t border-cyan-200/10 pt-4">
        <div class="font-mono text-[10px] tracking-[0.14em] text-slate-500">LATEST BACKUP</div>
        <div v-if="backups[0]" class="mt-2 text-xs text-slate-300">
          <div>{{ new Date(backups[0].createdAt).toLocaleString('zh-CN') }}</div>
          <div class="mt-1 break-all font-mono text-[10px] text-slate-500">
            {{ backups[0].fileCount }} FILES / {{ formatBytes(backups[0].totalBytes) }} /
            {{ backups[0].path }}
          </div>
        </div>
        <div v-else class="mt-2 text-xs text-slate-500">尚未创建本地备份。</div>
      </div>
    </section>
  </div>

  <section class="mt-4 border border-cyan-200/10 bg-[#101923]/80 p-6">
    <div class="label-line">DESKTOP NATIVE</div>
    <h3 class="mt-2 text-base font-semibold text-white">桌面运行协议</h3>
    <div class="mt-5 divide-y divide-cyan-200/10">
      <div class="flex items-center justify-between gap-6 py-4">
        <div>
          <div class="text-sm font-semibold text-slate-200">关闭到系统托盘</div>
          <div class="mt-1 text-xs text-slate-500">
            关闭主窗口后保持本地系统待机，可从托盘重新显示或彻底退出。
          </div>
        </div>
        <span class="font-mono text-[10px] tracking-[0.16em] text-cyan-200">
          {{ desktopSettings?.closeToTray ? 'ENABLED' : 'DISABLED' }}
        </span>
      </div>
      <div class="flex items-center justify-between gap-6 py-4">
        <div>
          <div class="text-sm font-semibold text-slate-200">开机启动</div>
          <div class="mt-1 text-xs text-slate-500">
            {{
              desktopSettings?.openAtLoginAvailable
                ? '登录当前系统用户后自动启动 Personal OS。'
                : '仅可在打包后的 Windows 或 macOS 应用中设置。'
            }}
          </div>
        </div>
        <NSwitch
          :value="desktopSettings?.openAtLogin ?? false"
          :disabled="!desktopSettings?.openAtLoginAvailable"
          :loading="updatingOpenAtLogin"
          @update:value="updateOpenAtLogin"
        />
      </div>
      <div class="flex items-center justify-between gap-6 py-4">
        <div>
          <div class="text-sm font-semibold text-slate-200">全局唤醒快捷键</div>
          <div class="mt-1 text-xs text-slate-500">
            {{ desktopSettings?.globalShortcutAccelerator ?? 'CommandOrControl+Shift+Space' }}
            ·
            {{
              desktopSettings?.globalShortcutRegistered
                ? '已注册，可从后台唤醒系统。'
                : '默认关闭；若快捷键被占用，系统不会覆盖其他应用。'
            }}
          </div>
        </div>
        <NSwitch
          :value="desktopSettings?.globalShortcutEnabled ?? false"
          :loading="updatingGlobalShortcut"
          @update:value="updateGlobalShortcut"
        />
      </div>
    </div>
  </section>

  <section class="mt-4 border border-cyan-200/10 bg-[#101923]/80 p-6">
    <div class="mb-5 flex items-center justify-between">
      <div>
        <div class="label-line">PERMISSION BOUNDARY</div>
        <h3 class="mt-2 text-base font-semibold text-white">权限与审批状态</h3>
      </div>
      <span class="font-mono text-[10px] tracking-[0.14em] text-amber-200">
        {{ permissionOverview?.pendingApprovalCount ?? 0 }} PENDING
      </span>
    </div>

    <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      <div
        v-for="capability in permissionOverview?.capabilities ?? []"
        :key="capability.permission"
        class="border border-cyan-200/10 bg-[#0b141c] p-4"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="text-sm font-semibold text-slate-200">{{ capability.label }}</div>
          <span
            class="shrink-0 font-mono text-[9px] tracking-[0.12em]"
            :class="{
              'text-cyan-200': capability.status === 'allowed',
              'text-amber-200': capability.status === 'approval-required',
              'text-slate-500': capability.status === 'not-granted',
              'text-red-300': capability.status === 'disabled'
            }"
          >
            {{ capability.status.toUpperCase() }}
          </span>
        </div>
        <div class="mt-2 font-mono text-[9px] text-slate-600">
          {{ capability.permission }} / {{ capability.riskLevel.toUpperCase() }}
        </div>
        <p class="mt-3 text-xs leading-5 text-slate-500">{{ capability.description }}</p>
      </div>
    </div>

    <div class="mt-5 border-t border-cyan-200/10 pt-4 text-xs text-slate-500">
      持久授权 {{ permissionOverview?.grants.length ?? 0 }} 条；最近审批记录
      {{ permissionOverview?.recentApprovals.length ?? 0 }} 条。Renderer
      无权直接创建授权或审批记录。
    </div>
  </section>

  <section class="mt-4 border border-cyan-200/10 bg-[#101923]/80 p-6">
    <div class="label-line">INTERFACE PROTOCOL</div>
    <h3 class="mt-2 text-base font-semibold text-white">显示与系统协议</h3>
    <div class="mt-5 divide-y divide-cyan-200/10">
      <div
        v-for="setting in settings"
        :key="setting[0]"
        class="flex items-center justify-between gap-6 py-4"
      >
        <div>
          <div class="text-sm font-semibold text-slate-200">{{ setting[0] }}</div>
          <div class="mt-1 text-xs text-slate-500">{{ setting[2] }}</div>
        </div>
        <div class="font-mono text-[10px] tracking-[0.16em] text-cyan-200">{{ setting[1] }}</div>
      </div>
    </div>
  </section>
</template>
