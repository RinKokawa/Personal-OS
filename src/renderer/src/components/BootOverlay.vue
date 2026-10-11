<script setup lang="ts">
import { onMounted, ref } from 'vue'
const emit = defineEmits<{
  enter: []
}>()

const percent = ref(0)
const phase = ref('INITIALIZING CORE')
const log = ref('正在建立本地连接')
const ready = ref(false)

const phases = [
  [16, 'INITIALIZING CORE', '正在初始化系统核心'],
  [38, 'VERIFYING MODULES', '正在校验可用模块'],
  [59, 'ESTABLISHING MEMORY', '正在连接个人记忆存档'],
  [78, 'CHECKING PERMISSIONS', '正在初始化系统授权边界'],
  [100, 'CORE ONLINE', '系统已就绪。等待宿主进入。']
] as const

onMounted(() => {
  phases.forEach(([nextPercent, nextPhase, nextLog], index) => {
    window.setTimeout(
      () => {
        percent.value = nextPercent
        phase.value = nextPhase
        log.value = nextLog
        if (nextPercent === 100) {
          window.setTimeout(() => {
            ready.value = true
          }, 520)
        }
      },
      520 + index * 650
    )
  })
})
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#070c12] text-slate-100"
  >
    <div class="absolute inset-0 opacity-35 boot-grid"></div>
    <div
      class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(121,239,218,0.16),transparent_42%)]"
    ></div>
    <div
      class="absolute left-8 right-8 top-8 flex justify-between font-mono text-[10px] tracking-[0.22em] text-slate-400"
    >
      <span>PERSONAL OS <b class="text-cyan-200">// GENESIS PROTOCOL</b></span>
      <span>BUILD 0.1 / LOCAL ENV</span>
    </div>

    <div class="relative z-10 flex w-[min(820px,90vw)] flex-col items-center text-center">
      <div class="relative mb-5 h-56 w-56">
        <div
          class="absolute inset-0 animate-spin rounded-full border border-dashed border-cyan-200/35 [animation-duration:42s]"
        ></div>
        <div
          class="absolute inset-5 animate-spin rounded-full border border-cyan-200/20 border-l-cyan-200 border-r-cyan-200 [animation-duration:15s] [animation-direction:reverse]"
        ></div>
        <div
          class="absolute inset-12 grid place-items-center border border-cyan-200/40 bg-cyan-200/[0.03] [clip-path:polygon(50%_0,94%_25%,94%_75%,50%_100%,6%_75%,6%_25%)]"
        >
          <div
            class="font-mono text-5xl text-cyan-100 drop-shadow-[0_0_24px_rgba(121,239,218,0.25)]"
          >
            OS
          </div>
        </div>
      </div>

      <div class="mb-3 font-mono text-xs tracking-[0.45em] text-cyan-200">
        [ PERSONAL INTELLIGENCE INTERFACE ]
      </div>
      <h1 class="text-[clamp(54px,8vw,98px)] font-black leading-none tracking-[-0.08em] text-white">
        PERSONAL
        <span class="block text-transparent [-webkit-text-stroke:1px_rgba(220,250,248,0.6)]"
          >SYSTEM</span
        >
      </h1>
      <div class="mt-5 font-mono text-xs tracking-[0.45em] text-slate-400">
        你的系统，由你定义。
      </div>

      <div class="mt-9 w-[min(460px,80vw)]">
        <div
          class="mb-3 flex justify-between font-mono text-[10px] tracking-[0.16em] text-cyan-200"
        >
          <span>{{ phase }}</span>
          <span>{{ String(percent).padStart(2, '0') }}%</span>
        </div>
        <div class="h-[2px] overflow-hidden bg-slate-700">
          <div
            class="h-full bg-cyan-200 shadow-[0_0_16px_rgba(121,239,218,0.9)] transition-all duration-500"
            :style="{ width: `${percent}%` }"
          ></div>
        </div>
        <div class="mt-4 text-left font-mono text-xs text-slate-400">&gt; {{ log }}</div>
      </div>

      <div class="mt-8 flex h-[38px] items-center justify-center">
        <Transition name="boot-enter">
          <button
            v-if="ready"
            class="border border-cyan-200 bg-cyan-200 px-8 py-2.5 font-mono text-xs font-bold tracking-[0.18em] text-[#071211] shadow-[0_0_28px_rgba(121,239,218,0.2)] transition-[filter,box-shadow] hover:brightness-110"
            @click="emit('enter')"
          >
            进入系统 →
          </button>
        </Transition>
      </div>
    </div>

    <div
      class="absolute bottom-7 left-8 right-8 flex justify-between font-mono text-[10px] tracking-[0.14em] text-slate-500"
    >
      <span>SECURE LOCAL RUNTIME <span class="text-cyan-200">●</span> STANDBY</span>
      <span>NO CLOUD CONNECTION REQUIRED</span>
    </div>
  </div>
</template>

<style scoped>
.boot-enter-enter-active {
  overflow: hidden;
  transition:
    clip-path 880ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 180ms ease-out;
}

.boot-enter-enter-from {
  clip-path: inset(0 50% 0 50%);
  opacity: 0;
}

.boot-enter-enter-to {
  clip-path: inset(0 0 0 0);
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .boot-enter-enter-active {
    transition: opacity 120ms ease-out;
  }

  .boot-enter-enter-from {
    clip-path: none;
  }
}
</style>
