export function pagination(
  input: { limit?: number; offset?: number },
  defaultLimit: number
): { limit: number; offset: number } {
  const limit = input.limit ?? defaultLimit
  const offset = input.offset ?? 0
  if (!Number.isSafeInteger(limit) || limit < 1 || !Number.isSafeInteger(offset) || offset < 0) {
    throw new Error('分页参数无效')
  }
  return { limit: Math.min(limit, 200), offset }
}
