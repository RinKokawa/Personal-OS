<script setup lang="ts">
import { NCard, NDescriptions, NDescriptionsItem } from 'naive-ui'
import EmptyState from '@renderer/components/EmptyState.vue'
import PageHeader from '@renderer/components/PageHeader.vue'
</script>

<template>
  <PageHeader
    eyebrow="[ AUXILIARY INTELLIGENCE ]"
    title="辅助智能 / AGENT"
    description="Agent 是系统的重要组成部分，但不是系统本身。系统负责管理数据、任务和资源；Agent 在授权范围内推理、分析及执行。"
  />

  <div class="grid gap-4 lg:grid-cols-[1fr_1fr]">
    <NCard title="SECURITY NOTICE">
      <NDescriptions :column="1" label-placement="left">
        <NDescriptionsItem label="首个适配">Pi</NDescriptionsItem>
        <NDescriptionsItem label="执行状态">待接入</NDescriptionsItem>
        <NDescriptionsItem label="权限协议">高风险操作必须审批</NDescriptionsItem>
        <NDescriptionsItem label="控制权">宿主拥有最终控制权</NDescriptionsItem>
      </NDescriptions>
    </NCard>
    <EmptyState
      title="Agent Hub 占位"
      description="首版不会实现复杂多 Agent 编排，后续先调研 Pi RPC 接入方式。"
    />
  </div>
</template>
