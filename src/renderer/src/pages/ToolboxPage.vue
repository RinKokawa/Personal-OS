<script setup lang="ts">
import { NButton } from 'naive-ui'
import PageHeader from '@renderer/components/PageHeader.vue'

const modules = [
  {
    id: 'planner',
    zh: '任务系统',
    name: 'QUEST MANAGER',
    desc: '建立目标、拆解任务、追踪进度。',
    on: true
  },
  {
    id: 'journal',
    zh: '系统日志',
    name: 'MEMORY ARCHIVE',
    desc: '记录日常经历和想法，构建个人记忆库。',
    on: true
  },
  {
    id: 'agent',
    zh: '辅助智能',
    name: 'AGENT ADAPTER',
    desc: '用于对接 Pi 等智能代理的统一接口。',
    on: false
  },
  {
    id: 'inventory',
    zh: '资源物品栏',
    name: 'INVENTORY',
    desc: '组织本地文件、资源索引和个人工具。',
    on: false
  },
  {
    id: 'skills',
    zh: '成长技能树',
    name: 'SKILL MATRIX',
    desc: '关联知识、练习与可验证的成长成果。',
    on: false
  },
  {
    id: 'automation',
    zh: '自动化能力',
    name: 'AUTOMATION',
    desc: '管理规则、计划任务与系统工作流。',
    on: false
  }
]
</script>

<template>
  <PageHeader
    eyebrow="SYSTEM / 05 — ABILITY CENTER"
    title="能力中心"
    description="系统的上限由你创造。安装、禁用或扩展属于自己的能力。"
  />

  <div
    class="mb-4 border border-cyan-200/20 bg-[#132430] px-5 py-4 text-sm leading-7 text-slate-300"
  >
    <b class="font-mono text-cyan-200">[ SYSTEM MODULE REGISTRY ]</b>
    <span class="ml-2 text-slate-400"
      >以下为模块注册表视觉层。真实插件机制将在权限模型完成后解锁。</span
    >
  </div>

  <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    <section
      v-for="module in modules"
      :key="module.id"
      class="relative min-h-56 border border-cyan-200/10 bg-[linear-gradient(145deg,#192632,#0f1922)] p-6 transition hover:-translate-y-0.5 hover:border-cyan-200/40"
    >
      <div class="absolute right-4 top-3 font-mono text-xl text-cyan-200/25">+</div>
      <div
        class="grid h-12 w-12 place-items-center border border-cyan-200/40 bg-cyan-200/[0.04] text-2xl text-cyan-200"
      >
        ✦
      </div>
      <div class="mt-5 font-mono text-[10px] tracking-[0.16em] text-slate-500">
        SYS.MODULE.{{ module.id.toUpperCase() }}
      </div>
      <h3 class="mt-2 text-base font-semibold text-white">{{ module.zh }}</h3>
      <p class="mt-3 text-xs leading-6 text-slate-400">{{ module.desc }}</p>
      <div class="mt-6 flex items-center justify-between gap-3">
        <span
          class="font-mono text-[9px] tracking-[0.14em]"
          :class="module.on ? 'text-cyan-200' : 'text-slate-500'"
        >
          ● {{ module.on ? 'INITIALIZED' : 'NOT INSTALLED' }}
        </span>
        <NButton size="small" :type="module.on ? 'default' : 'primary'" secondary>
          {{ module.on ? '查看' : '启用' }}
        </NButton>
      </div>
    </section>
  </div>

  <section class="mt-4 border border-cyan-200/10 bg-[#101923]/80 p-6">
    <div class="label-line">MODULE DEVELOPER SDK</div>
    <h3 class="mt-2 text-base font-semibold text-white">开发者入口</h3>
    <pre
      class="mt-5 overflow-auto border border-cyan-200/10 bg-[#080f15] p-5 text-xs leading-7 text-cyan-100/80"
    ><code>export default defineModule({
  id: 'my-system',
  name: 'My System',
  activate(ctx) {
    ctx.commands.register({
      id: 'awaken',
      title: '系统觉醒',
      execute: () => ctx.notifications.show('能力解锁')
    })
  }
})</code></pre>
  </section>
</template>
