// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type DOMWrapper, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { ok } from '../src/shared/api-result'
import type { JournalEntry } from '../src/shared/models/journal'
import type { Quest } from '../src/shared/models/quest'
import type { WindowApi } from '../src/shared/window-api'
import TodoPage from '../src/renderer/src/pages/TodoPage.vue'
import JournalPage from '../src/renderer/src/pages/JournalPage.vue'
import DashboardPage from '../src/renderer/src/pages/DashboardPage.vue'

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('naive-ui', () => ({
  useMessage: () => ({ error: vi.fn(), warning: vi.fn(), success: vi.fn() }),
  NButton: { props: ['loading'], template: '<button :disabled="loading"><slot /></button>' },
  NInput: {
    props: ['value'],
    emits: ['update:value'],
    template: '<input :value="value" @input="$emit(\'update:value\', $event.target.value)" />'
  },
  NSelect: { template: '<select />' },
  NDatePicker: { template: '<input />' },
  NTag: { template: '<span><slot /></span>' },
  NProgress: { template: '<div />' }
}))

const q = (id: string): Quest => ({
  id,
  title: id,
  type: 'side',
  status: 'todo',
  priority: 'normal',
  source: 'user',
  createdAt: '2026-11-06',
  updatedAt: '2026-11-06'
})
const j = (id: string): JournalEntry => ({
  id,
  title: id,
  entryDate: '2026-10-01',
  filePath: `journal/${id}.md`,
  wordCount: 3,
  source: 'user',
  createdAt: '2026-10-01',
  updatedAt: '2026-10-01'
})
const api = {
  quest: {
    list: vi.fn(),
    stats: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    complete: vi.fn(),
    reopen: vi.fn(),
    delete: vi.fn()
  },
  journal: { list: vi.fn(), stats: vi.fn(), get: vi.fn(), save: vi.fn() },
  activity: { list: vi.fn() },
  system: { getAppInfo: vi.fn(), getDataDirectoryStatus: vi.fn() }
}
let wrapper: VueWrapper | undefined
function button(text: string): DOMWrapper<Element> {
  const found = wrapper!.findAll('button').find((el) => el.text() === text)
  if (!found) throw new Error(`Missing button: ${text}`)
  return found
}

beforeEach(() => {
  vi.resetAllMocks()
  window.api = api as unknown as WindowApi
  api.quest.stats.mockResolvedValue(
    ok({ total: 251, completed: 120, open: 131, todayOpen: 7, todayCompleted: 3 })
  )
  api.journal.stats.mockResolvedValue(ok({ total: 251, todayEntries: 2, todayWords: 42 }))
  api.activity.list.mockResolvedValue(ok([]))
  api.system.getAppInfo.mockResolvedValue(ok(null))
  api.system.getDataDirectoryStatus.mockResolvedValue(ok(null))
})
afterEach(() => wrapper?.unmount())

describe('task pagination and complete counts', () => {
  it('appends another page, displays aggregate statistics, and filters on the backend', async () => {
    api.quest.list
      .mockResolvedValueOnce(ok({ items: [q('first')], total: 251, hasMore: true }))
      .mockResolvedValueOnce(ok({ items: [q('second')], total: 251, hasMore: false }))
      .mockResolvedValueOnce(ok({ items: [q('old-due-task')], total: 7, hasMore: false }))
    wrapper = mount(TodoPage)
    await flushPromises()
    expect(wrapper.text()).toContain('任务列表 · 251')
    expect(wrapper.text()).toContain('131 项待完成')
    expect(wrapper.text()).toContain('7 项今日到期')
    expect(wrapper.text()).toContain('48%')
    await button('加载更多').trigger('click')
    await flushPromises()
    expect(api.quest.list).toHaveBeenNthCalledWith(2, {
      status: 'all',
      dueToday: false,
      offset: 1,
      limit: 50
    })
    expect(wrapper.text()).toContain('first')
    expect(wrapper.text()).toContain('second')
    await button('今日任务').trigger('click')
    await flushPromises()
    expect(api.quest.list).toHaveBeenLastCalledWith({
      status: 'open',
      dueToday: true,
      offset: 0,
      limit: 50
    })
    expect(wrapper.text()).toContain('old-due-task')
    expect(wrapper.text()).not.toContain('first')
  })

  it('ignores an older response when the filter changes during a request', async () => {
    let resolveOld!: (value: unknown) => void
    api.quest.list
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveOld = resolve
          })
      )
      .mockResolvedValueOnce(ok({ items: [q('current-open')], total: 1, hasMore: false }))
    wrapper = mount(TodoPage)
    await button('未完成').trigger('click')
    await flushPromises()
    resolveOld(ok({ items: [q('stale-result')], total: 251, hasMore: true }))
    await flushPromises()
    expect(wrapper.text()).toContain('current-open')
    expect(wrapper.text()).not.toContain('stale-result')
  })
})

