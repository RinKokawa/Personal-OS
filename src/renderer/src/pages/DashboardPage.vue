<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NProgress } from 'naive-ui'
import PageHeader from '@renderer/components/PageHeader.vue'
import type { ActivityLog } from '../../../shared/models/activity'
import type { JournalEntry } from '../../../shared/models/journal'
import type { Quest } from '../../../shared/models/quest'

const router = useRouter()
const activityLogs = ref<ActivityLog[]>([])
const quests = ref<Quest[]>([])
const journalEntries = ref<JournalEntry[]>([])

const fallbackLogs = [
  '正在识别宿主……',
  '正在加载个人档案……',
  '正在建立本地数据连接……',
  '正在初始化辅助智能……',
  '系统初始化完成。欢迎回来，宿主。'
]

const openQuests = computed(() => quests.value.filter((quest) => quest.status !== 'done'))
const completedQuests = computed(() => quests.value.filter((quest) => quest.status === 'done'))
const priorityQuests = computed(() => {
  const weight = { urgent: 4, high: 3, normal: 2, low: 1 }
  return [...openQuests.value]
    .sort(
      (a, b) => weight[b.priority] - weight[a.priority] || b.createdAt.localeCompare(a.createdAt)
    )
    .slice(0, 5)
})
const questProgress = computed(() => {
  if (quests.value.length === 0) return 0
  return Math.round((completedQuests.value.length / quests.value.length) * 100)
})

const timelineLogs = computed(() => {
  if (activityLogs.value.length === 0) {
    return fallbackLogs.map((title, index) => ({ title, detail: `BOOT SEQUENCE / ${index + 1}` }))
  }

  return activityLogs.value.map((log) => ({
    title: log.title,
    detail: log.detail ?? log.action
  }))
})

const metrics = computed(() => [
  {
    label: 'QUESTS COMPLETE',
    value: `${String(completedQuests.value.length).padStart(2, '0')} / ${String(quests.value.length).padStart(2, '0')}`,
    foot: openQuests.value.length ? `${openQuests.value.length} 项任务待完成` : '任务队列已清空'
  },
  { label: 'ABILITIES LOADED', value: '07', foot: '系统模块已挂载' },
  {
    label: 'JOURNAL ENTRIES',
    value: String(journalEntries.value.length).padStart(2, '0'),
    foot: journalEntries.value.length ? 'Markdown 记忆存档在线' : '等待第一条系统日志'
  },
  { label: 'AGENT PROCESSES', value: '00', foot: '待授权 / 安全待机' }
])

const quickAbilities = [
  ['AI ASSISTANT', 'DEMO MODE', '/agent-hub'],
  ['QUICK NOTE', 'READY', '/journal'],
  ['DATA EXPORT', 'LOCAL ONLY', '/settings']
]

function priorityLabel(priority: Quest['priority']): string {
  return priority.toUpperCase()
}

async function loadDashboard(): Promise<void> {
  const [activityResult, questResult, journalResult] = await Promise.all([
    window.api.activity.list({ limit: 5 }),
    window.api.quest.list({ status: 'all' }),
    window.api.journal.list({ limit: 100 })
  ])

  if (activityResult.ok) {
    activityLogs.value = activityResult.data
  }

  if (questResult.ok) {
    quests.value = questResult.data
  }

  if (journalResult.ok) {
    journalEntries.value = journalResult.data
  }
}

onMounted(loadDashboard)
</script>

