<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { NButton, useMessage } from 'naive-ui'
import PageHeader from '@renderer/components/PageHeader.vue'
import type { JournalEntry } from '../../../shared/models/journal'

const message = useMessage()
const entries = ref<JournalEntry[]>([])
const selectedId = ref<string | null>(null)
const title = ref('')
const content = ref('')
const saving = ref(false)
const loading = ref(false)

const selectedEntry = computed(() => entries.value.find((entry) => entry.id === selectedId.value))

async function loadEntries(): Promise<void> {
  loading.value = true
  try {
    const result = await window.api.journal.list({ limit: 50 })
    if (result.ok) {
      entries.value = result.data
    } else {
      message.error(result.error.message)
    }
  } finally {
    loading.value = false
  }
}

async function openEntry(entry: JournalEntry): Promise<void> {
  const result = await window.api.journal.get(entry.id)
  if (result.ok) {
    selectedId.value = result.data.id
    title.value = result.data.title
    content.value = result.data.content
  } else {
    message.error(result.error.message)
  }
}

function newEntry(): void {
  selectedId.value = null
  title.value = ''
  content.value = ''
}

async function saveEntry(): Promise<void> {
  if (!content.value.trim()) {
    message.warning('日志内容不能为空')
    return
  }

  saving.value = true
  try {
    const result = await window.api.journal.save({
      id: selectedId.value ?? undefined,
      title: title.value || '未命名日志',
      content: content.value
    })

    if (result.ok) {
      selectedId.value = result.data.id
      title.value = result.data.title
      content.value = result.data.content
      message.success('系统日志已保存')
      await loadEntries()
    } else {
      message.error(result.error.message)
    }
  } finally {
    saving.value = false
  }
}

onMounted(loadEntries)
</script>

<template>
  <PageHeader
    eyebrow="SYSTEM / 03 — MEMORY ARCHIVE"
    title="系统日志"
    description="日记、灵感、实验记录。让过去的自己留下可供检索的线索。当前已保存为本地 Markdown 文件。"
  />

  <div class="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
    <section class="border border-cyan-200/10 bg-[#101923]/80 p-6">
      <div class="mb-5 flex items-center justify-between">
        <div>
          <div class="label-line">NEW MEMORY RECORD</div>
          <h3 class="mt-2 text-base font-semibold text-white">
            {{ selectedEntry ? '编辑日志' : '记录今天' }}
          </h3>
        </div>
        <span class="font-mono text-[10px] tracking-[0.16em] text-slate-500">
          {{ new Date().toLocaleDateString('zh-CN') }}
        </span>
      </div>

      <label class="mb-2 block font-mono text-[10px] tracking-[0.14em] text-slate-500"
        >ENTRY TITLE</label
      >
      <input
        v-model="title"
        class="mb-4 w-full border border-cyan-200/15 bg-[#0b141c] px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-200/60"
        placeholder="为这段记忆命名…"
      />

      <label class="mb-2 block font-mono text-[10px] tracking-[0.14em] text-slate-500"
        >CONTENT / MARKDOWN</label
      >
      <textarea
        v-model="content"
        class="min-h-70 w-full resize-y border border-cyan-200/15 bg-[#0b141c] px-4 py-3 text-sm leading-7 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-200/60"
        placeholder="今天发生了什么？发现了什么？有什么值得保存的想法？\n\n正文将保存为本地 Markdown 文件。"
      ></textarea>

      <div class="mt-4 flex items-center justify-between gap-4">
        <span class="font-mono text-[10px] tracking-[0.14em] text-slate-500"
          >AUTOSAVE: NOT ENABLED</span
        >
        <div class="flex gap-3">
          <NButton secondary @click="newEntry">新建</NButton>
          <NButton type="primary" :loading="saving" @click="saveEntry">写入系统日志</NButton>
        </div>
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
        >
          {{ entries.length }} ENTRIES
        </span>
      </div>

      <div
        v-if="loading"
        class="rounded border border-dashed border-cyan-200/15 px-6 py-10 text-center text-sm text-slate-500"
      >
        正在读取 MEMORY ARCHIVE...
      </div>
      <div
        v-else-if="entries.length === 0"
        class="rounded border border-dashed border-cyan-200/15 px-6 py-10 text-center text-sm text-slate-500"
      >
        记忆存档为空。写下你的第一条系统日志。
      </div>
      <div v-else class="space-y-5">
        <button
          v-for="(entry, index) in entries"
          :key="entry.id"
          class="block w-full border-t border-cyan-200/10 pt-5 text-left first:border-t-0 first:pt-0"
          @click="openEntry(entry)"
        >
          <div class="font-mono text-[10px] tracking-[0.16em] text-cyan-200">
            {{ entry.entryDate }} / ENTRY {{ String(entries.length - index).padStart(3, '0') }}
          </div>
          <h4 class="mt-2 text-sm font-semibold text-white">{{ entry.title }}</h4>
          <p class="mt-2 text-xs leading-6 text-slate-400">{{ entry.excerpt || '无摘要' }}</p>
          <div class="mt-2 font-mono text-[9px] tracking-[0.12em] text-slate-500">
            {{ entry.wordCount }} CHARS / {{ entry.filePath }}
          </div>
        </button>
      </div>
    </section>
  </div>
</template>
