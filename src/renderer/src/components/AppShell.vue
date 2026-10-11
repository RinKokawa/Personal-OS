<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { NConfigProvider, NGlobalStyle, NMessageProvider, darkTheme } from 'naive-ui'
import BootOverlay from '@renderer/components/BootOverlay.vue'
import CommandPalette from '@renderer/components/CommandPalette.vue'
import { navigationItems } from '@renderer/router'
import { useAppStore } from '@renderer/stores/app'

const route = useRoute()
const appStore = useAppStore()
const showBoot = ref(!sessionStorage.getItem('personal-os.booted'))
const clock = ref(new Date())
let timer: number | undefined

const activeNavigation = computed(() => {
  return navigationItems.find((item) => item.key === route.name)?.label ?? 'STATUS'
})

const systemCoreItems = computed(() => navigationItems.slice(0, 4))
const extensionItems = computed(() => navigationItems.slice(4))

function enterSystem(): void {
  sessionStorage.setItem('personal-os.booted', 'true')
  showBoot.value = false
}

function openCommandPanel(): void {
  if (!appStore.commandPanelOpen) appStore.toggleCommandPanel()
}

function closeCommandPanel(): void {
  if (appStore.commandPanelOpen) appStore.toggleCommandPanel()
}

function handleKeydown(event: KeyboardEvent): void {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    appStore.toggleCommandPanel()
  }
}

