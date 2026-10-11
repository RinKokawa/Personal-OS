<script setup lang="ts">
import { NButton } from 'naive-ui'
import PageHeader from '@renderer/components/PageHeader.vue'

const archivePreview = [
  ['SYSTEM DESIGN', '原型已拆解为 DESIGN / ARCHITECTURE / DATA MODEL / PERMISSION MODEL。'],
  ['CORE ONLINE', 'IPC、数据目录、SQLite 与活动日志已经接入系统核心。'],
  ['NEXT MEMORY', '等待写入第一条真正的 Markdown 系统日志。']
]
</script>

<template>
  <PageHeader
    eyebrow="SYSTEM / 03 — MEMORY ARCHIVE"
    title="系统日志"
    description="日记、灵感、实验记录。让过去的自己留下可供检索的线索。"
  />

  <div class="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
    <section class="border border-cyan-200/10 bg-[#101923]/80 p-6">
      <div class="mb-5 flex items-center justify-between">
        <div>
          <div class="label-line">NEW MEMORY RECORD</div>
          <h3 class="mt-2 text-base font-semibold text-white">记录今天</h3>
        </div>
        <span class="font-mono text-[10px] tracking-[0.16em] text-slate-500">
          {{ new Date().toLocaleDateString('zh-CN') }}
        </span>
      </div>

      <label class="mb-2 block font-mono text-[10px] tracking-[0.14em] text-slate-500"
        >ENTRY TITLE</label
      >
      <input
        class="mb-4 w-full border border-cyan-200/15 bg-[#0b141c] px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-200/60"
        placeholder="为这段记忆命名…"
      />

      <label class="mb-2 block font-mono text-[10px] tracking-[0.14em] text-slate-500"
        >CONTENT / MARKDOWN</label
      >
      <textarea
        class="min-h-70 w-full resize-y border border-cyan-200/15 bg-[#0b141c] px-4 py-3 text-sm leading-7 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-200/60"
        placeholder="今天发生了什么？发现了什么？有什么值得保存的想法？\n\n正式版将保存为本地 Markdown 文件。"
      ></textarea>

      <div class="mt-4 flex items-center justify-between gap-4">
        <span class="font-mono text-[10px] tracking-[0.14em] text-slate-500"
          >AUTOSAVE: PLANNED</span
        >
        <NButton type="primary">写入系统日志</NButton>
      </div>
    </section>

    <section class="border border-cyan-200/10 bg-[#101923]/80 p-6">
      <div class="mb-5 flex items-center justify-between">
        <div>
          <div class="label-line">MEMORY ARCHIVE</div>
          <h3 class="mt-2 text-base font-semibold text-white">历史日志</h3>
        </div>
        <span
          class="border border-cyan-200/25 px-2 py-1 font-mono text-[9px] tracking-[0.16em] text-cyan-200"
          >PREVIEW</span
        >
      </div>

      <div class="space-y-5">
        <article
          v-for="(item, index) in archivePreview"
          :key="item[0]"
          class="border-t border-cyan-200/10 pt-5 first:border-t-0 first:pt-0"
        >
          <div class="font-mono text-[10px] tracking-[0.16em] text-cyan-200">
            ENTRY {{ String(index + 1).padStart(3, '0') }}
          </div>
          <h4 class="mt-2 text-sm font-semibold text-white">{{ item[0] }}</h4>
          <p class="mt-2 text-xs leading-6 text-slate-400">{{ item[1] }}</p>
        </article>
      </div>
    </section>
  </div>
</template>