<template>
  <PageHeader
    eyebrow="SYSTEM / 01 — COMMAND CENTER"
    title="系统主控台"
    description="所有状态均由你定义。欢迎进入属于你的个人系统。"
  />

  <section
    class="relative mb-4 min-h-58 overflow-hidden border border-cyan-200/25 bg-[radial-gradient(ellipse_at_76%_65%,rgba(121,239,218,0.10),transparent_34%),linear-gradient(120deg,#15242f,#0f1822_75%)]"
  >
    <div class="absolute inset-0 opacity-45 system-grid-small"></div>
    <div class="relative z-1 flex min-h-58 items-center justify-between gap-8 p-8">
      <div>
        <div class="font-mono text-[10px] tracking-[0.22em] text-cyan-200">
          [ SESSION ID: LOCAL-{{ new Date().getFullYear() }} ]
        </div>
        <h2 class="mt-5 text-5xl font-bold tracking-tight text-white">
          欢迎回来，<span class="text-cyan-200">宿主。</span>
        </h2>
        <p class="mt-4 max-w-xl text-sm leading-7 text-slate-400">
          系统内核运行正常。SQLite 数据层已经接入，QUEST
          与活动日志正在记录真实状态。请选择你的下一项行动。
        </p>
        <div
          class="mt-7 flex items-center gap-3 font-mono text-[10px] tracking-[0.16em] text-cyan-200"
        >
          <span
            class="h-1.5 w-1.5 rounded-full bg-cyan-200 shadow-[0_0_12px_rgba(121,239,218,0.9)]"
          ></span>
          ALL SYSTEMS NOMINAL
        </div>
      </div>

      <div class="relative hidden h-52 w-52 place-items-center lg:grid">
        <div
          class="absolute inset-0 animate-spin rounded-full border border-dashed border-cyan-200/25 [animation-duration:50s]"
        ></div>
        <div
          class="absolute inset-5 animate-spin rounded-full border border-cyan-200/25 border-b-cyan-200 border-t-cyan-200 [animation-duration:22s] [animation-direction:reverse]"
        ></div>
        <div class="absolute inset-x-0 top-1/2 h-px bg-cyan-200/15"></div>
        <div class="absolute inset-y-0 left-1/2 w-px bg-cyan-200/15"></div>
        <div class="relative z-1 text-center font-mono text-2xl text-cyan-200">
          ONLINE
          <small class="mt-2 block text-[9px] tracking-[0.18em] text-slate-400"
            >CORE / STABLE</small
          >
        </div>
      </div>
    </div>
  </section>

  <div class="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
    <div
      v-for="metric in metrics"
      :key="metric.label"
      class="relative border border-cyan-200/10 bg-[#101a24] p-5"
    >
      <div class="font-mono text-[10px] tracking-[0.12em] text-slate-500">{{ metric.label }}</div>
      <div class="mt-3 font-mono text-3xl text-white">{{ metric.value }}</div>
      <div class="mt-2 text-xs text-slate-500">{{ metric.foot }}</div>
      <div class="absolute right-4 top-4 text-cyan-200/50">◇</div>
    </div>
  </div>

  <div class="grid gap-4 xl:grid-cols-[1.35fr_0.8fr]">
    <div class="space-y-4">
      <section class="border border-cyan-200/10 bg-[#101923]/80 p-6">
        <div class="mb-5 flex items-center justify-between">
          <div>
            <div class="label-line">PRIORITY QUEUE</div>
            <h3 class="mt-2 text-base font-semibold text-white">当前任务</h3>
          </div>
          <NButton secondary @click="router.push('/todo')">查看全部 →</NButton>
        </div>
        <div
          v-if="priorityQuests.length === 0"
          class="rounded border border-dashed border-cyan-200/15 px-6 py-10 text-center text-sm text-slate-500"
        >
          当前没有待执行任务。前往 QUEST 发布新的行动指令。
        </div>
        <div v-else class="divide-y divide-cyan-200/10">
          <div v-for="quest in priorityQuests" :key="quest.id" class="flex items-center gap-4 py-3">
            <div class="h-4 w-4 shrink-0 border border-slate-600"></div>
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm text-slate-100">{{ quest.title }}</div>
              <div class="mt-1 font-mono text-[10px] text-slate-500">
                {{ quest.type.toUpperCase() }} /
                {{ new Date(quest.createdAt).toLocaleString('zh-CN') }}
              </div>
            </div>
            <span class="border border-cyan-200/15 px-2 py-1 font-mono text-[9px] text-cyan-200">
              {{ priorityLabel(quest.priority) }}
            </span>
          </div>
        </div>
        <div
          class="mt-5 flex items-center justify-between font-mono text-[10px] tracking-[0.12em] text-slate-400"
        >
          <span>QUEST PROGRESS</span>
          <span>{{ questProgress }}% COMPLETE</span>
        </div>
        <NProgress class="mt-2" type="line" :percentage="questProgress" :show-indicator="false" />
      </section>

      <section class="border border-cyan-200/10 bg-[#101923]/80 p-6">
        <div class="mb-5 flex items-center justify-between">
          <div>
            <div class="label-line">AVAILABLE ABILITIES</div>
            <h3 class="mt-2 text-base font-semibold text-white">快速调用</h3>
          </div>
          <NButton secondary @click="router.push('/toolbox')">所有模块 →</NButton>
        </div>
        <div class="grid gap-3 md:grid-cols-3">
          <button
            v-for="ability in quickAbilities"
            :key="ability[0]"
            class="border border-cyan-200/10 bg-[#14222d] px-4 py-6 text-center transition hover:-translate-y-0.5 hover:border-cyan-200/50 hover:bg-cyan-200/[0.06]"
            @click="router.push(ability[2])"
          >
            <div class="text-2xl text-cyan-200">✦</div>
            <div class="mt-3 text-xs font-semibold text-slate-200">{{ ability[0] }}</div>
            <div class="mt-2 font-mono text-[9px] tracking-[0.16em] text-slate-500">
              {{ ability[1] }}
            </div>
          </button>
        </div>
      </section>
    </div>

    <div class="space-y-4">
      <section class="border border-cyan-200/10 bg-[#101923]/80 p-6">
        <div class="label-line">SYSTEM TELEMETRY</div>
        <h3 class="mt-2 text-base font-semibold text-white">宿主状态</h3>
        <div class="mt-6 flex items-center gap-4">
          <div
            class="grid h-14 w-14 place-items-center border border-slate-600 bg-[#162430] font-mono text-xl text-slate-200"
          >
            01
          </div>
          <div>
            <div class="font-semibold text-white">SYSTEM USER</div>
            <div class="mt-1 font-mono text-[10px] tracking-[0.16em] text-slate-500">
              权限等级 // ADMINISTRATOR
            </div>
          </div>
        </div>
        <div class="mt-6 space-y-3 text-sm">
          <div class="flex justify-between border-t border-cyan-200/10 pt-3">
            <span class="text-slate-400">数据来源</span
            ><span class="font-mono text-cyan-200">LOCAL SQLITE</span>
          </div>
          <div class="flex justify-between border-t border-cyan-200/10 pt-3">
            <span class="text-slate-400">任务进度</span
            ><span class="font-mono text-cyan-200">{{ questProgress }}%</span>
          </div>
          <div class="flex justify-between border-t border-cyan-200/10 pt-3">
            <span class="text-slate-400">运行时状态</span
            ><span class="font-mono text-cyan-200">ACTIVE</span>
          </div>
          <div class="flex justify-between border-t border-cyan-200/10 pt-3">
            <span class="text-slate-400">当前版本</span
            ><span class="font-mono text-slate-400">PRE-ALPHA</span>
          </div>
        </div>
      </section>

      <section class="border border-cyan-200/10 bg-[#101923]/80 p-6">
        <div class="mb-5 flex items-center justify-between">
          <div>
            <div class="label-line">RECENT ACTIVITY</div>
            <h3 class="mt-2 text-base font-semibold text-white">系统事件</h3>
          </div>
          <span class="font-mono text-[10px] tracking-[0.16em] text-cyan-200">LIVE LOG</span>
        </div>
        <div class="space-y-4">
          <div
            v-for="(log, index) in timelineLogs"
            :key="`${log.title}-${index}`"
            class="flex gap-3 border-t border-cyan-200/10 pt-4 first:border-t-0 first:pt-0"
          >
            <div
              class="grid h-6 w-6 shrink-0 place-items-center border border-cyan-200/25 font-mono text-[10px] text-cyan-200"
            >
              {{ String(index + 1).padStart(2, '0') }}
            </div>
            <div>
              <div class="text-xs text-slate-200">{{ log.title }}</div>
              <div class="mt-1 font-mono text-[10px] text-slate-500">{{ log.detail }}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
