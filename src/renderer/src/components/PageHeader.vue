<script setup lang="ts">
defineProps<{
  eyebrow?: string
  title: string
  description: string
}>()
</script>

<template>
  <div class="mb-6">
    <div v-if="eyebrow" class="mb-2 font-mono text-xs uppercase tracking-[0.3em] text-cyan-200/65">
      {{ eyebrow }}
    </div>
    <h2 class="text-3xl font-semibold tracking-tight text-white">{{ title }}</h2>
    <p class="mt-2 max-w-3xl text-slate-400">{{ description }}</p>
  </div>
</template>
