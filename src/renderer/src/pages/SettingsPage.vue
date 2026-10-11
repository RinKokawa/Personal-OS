<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { NButton, useMessage } from 'naive-ui'
import PageHeader from '@renderer/components/PageHeader.vue'
import type { AppInfo, DataDirectoryStatus } from '../../../shared/models/system'

const message = useMessage()
const appInfo = ref<AppInfo | null>(null)
const dataDirectory = ref<DataDirectoryStatus | null>(null)
const loading = ref(false)

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
  ['数据备份', 'PLANNED', '将数据库与 Markdown 文件导出到 backups。']
]

async function loadSystemStatus(): Promise<void> {
  loading.value = true
  try {
    const [appInfoResult, dataDirectoryResult] = await Promise.all([
      window.api.system.getAppInfo(),
      window.api.system.getDataDirectoryStatus()
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
  } finally {
    loading.value = false
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

      <div class="mt-5 flex gap-3">
        <NButton type="primary" :loading="loading" @click="openDataDirectory">打开数据目录</NButton>
        <NButton secondary :loading="loading" @click="loadSystemStatus">刷新状态</NButton>
      </div>
    </section>
  </div>

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
