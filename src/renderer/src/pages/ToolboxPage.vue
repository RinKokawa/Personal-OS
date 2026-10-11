<script setup lang="ts">
import { NCard, NTag } from 'naive-ui'
import EmptyState from '@renderer/components/EmptyState.vue'
import PageHeader from '@renderer/components/PageHeader.vue'

const abilities = ['知识解析', '代码辅助', '任务分身', '自动执行', '记忆检索']
</script>

<template>
  <PageHeader
    eyebrow="[ ABILITY SYSTEM ]"
    title="特殊能力 / ABILITIES"
    description="Personal OS 将工具、自动化脚本和 AI Agent 统一视为可以调用的能力。"
  />

  <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    <NCard v-for="ability in abilities" :key="ability" :title="ability">
      <p class="text-sm text-slate-400">能力模块将在授权、日志和权限边界明确后逐步解锁。</p>
      <NTag class="mt-4" type="warning" size="small">LOCKED</NTag>
    </NCard>
    <EmptyState
      title="工具箱模块占位"
      description="后续从 JSON 格式化、文本转换、正则测试等低风险工具开始。"
    />
  </div>
</template>
