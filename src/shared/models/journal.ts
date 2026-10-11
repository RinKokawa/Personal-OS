export type JournalSource = 'user' | 'system' | 'agent' | 'import'

export interface JournalEntry {
  id: string
  title: string
  entryDate: string
  filePath: string
  excerpt?: string | null
  wordCount: number
  source: JournalSource
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export interface JournalEntryWithContent extends JournalEntry {
  content: string
}

export interface ListJournalEntriesInput {
  limit?: number
  query?: string
}

export interface SaveJournalEntryInput {
  id?: string
  title: string
  entryDate?: string
  content: string
}
