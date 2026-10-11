<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { NButton, NDatePicker, NInput, NSelect, NTag, useMessage } from 'naive-ui'
import PageHeader from '@renderer/components/PageHeader.vue'
import type { Quest, QuestPriority, QuestType } from '../../../shared/models/quest'

const message = useMessage()
const quests = ref<Quest[]>([])
const loading = ref(false)
const creating = ref(false)
const savingQuestId = ref<string | null>(null)
const filter = ref<'all' | 'open' | 'done' | 'today'>('all')
const title = ref('')
const description = ref('')
const priority = ref<QuestPriority>('normal')
const questType = ref<QuestType>('side')
const dueDate = ref<number | null>(null)
const editingQuestId = ref<string | null>(null)
const editTitle = ref('')
const editDescription = ref('')
const editPriority = ref<QuestPriority>('normal')
const editType = ref<QuestType>('side')
const editDueDate = ref<number | null>(null)

const priorityLabels: Record<QuestPriority, string> = {
  low: '低',
  normal: '普通',
  high: '高',
  urgent: '紧急'
}

const typeLabels: Record<QuestType, string> = {
  main: '主线任务',
  side: '支线任务',
  daily: '每日任务',
  dynamic: '动态任务'
}

const priorityOptions = Object.entries(priorityLabels).map(([value, label]) => ({ value, label }))
const typeOptions = Object.entries(typeLabels).map(([value, label]) => ({ value, label }))

const filterOptions: Array<{ label: string; value: typeof filter.value }> = [
  { label: '全部任务', value: 'all' },
  { label: '未完成', value: 'open' },
  { label: '今日任务', value: 'today' },
  { label: '已完成', value: 'done' }
]

const priorityWeight: Record<QuestPriority, number> = {
  urgent: 4,
  high: 3,
  normal: 2,
  low: 1
}

function dateToIso(value: number | null): string | null {
  return value === null ? null : new Date(value).toISOString()
}

function isoToDateValue(value?: string | null): number | null {
  return value ? new Date(value).getTime() : null
}

