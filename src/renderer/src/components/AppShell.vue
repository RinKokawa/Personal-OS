<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { NButton, NConfigProvider, NGlobalStyle, NMessageProvider, darkTheme } from 'naive-ui'
import { navigationItems } from '@renderer/router'
import { useAppStore } from '@renderer/stores/app'

const route = useRoute()
const appStore = useAppStore()

const activeNavigation = computed(() => {
  return navigationItems.find((item) => item.key === route.name)?.label ?? 'STATUS'
})
</script>

<template>
  <NConfigProvider :theme="darkTheme">
    <NMessageProvider>
      <NGlobalStyle />
      <div class="min-h-screen bg-[#080b10] text-slate-100">
        <aside
          class="fixed inset-y-0 left-0 z-10 w-72 border-r border-cyan-300/10 bg-[#0d121a]/95 px-4 py-5 shadow-[0_0_40px_rgba(34,211,238,0.05)] backdrop-blur"
        >
          <div class="mb-8 rounded-3xl border border-cyan-300/10 bg-cyan-300/[0.03] p-4">
            <div class="text-xs uppercase tracking-[0.34em] text-cyan-200/70">PERSONAL OS</div>
            <div class="mt-2 text-2xl font-semibold text-white">SYSTEM ONLINE</div>
            <div class="mt-3 text-xs leading-5 text-slate-400">
              MODE: LOCAL FIRST<br />USER AUTHORITY: MAXIMUM
            </div>
          </div>

          <nav class="space-y-1">
            <RouterLink
              v-for="item in navigationItems"
              :key="item.key"
              :to="item.path"
              class="block rounded-2xl px-4 py-3 text-slate-300 transition hover:bg-cyan-300/8 hover:text-white"
              :class="{
                'bg-cyan-300/12 text-white ring-1 ring-cyan-300/25 shadow-[0_0_24px_rgba(34,211,238,0.08)]':
                  route.name === item.key
              }"
            >
              <div class="font-mono text-sm font-semibold tracking-[0.18em]">{{ item.label }}</div>
              <div class="mt-1 text-xs text-slate-400">{{ item.description }}</div>
            </RouterLink>
          </nav>
        </aside>

        <main class="ml-72 min-h-screen">
          <header
            class="sticky top-0 z-5 flex h-18 items-center justify-between border-b border-cyan-300/10 bg-[#080b10]/85 px-8 backdrop-blur"
          >
            <div>
              <div class="font-mono text-xs tracking-[0.24em] text-cyan-200/60">CURRENT MODULE</div>
              <h1 class="font-mono text-xl font-semibold tracking-[0.16em]">
                {{ activeNavigation }}
              </h1>
            </div>
            <div class="flex items-center gap-3">
              <NButton secondary @click="appStore.toggleCommandPanel">COMMAND</NButton>
              <NButton type="primary">NEW LOG</NButton>
            </div>
          </header>

          <section class="px-8 py-7">
            <RouterView />
          </section>
        </main>
      </div>
    </NMessageProvider>
  </NConfigProvider>
</template>
