<script setup lang="ts">
import { NCard, NDescriptions, NDescriptionsItem } from 'naive-ui'
import PageHeader from '@renderer/components/PageHeader.vue'
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
        <NDescriptionsItem label="SYSTEM">PERSONAL OS</NDescriptionsItem>
        <NDescriptionsItem label="MODE">LOCAL FIRST</NDescriptionsItem>
        <NDescriptionsItem label="USER AUTHORITY">MAXIMUM</NDescriptionsItem>
        <NDescriptionsItem label="DEVELOPMENT">IN PROGRESS</NDescriptionsItem>
      </NDescriptions>
    </NCard>

    <NCard title="LOCAL DATA">
      <NDescriptions :column="1" label-placement="left">
        <NDescriptionsItem label="状态">待初始化</NDescriptionsItem>
        <NDescriptionsItem label="计划目录">PersonalOS/</NDescriptionsItem>
        <NDescriptionsItem label="存储模式">SQLite + Markdown + 普通文件</NDescriptionsItem>
      </NDescriptions>
    </NCard>
  </div>
</template>
