<script setup lang="ts">
import { NButton, NTag } from 'naive-ui'
import PageHeader from '@renderer/components/PageHeader.vue'

const previewTasks = [
  { title: '完成 QUEST 数据层接入', tag: '主线', priority: 'HIGH', done: false },
  { title: '实现创建与完成任务 IPC', tag: '系统', priority: 'NORMAL', done: false },
  { title: '把任务统计接入 STATUS', tag: '联动', priority: 'NORMAL', done: false },
  { title: '记录今日开发日志', tag: '每日', priority: 'LOW', done: true }
]

const filters = ['全部任务', '未完成', '已完成']
</script>

<template>
  <PageHeader
    eyebrow="SYSTEM / 02 — QUEST SYSTEM"
    title="任务系统"
    description="将遥远的目标拆解为当下能够执行的行动。正式 CRUD 接入后，这里会成为每日行动入口。"
  />

  <section
    class="relative mb-4 overflow-hidden border border-cyan-200/20 bg-[linear-gradient(110deg,rgba(51,70,76,0.55),#101a24_70%)] p-7"
  >
    <div
      class="absolute -bottom-10 right-2 font-mono text-[140px] font-black leading-none text-cyan-200/[0.04]"
    >
      01
    </div>
    <div class="relative z-1 flex items-center justify-between gap-8">
      <div>
        <div class="label-line">MAIN QUEST / ACTIVE</div>
        <h2 class="mt-4 text-2xl font-semibold text-white">构建属于自己的个人系统</h2>
        <p class="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
          建立开放的系统底座，让任务、数据、工具和智能协作成为现实。
        </p>
      </div>
      <div class="text-right">
        <strong class="font-mono text-5xl text-cyan-200">0%</strong>
        <div class="mt-2 font-mono text-[10px] tracking-[0.16em] text-slate-500">
          QUEST PROGRESS
        </div>
      </div>
    </div>
  </section>

  <section class="border border-cyan-200/10 bg-[#101923]/80 p-6">
    <div class="mb-5 flex items-center justify-between">
      <div>
        <div class="label-line">QUEST DATABASE</div>
        <h3 class="mt-2 text-base font-semibold text-white">任务列表 · PREVIEW</h3>
      </div>
      <NButton type="primary">发布新任务</NButton>
    </div>

    <div class="mb-5 flex gap-2">
      <button
        v-for="(filter, index) in filters"
        :key="filter"
        class="border px-4 py-2 text-xs transition"
        :class="
          index === 0
            ? 'border-cyan-200 bg-cyan-200/10 text-cyan-200'
            : 'border-cyan-200/10 text-slate-400 hover:border-cyan-200/40 hover:text-slate-100'
        "
      >
        {{ filter }}
      </button>
    </div>

    <div class="divide-y divide-cyan-200/10">
      <div v-for="task in previewTasks" :key="task.title" class="flex items-center gap-4 py-4">
        <div
          class="grid h-5 w-5 shrink-0 place-items-center border text-xs"
          :class="
            task.done
              ? 'border-cyan-200 bg-cyan-200 text-[#071211]'
              : 'border-slate-600 text-transparent'
          "
        >
          ✓
        </div>
        <div class="min-w-0 flex-1">
          <div
            class="truncate text-sm"
            :class="task.done ? 'text-slate-500 line-through' : 'text-slate-100'"
          >
            {{ task.title }}
          </div>
          <div class="mt-1 font-mono text-[10px] text-slate-500">LOCAL / {{ task.tag }}</div>
        </div>
        <NTag size="small" :type="task.priority === 'HIGH' ? 'warning' : 'info'">
          {{ task.priority }}
        </NTag>
      </div>
    </div>

    <div
      class="mt-5 rounded border border-dashed border-cyan-200/15 px-5 py-4 text-xs leading-6 text-slate-500"
    >
      当前为视觉预览。下一步接入 SQLite `quests` 表后，按钮将变为真实创建、完成、删除操作。
    </div>
  </section>
</template>
