<script setup lang="ts">
import { NCard, NList, NListItem, NTag } from 'naive-ui'
import EmptyState from '@renderer/components/EmptyState.vue'
import PageHeader from '@renderer/components/PageHeader.vue'

const inventoryItems = [
  '本地文件与知识资料',
  '软件项目与 Git 仓库',
  '常用工具与脚本',
  '设备与硬件资料',
  'AI Skills、MCP 服务与工作流'
]
</script>

<template>
  <PageHeader
    eyebrow="[ INVENTORY ]"
    title="物品栏 / INVENTORY"
    description="组织个人数字资源与工具的统一入口。文件可以保留在原目录中，系统负责索引、搜索与关联。"
  />

  <div class="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
    <NCard title="RESOURCE TYPES">
      <NList>
        <NListItem v-for="item in inventoryItems" :key="item">
          <div class="flex items-center justify-between">
            <span>{{ item }}</span>
            <NTag size="small">PLANNED</NTag>
          </div>
        </NListItem>
      </NList>
    </NCard>
    <EmptyState
      title="资源索引待实现"
      description="V0.2/V0.3 将建立项目、资源、仓库和可调用能力之间的关联。"
    />
  </div>
</template>
