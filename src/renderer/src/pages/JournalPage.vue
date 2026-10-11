<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { NButton, NInput, useMessage } from 'naive-ui'
import PageHeader from '@renderer/components/PageHeader.vue'
import type { JournalEntry } from '../../../shared/models/journal'

const message = useMessage()
const entries = ref<JournalEntry[]>([])
const selectedId = ref<string | null>(null)
const title = ref('')
const content = ref('')
const searchQuery = ref('')
const saving = ref(false)
const loading = ref(false)
const editorMode = ref<'write' | 'preview'>('write')

const selectedEntry = computed(() => entries.value.find((entry) => entry.id === selectedId.value))
const charCount = computed(() => content.value.trim().length)
const lineCount = computed(() => (content.value ? content.value.split('\n').length : 0))

const previewBlocks = computed(() =>
  content.value.split('\n').map((rawLine, index) => {
    const line = rawLine.trimEnd()
    if (line.startsWith('### ')) return { id: index, type: 'h3', text: line.slice(4) }
    if (line.startsWith('## ')) return { id: index, type: 'h2', text: line.slice(3) }
    if (line.startsWith('# ')) return { id: index, type: 'h1', text: line.slice(2) }
    if (line.startsWith('- ')) return { id: index, type: 'li', text: line.slice(2) }
    if (line.startsWith('> ')) return { id: index, type: 'quote', text: line.slice(2) }
    if (line.trim() === '---') return { id: index, type: 'rule', text: '' }
    if (!line.trim()) return { id: index, type: 'space', text: '' }
    return { id: index, type: 'p', text: line }
  })
)

async function loadEntries(): Promise<void> {
  loading.value = true
  try {
    const result = await window.api.journal.list({ limit: 50, query: searchQuery.value.trim() })
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
    editorMode.value = 'write'
  } else {
    message.error(result.error.message)
  }
}

function newEntry(): void {
  selectedId.value = null
  title.value = ''
  content.value = ''
  editorMode.value = 'write'
}

function clearSearch(): void {
  searchQuery.value = ''
  void loadEntries()
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
      <div class="mb-5 flex items-center justify-between gap-4">
        <div>
          <div class="label-line">MARKDOWN MEMORY EDITOR</div>
          <h3 class="mt-2 text-base font-semibold text-white">
            {{ selectedEntry ? '编辑日志' : '记录今天' }}
          </h3>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <button
            class="border px-3 py-2 font-mono text-[10px] tracking-[0.14em] transition"
            :class="
              editorMode === 'write'
                ? 'border-cyan-200 bg-cyan-200/10 text-cyan-200'
                : 'border-cyan-200/10 text-slate-500 hover:border-cyan-200/40 hover:text-slate-200'
            "
            @click="editorMode = 'write'"
          >
            WRITE
          </button>
          <button
            class="border px-3 py-2 font-mono text-[10px] tracking-[0.14em] transition"
            :class="
              editorMode === 'preview'
                ? 'border-cyan-200 bg-cyan-200/10 text-cyan-200'
                : 'border-cyan-200/10 text-slate-500 hover:border-cyan-200/40 hover:text-slate-200'
            "
            @click="editorMode = 'preview'"
          >
            PREVIEW
          </button>
        </div>
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
        v-if="editorMode === 'write'"
        v-model="content"
        class="min-h-90 w-full resize-y border border-cyan-200/15 bg-[#0b141c] px-4 py-3 font-mono text-sm leading-7 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-200/60"
        placeholder="今天发生了什么？发现了什么？有什么值得保存的想法？\n\n支持 Markdown 标题、列表、引用与分隔线。正文将保存为本地 .md 文件。"
      ></textarea>

      <div
        v-else
        class="min-h-90 w-full overflow-auto border border-cyan-200/15 bg-[#0b141c] px-5 py-4 text-sm leading-7 text-slate-200"
      >
        <div
          v-if="content.trim().length === 0"
          class="grid min-h-70 place-items-center text-sm text-slate-600"
        >
          尚无可预览内容。
        </div>
        <template v-else>
          <template v-for="block in previewBlocks" :key="block.id">
            <h1 v-if="block.type === 'h1'" class="mb-4 mt-2 text-2xl font-semibold text-white">
              {{ block.text }}
            </h1>
            <h2
              v-else-if="block.type === 'h2'"
              class="mb-3 mt-5 text-xl font-semibold text-cyan-100"
            >
              {{ block.text }}
            </h2>
            <h3
              v-else-if="block.type === 'h3'"
              class="mb-2 mt-4 text-base font-semibold text-cyan-200"
            >
              {{ block.text }}
            </h3>
            <div v-else-if="block.type === 'li'" class="pl-4 text-slate-300">
              • {{ block.text }}
            </div>
            <blockquote
              v-else-if="block.type === 'quote'"
              class="my-3 border-l-2 border-cyan-200/40 pl-4 text-slate-400"
            >
              {{ block.text }}
            </blockquote>
            <hr v-else-if="block.type === 'rule'" class="my-5 border-cyan-200/10" />
            <div v-else-if="block.type === 'space'" class="h-3"></div>
            <p v-else class="text-slate-300">{{ block.text }}</p>
          </template>
        </template>
      </div>

      <div class="mt-4 flex flex-wrap items-center justify-between gap-4">
        <span class="font-mono text-[10px] tracking-[0.14em] text-slate-500">
          {{ charCount }} CHARS / {{ lineCount }} LINES / AUTOSAVE: NOT ENABLED
        </span>
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

      <div class="mb-5 grid gap-2 sm:grid-cols-[1fr_auto]">
        <NInput
          v-model:value="searchQuery"
          placeholder="搜索标题或摘要"
          clearable
          @keyup.enter="loadEntries"
          @clear="clearSearch"
        />
        <NButton secondary :loading="loading" @click="loadEntries">检索</NButton>
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
        {{ searchQuery.trim() ? '未找到匹配日志。' : '记忆存档为空。写下你的第一条系统日志。' }}
      </div>
      <div v-else class="space-y-5">
        <button
          v-for="(entry, index) in entries"
          :key="entry.id"
          class="block w-full border-t border-cyan-200/10 pt-5 text-left transition first:border-t-0 first:pt-0 hover:border-cyan-200/35"
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
