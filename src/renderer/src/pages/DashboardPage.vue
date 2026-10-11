<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { NButton, NCard, NGrid, NGridItem, NStatistic, NTimeline, NTimelineItem } from 'naive-ui'
import PageHeader from '@renderer/components/PageHeader.vue'
import type { ActivityLog } from '../../../shared/models/activity'

const bootLogs = [
  '正在识别宿主……',
  '正在加载个人档案……',
  '正在建立本地数据连接……',
  '正在初始化辅助智能……',
  '系统初始化完成。欢迎回来，宿主。'
]

const activityLogs = ref<ActivityLog[]>([])

const timelineLogs = computed(() => {
  if (activityLogs.value.length === 0) return bootLogs

  return activityLogs.value.map((log) => `${log.title} // ${log.detail ?? log.action}`)
})

onMounted(async () => {
  const result = await window.api.activity.list({ limit: 5 })

  if (result.ok) {
    activityLogs.value = result.data
  }
})
</script>

<template>
  <PageHeader
    eyebrow="[ SYSTEM INITIALIZATION ]"
    title="The System Is Now Online."
    description="从现在开始，你的人生将拥有一个可以被观察、记录、规划与管理的界面。"
  />

  <div
    class="mb-6 rounded-3xl border border-cyan-300/15 bg-[#0c1420] p-6 shadow-[0_0_48px_rgba(34,211,238,0.06)]"
  >
    <div class="mb-4 font-mono text-xs tracking-[0.28em] text-cyan-200/70">SYSTEM MESSAGE</div>
    <div class="text-2xl font-semibold">宿主并未获得超能力。</div>
    <p class="mt-3 max-w-4xl text-slate-400">
      宿主只是获得了一套能够辅助理解自身、组织信息并执行复杂任务的系统。从某种意义上说，这已经足够接近超能力。
    </p>
  </div>

  <NGrid :cols="4" :x-gap="16" :y-gap="16" responsive="screen">
    <NGridItem>
      <NCard title="PROFILE">
        <NStatistic label="宿主档案" value="建立中" />
      </NCard>
    </NGridItem>
    <NGridItem>
      <NCard title="QUEST">
        <NStatistic label="可用任务" :value="0" />
      </NCard>
    </NGridItem>
    <NGridItem>
      <NCard title="JOURNAL">
        <NStatistic label="今日日志" value="未记录" />
      </NCard>
    </NGridItem>
    <NGridItem>
      <NCard title="AGENT">
        <NStatistic label="辅助智能" value="待授权" />
      </NCard>
    </NGridItem>
  </NGrid>

  <div class="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
    <NCard title="NEXT OBJECTIVE: BUILD THE SYSTEM">
      <p class="mb-5 text-slate-400">
        当前阶段为
        PRE-ALPHA。优先完成桌面基础、状态面板、任务系统、系统日志、本地数据存储与托盘能力。
      </p>
      <div class="flex flex-wrap gap-3">
        <NButton type="primary">NEW QUEST</NButton>
        <NButton secondary>WRITE LOG</NButton>
        <NButton secondary>OPEN INVENTORY</NButton>
      </div>
    </NCard>

    <NCard title="RECENT ACTIVITY">
      <NTimeline>
        <NTimelineItem v-for="log in timelineLogs" :key="log" type="success" :content="log" />
      </NTimeline>
    </NCard>
  </div>
</template>
