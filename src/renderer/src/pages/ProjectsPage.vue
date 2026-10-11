<script setup lang="ts">
import { NButton } from 'naive-ui'
import PageHeader from '@renderer/components/PageHeader.vue'

const resourceTypes = [
  { name: 'DOCUMENTS', zh: '本地文件与知识资料', state: 'PLANNED' },
  { name: 'REPOSITORIES', zh: '软件项目与 Git 仓库', state: 'READY' },
  { name: 'TOOLS', zh: '常用工具与脚本', state: 'PLANNED' },
  { name: 'DEVICES', zh: '设备与硬件资料', state: 'LOCKED' },
  { name: 'AI RESOURCES', zh: 'AI Skills、MCP 服务与工作流', state: 'PLANNED' }
]

const resourceCards = [
  ['Personal OS', '当前系统仓库', 'repository'],
  ['Prototype Archive', '交互原型与设计参考', 'document'],
  ['Local Data Root', 'PersonalOS 数据目录', 'folder']
]
</script>

<template>
  <PageHeader
    eyebrow="SYSTEM / 04 — INVENTORY"
    title="物品栏"
    description="组织个人数字资源与工具的统一入口。文件可以保留在原目录中，系统负责索引、搜索与关联。"
  />

  <section class="mb-4 border border-cyan-200/10 bg-[#101923]/80 p-6">
    <div class="mb-5 flex items-center justify-between">
      <div>
        <div class="label-line">RESOURCE INDEX</div>
        <h3 class="mt-2 text-base font-semibold text-white">资源类型</h3>
      </div>
      <NButton type="primary">登记资源</NButton>
    </div>

    <div class="grid gap-3 lg:grid-cols-5">
      <div
        v-for="item in resourceTypes"
        :key="item.name"
        class="border border-cyan-200/10 bg-[#14222d] p-4 transition hover:border-cyan-200/40 hover:bg-cyan-200/[0.06]"
      >
        <div class="font-mono text-[10px] tracking-[0.16em] text-cyan-200">{{ item.name }}</div>
        <div class="mt-3 min-h-10 text-sm text-slate-200">{{ item.zh }}</div>
        <div class="mt-4 font-mono text-[9px] tracking-[0.14em] text-slate-500">
          ● {{ item.state }}
        </div>
      </div>
    </div>
  </section>

  <div class="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
    <section class="border border-cyan-200/10 bg-[#101923]/80 p-6">
      <div class="mb-5 flex items-center justify-between">
        <div>
          <div class="label-line">LOCAL ASSETS</div>
          <h3 class="mt-2 text-base font-semibold text-white">已知资源</h3>
        </div>
        <span class="font-mono text-[10px] tracking-[0.16em] text-cyan-200">PREVIEW</span>
      </div>

      <div class="space-y-3">
        <div
          v-for="card in resourceCards"
          :key="card[0]"
          class="flex items-center justify-between border border-cyan-200/10 bg-[#0b141c] px-5 py-4"
        >
          <div>
            <div class="font-semibold text-white">{{ card[0] }}</div>
            <div class="mt-1 text-xs text-slate-500">{{ card[1] }}</div>
          </div>
          <div class="font-mono text-[10px] tracking-[0.16em] text-cyan-200">{{ card[2] }}</div>
        </div>
      </div>
    </section>

    <section class="border border-cyan-200/10 bg-[#101923]/80 p-6">
      <div class="label-line">INDEX PROTOCOL</div>
      <h3 class="mt-2 text-base font-semibold text-white">索引规则</h3>
      <p class="mt-4 text-sm leading-7 text-slate-400">
        INVENTORY 不会移动你的原始文件。系统只保存资源索引、标签、关联关系与必要元数据。
      </p>
      <div class="mt-6 space-y-3 font-mono text-[10px] tracking-[0.12em] text-slate-500">
        <div class="border-t border-cyan-200/10 pt-3">FILESYSTEM ACCESS // NOT GRANTED</div>
        <div class="border-t border-cyan-200/10 pt-3">RESOURCE DATABASE // PLANNED</div>
        <div class="border-t border-cyan-200/10 pt-3">ENTITY LINKS // PLANNED</div>
      </div>
    </section>
  </div>
</template>