function isToday(value?: string | null): boolean {
  if (!value) return false
  const date = new Date(value)
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

function compareQuests(left: Quest, right: Quest): number {
  if (left.status === 'done' && right.status !== 'done') return 1
  if (left.status !== 'done' && right.status === 'done') return -1

  const leftDue = left.dueAt ? new Date(left.dueAt).getTime() : Number.POSITIVE_INFINITY
  const rightDue = right.dueAt ? new Date(right.dueAt).getTime() : Number.POSITIVE_INFINITY
  if (leftDue !== rightDue) return leftDue - rightDue

  const priorityDiff = priorityWeight[right.priority] - priorityWeight[left.priority]
  if (priorityDiff !== 0) return priorityDiff

  return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
}

const sortedQuests = computed(() => [...quests.value].sort(compareQuests))

const filteredQuests = computed(() => {
  if (filter.value === 'open') return sortedQuests.value.filter((quest) => quest.status !== 'done')
  if (filter.value === 'done') return sortedQuests.value.filter((quest) => quest.status === 'done')
  if (filter.value === 'today') {
    return sortedQuests.value.filter((quest) => quest.status !== 'done' && isToday(quest.dueAt))
  }
  return sortedQuests.value
})

const completedCount = computed(
  () => quests.value.filter((quest) => quest.status === 'done').length
)
const todayCount = computed(
  () => quests.value.filter((quest) => quest.status !== 'done' && isToday(quest.dueAt)).length
)
const progress = computed(() => {
  if (quests.value.length === 0) return 0
  return Math.round((completedCount.value / quests.value.length) * 100)
})

async function loadQuests(): Promise<void> {
  loading.value = true
  try {
    const result = await window.api.quest.list({ status: 'all' })
    if (result.ok) {
      quests.value = result.data
    } else {
      message.error(result.error.message)
    }
  } finally {
    loading.value = false
  }
}

async function createQuest(): Promise<void> {
  const nextTitle = title.value.trim()
  if (!nextTitle) {
    message.warning('任务标题不能为空')
    return
  }

  creating.value = true
  try {
    const result = await window.api.quest.create({
      title: nextTitle,
      description: description.value.trim() || null,
      type: questType.value,
      priority: priority.value,
      dueAt: dateToIso(dueDate.value)
    })
    if (result.ok) {
      title.value = ''
      description.value = ''
      priority.value = 'normal'
      questType.value = 'side'
      dueDate.value = null
      message.success('新的任务已登记')
      await loadQuests()
    } else {
      message.error(result.error.message)
    }
  } finally {
    creating.value = false
  }
}

function startEditing(quest: Quest): void {
  editingQuestId.value = quest.id
  editTitle.value = quest.title
  editDescription.value = quest.description ?? ''
  editPriority.value = quest.priority
  editType.value = quest.type
  editDueDate.value = isoToDateValue(quest.dueAt)
}

function cancelEditing(): void {
  editingQuestId.value = null
  editTitle.value = ''
  editDescription.value = ''
  editPriority.value = 'normal'
  editType.value = 'side'
  editDueDate.value = null
}

async function saveQuest(quest: Quest): Promise<void> {
  const nextTitle = editTitle.value.trim()
  if (!nextTitle) {
    message.warning('任务标题不能为空')
    return
  }

  savingQuestId.value = quest.id
  try {
    const result = await window.api.quest.update({
      id: quest.id,
      title: nextTitle,
      description: editDescription.value.trim() || null,
      type: editType.value,
      priority: editPriority.value,
      dueAt: dateToIso(editDueDate.value)
    })

    if (result.ok) {
      message.success('任务协议已更新')
      cancelEditing()
      await loadQuests()
    } else {
      message.error(result.error.message)
    }
  } finally {
    savingQuestId.value = null
  }
}

async function toggleQuest(quest: Quest): Promise<void> {
  const result =
    quest.status === 'done'
      ? await window.api.quest.reopen(quest.id)
      : await window.api.quest.complete(quest.id)

  if (result.ok) {
    await loadQuests()
  } else {
    message.error(result.error.message)
  }
}

async function deleteQuest(quest: Quest): Promise<void> {
  const confirmed = window.confirm(`删除任务「${quest.title}」？`)
  if (!confirmed) return

  const result = await window.api.quest.delete(quest.id)
  if (result.ok) {
    message.success('任务已删除')
    await loadQuests()
  } else {
    message.error(result.error.message)
  }
}

function priorityTagType(priorityValue: QuestPriority): 'default' | 'info' | 'warning' | 'error' {
  if (priorityValue === 'urgent') return 'error'
  if (priorityValue === 'high') return 'warning'
  if (priorityValue === 'normal') return 'info'
  return 'default'
}

function formatDueDate(value?: string | null): string {
  if (!value) return '无截止日期'
  return new Date(value).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

onMounted(loadQuests)
</script>

<template>
  <PageHeader
    eyebrow="系统 / 02 — 任务系统"
    title="任务系统"
    description="将遥远的目标拆解为当下能够执行的行动。当前已接入本地 SQLite 持久化。"
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
        <div class="label-line">主线任务 / 进行中</div>
        <h2 class="mt-4 text-2xl font-semibold text-white">构建属于自己的个人系统</h2>
        <p class="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
          建立开放的系统底座，让任务、数据、工具和智能协作成为现实。
        </p>
      </div>
      <div class="text-right">
        <strong class="font-mono text-5xl text-cyan-200">{{ progress }}%</strong>
        <div class="mt-2 font-mono text-[10px] tracking-[0.16em] text-slate-500">任务进度</div>
      </div>
    </div>
  </section>

  <section class="mb-4 border border-cyan-200/10 bg-[#101923]/80 p-6">
    <div class="label-line">新建任务</div>
    <h3 class="mt-2 text-base font-semibold text-white">发布新任务</h3>
    <div class="mt-5 grid gap-3 lg:grid-cols-[1fr_150px_150px_180px_auto]">
      <NInput v-model:value="title" placeholder="输入任务名称" @keyup.enter="createQuest" />
      <NSelect v-model:value="questType" :options="typeOptions" />
      <NSelect v-model:value="priority" :options="priorityOptions" />
      <NDatePicker v-model:value="dueDate" type="date" clearable placeholder="截止日期" />
      <NButton type="primary" :loading="creating" @click="createQuest">创建任务</NButton>
    </div>
    <NInput
      v-model:value="description"
      class="mt-3"
      type="textarea"
      placeholder="任务描述 / 执行备注（可选）"
      :autosize="{ minRows: 2, maxRows: 4 }"
    />
  </section>

  <section class="border border-cyan-200/10 bg-[#101923]/80 p-6">
    <div class="mb-5 flex items-center justify-between">
      <div>
        <div class="label-line">任务库</div>
        <h3 class="mt-2 text-base font-semibold text-white">任务列表 · {{ quests.length }}</h3>
      </div>
      <div class="text-right font-mono text-[10px] tracking-[0.16em] text-cyan-200">
        <div>{{ quests.length - completedCount }} 项待完成</div>
        <div class="mt-1 text-slate-500">{{ todayCount }} 项今日到期</div>
      </div>
    </div>

    <div class="mb-5 flex flex-wrap gap-2">
      <button
        v-for="item in filterOptions"
        :key="item.value"
        class="border px-4 py-2 text-xs transition"
        :class="
          filter === item.value
            ? 'border-cyan-200 bg-cyan-200/10 text-cyan-200'
            : 'border-cyan-200/10 text-slate-400 hover:border-cyan-200/40 hover:text-slate-100'
        "
        @click="filter = item.value"
      >
        {{ item.label }}
      </button>
    </div>

    <div
      v-if="loading"
      class="rounded border border-dashed border-cyan-200/15 px-6 py-10 text-center text-sm text-slate-500"
    >
      正在读取任务库...
    </div>
    <div
      v-else-if="filteredQuests.length === 0"
      class="rounded border border-dashed border-cyan-200/15 px-6 py-10 text-center text-sm text-slate-500"
    >
      当前筛选条件下没有任务。
    </div>
    <div v-else class="divide-y divide-cyan-200/10">
      <div v-for="quest in filteredQuests" :key="quest.id" class="py-4">
        <div v-if="editingQuestId === quest.id" class="grid gap-3">
          <div class="grid gap-3 lg:grid-cols-[1fr_150px_150px_180px]">
            <NInput v-model:value="editTitle" placeholder="任务名称" />
            <NSelect v-model:value="editType" :options="typeOptions" />
            <NSelect v-model:value="editPriority" :options="priorityOptions" />
            <NDatePicker v-model:value="editDueDate" type="date" clearable placeholder="截止日期" />
          </div>
          <NInput
            v-model:value="editDescription"
            type="textarea"
            placeholder="任务描述 / 执行备注（可选）"
            :autosize="{ minRows: 2, maxRows: 4 }"
          />
          <div class="flex justify-end gap-2">
            <NButton size="small" quaternary @click="cancelEditing">取消</NButton>
            <NButton
              size="small"
              type="primary"
              :loading="savingQuestId === quest.id"
              @click="saveQuest(quest)"
            >
              保存修改
            </NButton>
          </div>
        </div>

        <div v-else class="flex items-center gap-4">
          <button
            class="grid h-5 w-5 shrink-0 place-items-center border text-xs"
            :class="
              quest.status === 'done'
                ? 'border-cyan-200 bg-cyan-200 text-[#071211]'
                : 'border-slate-600 text-transparent hover:border-cyan-200'
            "
            @click="toggleQuest(quest)"
          >
            ✓
          </button>
          <div class="min-w-0 flex-1">
            <div
              class="truncate text-sm"
              :class="quest.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-100'"
            >
              {{ quest.title }}
            </div>
            <p v-if="quest.description" class="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
              {{ quest.description }}
            </p>
            <div class="mt-1 font-mono text-[10px] text-slate-500">
              {{ typeLabels[quest.type] }} / 截止 {{ formatDueDate(quest.dueAt) }} / 创建于
              {{ new Date(quest.createdAt).toLocaleString('zh-CN') }}
            </div>
          </div>
          <NTag size="small" :type="priorityTagType(quest.priority)">{{
            priorityLabels[quest.priority]
          }}</NTag>
          <NButton size="tiny" quaternary @click="startEditing(quest)">编辑</NButton>
          <NButton size="tiny" quaternary type="error" @click="deleteQuest(quest)">删除</NButton>
        </div>
      </div>
    </div>
  </section>
</template>
