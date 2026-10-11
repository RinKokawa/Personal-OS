import { getSqliteClient } from '../db/client'

interface AppSettingRow {
  value: string
}

export function getAppSetting(key: string): string | null {
  const row = getSqliteClient().prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as
    AppSettingRow | undefined

  return row?.value ?? null
}

export function setAppSetting(
  key: string,
  value: string,
  valueType = 'string',
  description?: string
): void {
  const now = new Date().toISOString()

  getSqliteClient()
    .prepare(
      `INSERT INTO app_settings (key, value, value_type, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET
         value = excluded.value,
         value_type = excluded.value_type,
         description = COALESCE(excluded.description, app_settings.description),
         updated_at = excluded.updated_at`
    )
    .run(key, value, valueType, description ?? null, now, now)
}
