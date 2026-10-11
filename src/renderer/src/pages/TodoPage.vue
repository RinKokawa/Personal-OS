<script setup lang="ts">
import { NButton, NCard, NList, NListItem, NTag } from 'naive-ui'
import EmptyState from '@renderer/components/EmptyState.vue'
import PageHeader from '@renderer/components/PageHeader.vue'

const questTypes = [
  ['MAIN QUEST', '长期目标与人生主线'],
  ['SIDE QUEST', '短期项目、兴趣探索与生活事务'],
  ['DAILY QUEST', '今天能够执行的具体行动'],
  ['DYNAMIC QUEST', 'AI 在授权后提出的候选建议']
]
</script>

<template>
  <PageHeader
    eyebrow="[ NEW QUEST AVAILABLE ]"
    title="任务系统 / QUEST"
    description="将模糊而遥远的目标拆解为阶段目标、项目与今日可以执行的行动。系统可以建议任务，但最终决定权始终属于宿主。"
  />

  <div class="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
    <NCard title="QUEST TYPES">
      <NList>
        <NListItem v-for="item in questTypes" :key="item[0]">
          <div class="flex items-center justify-between gap-4">
            <div>
              <div class="font-mono text-cyan-100">{{ item[0] }}</div>
              <div class="mt-1 text-sm text-slate-400">{{ item[1] }}</div>
            </div>
            <NTag size="small" type="info">LOCKED</NTag>
          </div>
        </NListItem>
      </NList>
    </NCard>

    <EmptyState
      title="任务模块待实现"
      description="下一步会先设计 SQLite Schema 与 IPC 数据服务，再接入任务 CRUD。"
    >
      <NButton type="primary">CREATE QUEST</NButton>
    </EmptyState>
  </div>
</template>
