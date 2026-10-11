<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { NButton, NCard, NDescriptions, NDescriptionsItem, useMessage } from 'naive-ui'
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
    eyebrow="[ SYSTEM CORE ]"
    title="系统核心 / SYSTEM"
    description="本地优先、模块化、权限可控。核心数据默认保存在本地设备中，并提供备份、恢复和导出机制。"
  />
  <div class="grid gap-4 lg:grid-cols-2">
    <NCard title="SYSTEM STATUS">
      <NDescriptions :column="1" label-placement="left">
        <NDescriptionsItem label="SYSTEM">{{ appInfo?.name ?? 'PERSONAL OS' }}</NDescriptionsItem>
        <NDescriptionsItem label="VERSION">{{ appInfo?.version ?? 'UNKNOWN' }}</NDescriptionsItem>
        <NDescriptionsItem label="MODE">{{ appInfo?.mode ?? 'LOCAL FIRST' }}</NDescriptionsItem>
        <NDescriptionsItem label="PLATFORM">{{ appInfo?.platform ?? 'UNKNOWN' }}</NDescriptionsItem>
      </NDescriptions>
    </NCard>

    <NCard title="LOCAL DATA">
      <NDescriptions :column="1" label-placement="left">
        <NDescriptionsItem label="状态">{{ dataStatus }}</NDescriptionsItem>
        <NDescriptionsItem label="根目录">{{ dataDirectory?.path ?? '读取中' }}</NDescriptionsItem>
        <NDescriptionsItem label="Journal">
          {{ dataDirectory?.directories.journal ?? '读取中' }}
        </NDescriptionsItem>
        <NDescriptionsItem label="Backups">
          {{ dataDirectory?.directories.backups ?? '读取中' }}
        </NDescriptionsItem>
        <NDescriptionsItem label="存储模式">SQLite + Markdown + 普通文件</NDescriptionsItem>
      </NDescriptions>
      <div class="mt-4 flex gap-3">
        <NButton type="primary" :loading="loading" @click="openDataDirectory">打开数据目录</NButton>
        <NButton secondary :loading="loading" @click="loadSystemStatus">刷新状态</NButton>
      </div>
    </NCard>
  </div>
</template>
