import { ipcMain } from 'electron'
import { fail, ok, type ApiResult } from '../../shared/api-result'
import { ipcChannels } from '../../shared/ipc'
import type {
  CreateQuestInput,
  ListQuestsInput,
  Quest,
  UpdateQuestInput
} from '../../shared/models/quest'
import {
  completeQuest,
  createQuest,
  deleteQuest,
  listQuests,
  reopenQuest,
  updateQuest
} from '../services/quest-service'

function toErrorResult<T>(code: string, message: string, error: unknown): ApiResult<T> {
  return fail(code, message, error instanceof Error ? error.message : error)
}

export function registerQuestIpc(): void {
  ipcMain.handle(ipcChannels.quest.list, (_event, input?: ListQuestsInput): ApiResult<Quest[]> => {
    try {
      return ok(listQuests(input))
    } catch (error) {
      return toErrorResult('QUEST_LIST_ERROR', '读取任务列表失败', error)
    }
  })

  ipcMain.handle(ipcChannels.quest.create, (_event, input: CreateQuestInput): ApiResult<Quest> => {
    try {
      return ok(createQuest(input))
    } catch (error) {
      return toErrorResult('QUEST_CREATE_ERROR', '创建任务失败', error)
    }
  })

  ipcMain.handle(ipcChannels.quest.update, (_event, input: UpdateQuestInput): ApiResult<Quest> => {
    try {
      return ok(updateQuest(input))
    } catch (error) {
      return toErrorResult('QUEST_UPDATE_ERROR', '更新任务失败', error)
    }
  })

  ipcMain.handle(ipcChannels.quest.complete, (_event, id: string): ApiResult<Quest> => {
    try {
      return ok(completeQuest(id))
    } catch (error) {
      return toErrorResult('QUEST_COMPLETE_ERROR', '完成任务失败', error)
    }
  })

  ipcMain.handle(ipcChannels.quest.reopen, (_event, id: string): ApiResult<Quest> => {
    try {
      return ok(reopenQuest(id))
    } catch (error) {
      return toErrorResult('QUEST_REOPEN_ERROR', '重新开启任务失败', error)
    }
  })

  ipcMain.handle(ipcChannels.quest.delete, (_event, id: string): ApiResult<void> => {
    try {
      deleteQuest(id)
      return ok(undefined)
    } catch (error) {
      return toErrorResult('QUEST_DELETE_ERROR', '删除任务失败', error)
    }
  })
}
