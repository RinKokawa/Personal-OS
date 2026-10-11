<script setup lang="ts">
import { ref } from 'vue'
import { NButton } from 'naive-ui'
import PageHeader from '@renderer/components/PageHeader.vue'

const running = ref(false)
const terminalLines = ref([
  { type: 'muted', text: '// PERSONAL OS AGENT RUNTIME [STANDBY]' },
  { type: 'prompt', text: '> 等待宿主的执行指令_' }
])

const demoLines = [
  { type: 'prompt', text: '> initializing mock agent runtime...' },
  { type: '', text: '[00:00.8] Starting local session simulation' },
  { type: '', text: '[00:01.5] Checking proposed permissions...' },
  { type: 'warn', text: '[00:02.2] File system access: DENIED (demo mode)' },
  { type: '', text: '[00:03.0] Running sample planning workflow' },
  { type: 'prompt', text: '[00:04.8] RESULT: 3 subtasks suggested' }
]

function toggleDemo(): void {
  running.value = !running.value
  terminalLines.value = running.value
    ? demoLines
    : [
        { type: 'muted', text: '// PERSONAL OS AGENT RUNTIME [STANDBY]' },
        { type: 'prompt', text: '> 等待宿主的执行指令_' }
      ]
}
</script>

<template>
  <PageHeader
    eyebrow="SYSTEM / 06 — AGENT CONTROL"
    title="辅助智能"
    description="管理 Agent 会话、执行状态与权限。当前只展示安全边界和本地模拟，不执行真实命令。"
  />

  <div
    class="mb-4 border border-amber-300/25 bg-amber-300/[0.07] px-5 py-4 text-sm leading-7 text-amber-100/80"
  >
    <b class="font-mono text-amber-200">DEMO / NO REAL AI EXECUTION</b>
    <span class="ml-2"
      >此页面不会执行 Shell 命令，也不会调用模型 API。模拟日志用于验证实时交互表现。</span
    >
  </div>

  <div class="grid gap-4 xl:grid-cols-[1.35fr_0.75fr]">
    <section class="border border-cyan-200/10 bg-[#101923]/80 p-6">
      <div class="mb-5 flex items-center justify-between">
        <div>
          <div class="label-line">AGENT EXECUTION STREAM</div>
          <h3 class="mt-2 text-base font-semibold text-white">运行终端</h3>
        </div>
        <span
          class="border px-2 py-1 font-mono text-[9px] tracking-[0.16em]"
          :class="running ? 'border-cyan-200/30 text-cyan-200' : 'border-slate-600 text-slate-500'"
        >
          {{ running ? '● RUNNING' : '○ STANDBY' }}
        </span>
      </div>

      <div
        class="min-h-72 overflow-auto border border-cyan-200/10 bg-[#080e14] p-5 font-mono text-xs leading-7"
      >
        <div
          v-for="line in terminalLines"
          :key="line.text"
          :class="{
            'text-cyan-200': line.type === 'prompt',
            'text-amber-200': line.type === 'warn',
            'text-slate-500': line.type === 'muted',
            'text-slate-400': !line.type
          }"
        >
          {{ line.text }}
        </div>
      </div>

      <div class="mt-4 flex items-center justify-between">
        <span class="font-mono text-[10px] tracking-[0.14em] text-slate-500"
          >PROVIDER: MOCK RUNTIME</span
        >
        <NButton :type="running ? 'default' : 'primary'" @click="toggleDemo">
          {{ running ? '结束演示' : '启动演示' }}
        </NButton>
      </div>
    </section>

    <div class="space-y-4">
      <section class="border border-cyan-200/10 bg-[#101923]/80 p-6">
        <div class="label-line">ACTIVE CONFIGURATION</div>
        <h3 class="mt-2 text-base font-semibold text-white">Agent 配置</h3>
        <div class="mt-5 space-y-3 text-sm">
          <div class="flex justify-between border-t border-cyan-200/10 pt-3">
            <span class="text-slate-400">适配器</span
            ><span class="font-mono text-cyan-200">Pi RPC / PLANNED</span>
          </div>
          <div class="flex justify-between border-t border-cyan-200/10 pt-3">
            <span class="text-slate-400">执行模式</span
            ><span class="font-mono text-slate-300">SIMULATION</span>
          </div>
          <div class="flex justify-between border-t border-cyan-200/10 pt-3">
            <span class="text-slate-400">文件权限</span
            ><span class="font-mono text-amber-200">NOT GRANTED</span>
          </div>
          <div class="flex justify-between border-t border-cyan-200/10 pt-3">
            <span class="text-slate-400">网络访问</span
            ><span class="font-mono text-slate-400">DISABLED</span>
          </div>
          <div class="flex justify-between border-t border-cyan-200/10 pt-3">
            <span class="text-slate-400">执行进程</span
            ><span class="font-mono text-slate-300">{{ running ? '1 MOCK JOB' : '0 JOBS' }}</span>
          </div>
        </div>
      </section>

      <section class="border border-cyan-200/10 bg-[#101923]/80 p-6">
        <div class="label-line">SECURITY PROTOCOL</div>
        <h3 class="mt-2 text-base font-semibold text-white">宿主拥有最终授权权</h3>
        <p class="mt-4 text-sm leading-7 text-slate-400">
          正式系统中的 Agent
          将通过独立进程与受控接口运行。任何文件写入、网络请求或命令执行都必须经过权限模型。
        </p>
      </section>
    </div>
  </div>
</template>
