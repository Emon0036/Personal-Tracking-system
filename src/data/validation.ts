import { collections, emptyData, modules, safeUrl, type Data, type Entry } from './model'

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message) }
function object(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value) }
function validDate(value: string): boolean { return /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value }
export function validateData(input: unknown): Data {
  assert(object(input) && input.schemaVersion === 1, 'Unsupported backup format or version.')
  const result = emptyData()
  for (const collection of collections) {
    const rows = input[collection]
    assert(Array.isArray(rows) && rows.length <= 100000, `Invalid ${collection} collection.`)
    const ids = new Set<string>()
    result[collection] = rows.map((row: unknown) => {
      assert(object(row), `Invalid ${collection} record.`)
      assert(typeof row.id === 'string' && row.id.length > 0 && row.id.length <= 100 && !ids.has(row.id), `Missing or duplicate ID in ${collection}.`)
      ids.add(row.id)
      for (const key of ['createdAt', 'updatedAt']) assert(typeof row[key] === 'string' && !isNaN(Date.parse(row[key])), `Invalid ${key} in ${collection}.`)
      const allowed = new Set(['id', 'createdAt', 'updatedAt', ...(collection === 'tasks' ? ['completedAt'] : []), 'completions', 'completedTopics', 'progressHistory', ...modules[collection].fields.map(f => f.key)])
      for (const [key, value] of Object.entries(row)) {
        assert(allowed.has(key), `Unknown field ${key} in ${collection}.`)
        assert((typeof value === 'string' && value.length <= 50000) || (typeof value === 'number' && Number.isFinite(value)) || (Array.isArray(value) && value.length <= 100000 && value.every(v => typeof v === 'string' && v.length <= 2000)), `Invalid ${key} value.`)
      }
      for (const field of modules[collection].fields) {
        const value = row[field.key]
        if (field.required) assert(value !== undefined && String(value).trim().length > 0, `${field.label} is required.`)
        if (value === undefined || value === '') continue
        if (field.type === 'number') assert(typeof value === 'number' && Number.isFinite(value) && value >= (field.min ?? 0) && value <= (field.max ?? 1e12), `Invalid ${field.label}.`)
        else if (field.type === 'tags' || field.type === 'topics') assert(Array.isArray(value), `Invalid ${field.label}.`)
        else assert(typeof value === 'string', `Invalid ${field.label}.`)
        if (field.options) assert(field.options.includes(value as string), `Invalid ${field.label}.`)
        if (field.type === 'date') assert(validDate(value as string), `Invalid ${field.label}.`)
        if (field.type === 'url') assert(safeUrl(value as string), `${field.label} must use https:// or http://.`)
      }
      for (const key of ['completions', 'completedTopics', 'progressHistory']) if (row[key] !== undefined) assert(Array.isArray(row[key]), `Invalid ${key}.`)
      if (Array.isArray(row.completions)) assert(row.completions.every(v => typeof v === 'string' && validDate(v)), 'Invalid habit completion date.')
      if (row.completedAt !== undefined) assert(typeof row.completedAt === 'string' && !isNaN(Date.parse(row.completedAt)), 'Invalid task completion timestamp.')
      if (collection === 'financeBudgets') assert(typeof row.month === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(row.month), 'Budget month must be YYYY-MM.')
      return structuredClone(row) as Entry
    })
  }
  const settings = input.settings
  assert(object(settings), 'Missing settings.')
  assert(typeof settings.name === 'string' && settings.name.length <= 100, 'Invalid profile name.')
  assert(['system', 'light', 'dark'].includes(String(settings.theme)), 'Invalid theme.')
  assert(typeof settings.currency === 'string' && /^[A-Z]{3}$/.test(settings.currency), 'Currency must be a three-letter code.')
  for (const key of ['interests', 'financeCategories']) assert(Array.isArray(settings[key]) && settings[key].length <= 100 && settings[key].every(v => typeof v === 'string' && v.length <= 100), `Invalid ${key}.`)
  result.settings = { name: settings.name, theme: settings.theme as Data['settings']['theme'], currency: settings.currency, interests: [...settings.interests as string[]], financeCategories: [...settings.financeCategories as string[]] }
  const timer = input.timer
  assert(object(timer) && (timer.startedAt === null || (typeof timer.startedAt === 'number' && Number.isFinite(timer.startedAt) && timer.startedAt >= 0 && timer.startedAt <= Date.now() + 60000)) && typeof timer.elapsed === 'number' && Number.isFinite(timer.elapsed) && timer.elapsed >= 0 && timer.elapsed <= 1e12, 'Invalid timer state.')
  for (const key of ['topic', 'course', 'skill', 'category', 'notes']) assert(typeof timer[key] === 'string' && timer[key].length <= 50000, `Invalid timer ${key}.`)
  result.timer = { startedAt: timer.startedAt as number | null, elapsed: timer.elapsed, topic: timer.topic as string, course: timer.course as string, skill: timer.skill as string, category: timer.category as string, notes: timer.notes as string }
  return result
}
export function parseBackup(raw: string): Data {
  assert(raw.length <= 20 * 1024 * 1024, 'Backup is larger than the 20 MB limit.')
  let parsed: unknown
  try { parsed = JSON.parse(raw) } catch { throw new Error('This file is not valid JSON.') }
  assert(object(parsed) && parsed.app === 'personal-os' && parsed.version === 1, 'This is not a supported Personal OS backup.')
  return validateData(parsed.data)
}
export function serializeBackup(data: Data): string {
  const snapshot = validateData(data)
  if (snapshot.timer.startedAt !== null) snapshot.timer = { ...snapshot.timer, elapsed: snapshot.timer.elapsed + Math.max(0, Date.now() - snapshot.timer.startedAt), startedAt: null }
  return JSON.stringify({ app: 'personal-os', version: 1, exportedAt: new Date().toISOString(), data: snapshot }, null, 2)
}
export function mergeData(current: Data, incoming: Data): Data {
  const merged = structuredClone(current)
  for (const key of collections) {
    const existing = new Set(current[key].map(item => item.id))
    merged[key].push(...incoming[key].filter(item => !existing.has(item.id)))
  }
  return validateData(merged)
}