describe('journal archive pagination', () => {
  it('opens and edits an entry from a later page, preserving selection across a search', async () => {
    api.journal.list
      .mockResolvedValueOnce(ok({ items: [j('first')], total: 51, hasMore: true }))
      .mockResolvedValueOnce(ok({ items: [j('old-entry')], total: 51, hasMore: false }))
      .mockResolvedValueOnce(ok({ items: [], total: 0, hasMore: false }))
      .mockResolvedValueOnce(ok({ items: [], total: 0, hasMore: false }))
    api.journal.get.mockResolvedValue(ok({ ...j('old-entry'), content: 'old content' }))
    api.journal.save.mockResolvedValue(ok({ ...j('old-entry'), content: 'edited content' }))
    wrapper = mount(JournalPage)
    await flushPromises()
    await button('加载更多').trigger('click')
    await flushPromises()
    expect(api.journal.list).toHaveBeenNthCalledWith(2, { limit: 50, offset: 1, query: '' })
    const entry = wrapper.findAll('button').find((el) => el.text().includes('old-entry'))!
    await entry.trigger('click')
    await flushPromises()
    const search = wrapper.find('input[placeholder="搜索标题或摘要"]')
    await search.setValue('unrelated')
    await button('检索').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('编辑日志')
    await wrapper.find('textarea').setValue('edited content')
    await button('写入系统日志').trigger('click')
    await flushPromises()
    expect(api.journal.save).toHaveBeenCalledWith({
      id: 'old-entry',
      title: 'old-entry',
      content: 'edited content'
    })
  })

  it('continues paging the active search even if the search box has unsubmitted changes', async () => {
    api.journal.list.mockResolvedValue(ok({ items: [j('first')], total: 251, hasMore: true }))
    wrapper = mount(JournalPage)
    await flushPromises()
    await wrapper.find('input[placeholder="搜索标题或摘要"]').setValue('not submitted')
    await button('加载更多').trigger('click')
    await flushPromises()
    expect(api.journal.list).toHaveBeenLastCalledWith({ limit: 50, offset: 1, query: '' })
  })

  it('prevents switching to a new entry while a save is pending', async () => {
    api.journal.list.mockResolvedValue(ok({ items: [], total: 0, hasMore: false }))
    let resolveSave!: (value: unknown) => void
    api.journal.save.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve
        })
    )
    wrapper = mount(JournalPage)
    await flushPromises()
    await wrapper.find('textarea').setValue('new content')
    await button('写入系统日志').trigger('click')
    await nextTick()
    expect(button('新建').attributes('disabled')).toBeDefined()
    expect(wrapper.find('textarea').attributes('disabled')).toBeDefined()
    resolveSave(ok({ ...j('saved'), content: 'new content' }))
    await flushPromises()
    expect(button('新建').attributes('disabled')).toBeUndefined()
  })
})

it('uses full aggregate counts on the dashboard while requesting only five open priority tasks', async () => {
  api.quest.list.mockResolvedValue(ok({ items: [q('priority-task')], total: 131, hasMore: true }))
  wrapper = mount(DashboardPage)
  await flushPromises()
  expect(api.quest.list).toHaveBeenCalledWith({ status: 'open', limit: 5 })
  expect(wrapper.text()).toContain('120 / 251')
  expect(wrapper.text()).toContain('131 项任务待完成')
  expect(wrapper.text()).toContain('2 ENTRIES / 42 WORDS')
  expect(wrapper.text()).toContain('48% COMPLETE')
  expect(wrapper.text()).toContain('priority-task')
})
