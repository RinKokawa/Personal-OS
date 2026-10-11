<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { navigationItems } from '@renderer/router'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const router = useRouter()
const query = ref('')

const commands = computed(() => [
  ...navigationItems.map((item) => ({
    title: `打开 ${item.label}`,
    hint: item.description,
    run: () => router.push(item.path)
  })),
  {
    title: '创建新任务',
    hint: 'QUEST / NEW',
    run: () => router.push('/todo')
  },
  {
    title: '写入系统日志',
    hint: 'JOURNAL / NEW',
    run: () => router.push('/journal')
  }
])

const filteredCommands = computed(() => {
  const text = query.value.trim().toLowerCase()
  if (!text) return commands.value
  return commands.value.filter((command) =>
    `${command.title} ${command.hint}`.toLowerCase().includes(text)
  )
})

function run(command: (typeof commands.value)[number]): void {
  command.run()
  emit('close')
}

watch(
  () => props.show,
  (show) => {
    if (show) query.value = ''
  }
)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-40 flex items-start justify-center bg-black/70 px-4 pt-[14vh] backdrop-blur-md"
      @click.self="emit('close')"
    >
      <div
        class="w-[min(620px,100%)] border border-cyan-200/25 bg-[#101923] shadow-[0_30px_120px_rgba(0,0,0,0.75)]"
      >
        <input
          v-model="query"
          autofocus
          class="w-full border-0 border-b border-cyan-200/10 bg-transparent px-6 py-5 text-base text-slate-100 outline-none placeholder:text-slate-500"
          placeholder="输入命令、模块或关键词…"
          @keydown.esc="emit('close')"
        />
        <div class="max-h-96 overflow-auto p-3">
          <button
            v-for="command in filteredCommands"
            :key="command.title"
            class="flex w-full items-center justify-between border border-transparent px-4 py-3 text-left text-slate-300 transition hover:border-cyan-200/25 hover:bg-cyan-200/[0.06] hover:text-white"
            @click="run(command)"
          >
            <span>{{ command.title }}</span>
            <span class="font-mono text-[10px] tracking-[0.16em] text-slate-500">{{
              command.hint
            }}</span>
          </button>
          <div
            v-if="filteredCommands.length === 0"
            class="px-4 py-10 text-center text-sm text-slate-500"
          >
            没有找到匹配的指令。
          </div>
        </div>
        <div
          class="flex justify-between border-t border-cyan-200/10 px-5 py-3 font-mono text-[10px] tracking-[0.14em] text-slate-500"
        >
          <span>ENTER / CLICK 执行</span>
          <span>ESC 关闭</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>
