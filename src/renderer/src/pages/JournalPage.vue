<script setup lang="ts">
import { NButton, NCard } from 'naive-ui'
import EmptyState from '@renderer/components/EmptyState.vue'
import PageHeader from '@renderer/components/PageHeader.vue'
</script>

<template>
  <PageHeader
    eyebrow="[ SYSTEM LOG ]"
    title="系统日志 / JOURNAL"
    description="未被记录的经历，往往比想象中消失得更快。日志将以 Markdown 等开放格式保存在本地。"
  />

  <div class="grid gap-4 lg:grid-cols-[1fr_1fr]">
    <NCard title="MEMORY RETRIEVAL PREVIEW">
      <p class="text-slate-400">
        未来在明确授权下，AI 可以检索日记、历史任务、项目资料和活动记录，并提供带来源依据的回答。
      </p>
      <blockquote class="mt-5 border-l-2 border-cyan-300/40 pl-4 text-slate-300">
        “过去半年，我到底完成了什么？”
      </blockquote>
    </NCard>

    <EmptyState
      title="日记模块待实现"
      description="完成本地数据层后，将按日期创建 Markdown 文件并维护 SQLite 元数据。"
    >
      <NButton type="primary">WRITE TODAY LOG</NButton>
    </EmptyState>
  </div>
</template>