onMounted(() => {
  timer = window.setInterval(() => {
    clock.value = new Date()
  }, 1000)
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  if (timer) window.clearInterval(timer)
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <NConfigProvider :theme="darkTheme">
    <NMessageProvider>
      <NGlobalStyle />
      <BootOverlay v-if="showBoot" @enter="enterSystem" />
      <CommandPalette :show="appStore.commandPanelOpen" @close="closeCommandPanel" />

      <div
        class="system-bg grid h-screen grid-cols-[226px_minmax(0,1fr)] grid-rows-[64px_minmax(0,1fr)_30px] overflow-hidden bg-[#080c12] text-slate-100"
      >
        <header
          class="col-span-2 flex items-center justify-between border-b border-cyan-200/15 bg-[#0c131b]/95 px-6 backdrop-blur"
        >
          <div class="flex w-[226px] shrink-0 items-center gap-3">
            <div
              class="grid h-9 w-9 place-items-center border border-cyan-200 text-cyan-200 [clip-path:polygon(22%_0,78%_0,100%_22%,100%_78%,78%_100%,22%_100%,0_78%,0_22%)]"
            >
              ◈
            </div>
            <div>
              <div class="font-mono text-base font-bold tracking-[0.18em] text-white">
                PERSONAL OS
              </div>
              <div class="mt-1 font-mono text-[9px] tracking-[0.14em] text-slate-500">
                SYSTEM FRAMEWORK / 0.1
              </div>
            </div>
          </div>

          <div class="min-w-0 flex-1 font-mono text-[10px] tracking-[0.16em] text-slate-500">
            SYS <span class="mx-2">/</span>
            <span class="text-cyan-200">{{ activeNavigation }}</span>
          </div>

          <div class="flex items-center gap-4">
            <button
              class="hidden min-w-56 items-center gap-3 border border-cyan-200/15 bg-[#111d27] px-3 py-2 text-left text-xs text-slate-400 transition hover:border-cyan-200/40 hover:text-slate-100 md:flex"
              @click="openCommandPanel"
            >
              <span>搜索或执行命令...</span>
              <kbd
                class="ml-auto border border-slate-600 px-1.5 py-0.5 font-mono text-[10px] text-slate-400"
                >CTRL K</kbd
              >
            </button>
            <div class="hidden text-right font-mono md:block">
              <div class="text-sm tracking-[0.12em] text-slate-200">
                {{ clock.toLocaleTimeString('zh-CN', { hour12: false }) }}
              </div>
              <div class="mt-0.5 text-[9px] tracking-[0.12em] text-slate-500">
                {{ clock.toLocaleDateString('zh-CN').replaceAll('/', ' . ') }}
              </div>
            </div>
            <span
              class="h-2 w-2 rounded-full bg-cyan-200 shadow-[0_0_14px_rgba(121,239,218,0.9)]"
            ></span>
          </div>
        </header>

        <aside class="overflow-y-auto border-r border-cyan-200/15 bg-[#0c131b] px-3 py-6">
          <div class="mb-3 px-3 font-mono text-[10px] tracking-[0.18em] text-slate-500">
            // SYSTEM CORE
          </div>
          <nav class="space-y-1">
            <RouterLink
              v-for="item in systemCoreItems"
              :key="item.key"
              :to="item.path"
              class="group flex h-12 items-center gap-3 border border-transparent px-3 text-slate-400 transition hover:bg-cyan-200/[0.05] hover:text-white"
              :class="{
                'border-cyan-200/20 bg-cyan-200/[0.07] text-cyan-200 shadow-[inset_2px_0_0_#79efda]':
                  route.name === item.key
              }"
            >
              <span class="font-mono text-[10px] text-slate-600 group-hover:text-cyan-200"
                >0{{ systemCoreItems.indexOf(item) + 1 }}</span
              >
              <span>
                <span class="block font-mono text-xs tracking-[0.14em]">{{ item.label }}</span>
                <span class="mt-0.5 block text-[10px] text-slate-500">{{ item.description }}</span>
              </span>
            </RouterLink>
          </nav>

          <div class="mb-3 mt-8 px-3 font-mono text-[10px] tracking-[0.18em] text-slate-500">
            // EXTENSIONS
          </div>
          <nav class="space-y-1">
            <RouterLink
              v-for="item in extensionItems"
              :key="item.key"
              :to="item.path"
              class="group flex h-12 items-center gap-3 border border-transparent px-3 text-slate-400 transition hover:bg-cyan-200/[0.05] hover:text-white"
              :class="{
                'border-cyan-200/20 bg-cyan-200/[0.07] text-cyan-200 shadow-[inset_2px_0_0_#79efda]':
                  route.name === item.key
              }"
            >
              <span class="font-mono text-[10px] text-slate-600 group-hover:text-cyan-200"
                >0{{ navigationItems.indexOf(item) + 1 }}</span
              >
              <span>
                <span class="block font-mono text-xs tracking-[0.14em]">{{ item.label }}</span>
                <span class="mt-0.5 block text-[10px] text-slate-500">{{ item.description }}</span>
              </span>
            </RouterLink>
          </nav>

          <div class="mt-10 border-t border-cyan-200/10 px-3 pt-4">
            <div class="flex items-center gap-3">
              <div
                class="grid h-9 w-9 place-items-center border border-slate-600 bg-[#162430] font-mono text-sm text-slate-300"
              >
                01
              </div>
              <div>
                <div class="text-xs font-semibold text-slate-200">SYSTEM USER</div>
                <div class="mt-1 font-mono text-[9px] tracking-[0.14em] text-slate-500">
                  HOST / LOCAL-001
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main class="min-w-0 overflow-auto">
          <section class="mx-auto max-w-[1670px] px-8 py-8">
            <RouterView />
          </section>
        </main>

        <footer
          class="col-span-2 flex items-center justify-between border-t border-cyan-200/20 bg-cyan-200/[0.07] px-5 font-mono text-[9px] tracking-[0.08em] text-cyan-100/70"
        >
          <div class="flex items-center gap-5">
            <span
              ><span class="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-cyan-200"></span>CORE
              ONLINE</span
            >
            <span>DATA: LOCAL SQLITE</span>
            <span>WORKSPACE: LOCAL</span>
          </div>
          <div class="flex items-center gap-5">
            <span>MODULES 07/07</span>
            <span>PERSONAL OS • SYSTEM AWAKENING</span>
            <button class="text-cyan-100/70 hover:text-cyan-100" @click="showBoot = true">
              REBOOT UI
            </button>
          </div>
        </footer>
      </div>
    </NMessageProvider>
  </NConfigProvider>
</template>
