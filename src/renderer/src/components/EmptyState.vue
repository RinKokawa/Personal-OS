<script setup lang="ts">
defineProps<{
  title: string
  description: string
}>()
</script>

<template>
  <div
    class="rounded-3xl border border-dashed border-cyan-300/16 bg-cyan-300/[0.025] p-8 text-center"
  >
    <div
      class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 font-mono text-cyan-100"
    >
      OS
    </div>
    <h3 class="text-lg font-semibold">{{ title }}</h3>
    <p class="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">{{ description }}</p>
    <div v-if="$slots.default" class="mt-5">
      <slot />
    </div>
  </div>
</template>
