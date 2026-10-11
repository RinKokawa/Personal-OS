import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

export type AppRouteName =
  'dashboard' | 'todo' | 'journal' | 'projects' | 'toolbox' | 'agent-hub' | 'settings'

export interface NavigationItem {
  key: AppRouteName
  label: string
  description: string
  path: string
}

export const navigationItems: NavigationItem[] = [
  { key: 'dashboard', label: 'STATUS', description: '宿主状态与系统面板', path: '/' },
  { key: 'todo', label: 'QUEST', description: '主线、支线与每日任务', path: '/todo' },
  { key: 'journal', label: 'JOURNAL', description: '系统日志与个人历史', path: '/journal' },
  { key: 'projects', label: 'INVENTORY', description: '项目、资源与物品栏', path: '/projects' },
  { key: 'toolbox', label: 'ABILITIES', description: '工具、脚本与能力模块', path: '/toolbox' },
  { key: 'agent-hub', label: 'AGENT', description: '辅助智能控制中心', path: '/agent-hub' },
  { key: 'settings', label: 'SYSTEM', description: '本地数据、权限与设置', path: '/settings' }
]

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'dashboard', component: () => import('@renderer/pages/DashboardPage.vue') },
  { path: '/todo', name: 'todo', component: () => import('@renderer/pages/TodoPage.vue') },
  { path: '/journal', name: 'journal', component: () => import('@renderer/pages/JournalPage.vue') },
  {
    path: '/projects',
    name: 'projects',
    component: () => import('@renderer/pages/ProjectsPage.vue')
  },
  { path: '/toolbox', name: 'toolbox', component: () => import('@renderer/pages/ToolboxPage.vue') },
  {
    path: '/agent-hub',
    name: 'agent-hub',
    component: () => import('@renderer/pages/AgentHubPage.vue')
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@renderer/pages/SettingsPage.vue')
  }
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes
})
