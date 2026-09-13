import 'fake-indexeddb/auto'
import { describe, expect, it, beforeEach } from 'vitest'
import { emptyData, type Entry } from './model'
import { mergeData, parseBackup, serializeBackup, validateData } from './validation'
import { transact } from './storage'
import { useStore } from './store'

const task = (id = 'task-1'): Entry => ({ id, createdAt: '2026-09-01T12:00:00.000Z', updatedAt: '2026-09-01T12:00:00.000Z', title: 'Study regression', status: 'Todo', priority: 'High', dueDate: '2026-09-13' })
describe('portable backups', () => {
  it('round-trips every collection and settings', () => {
    const data = emptyData(); data.tasks.push(task()); data.settings.name = 'Student'
    expect(parseBackup(serializeBackup(data))).toEqual(data)
  })
  it('rejects malformed, foreign, incomplete, and future backups', () => {
    for (const value of ['{', '{}', JSON.stringify({ app: 'personal-os', version: 2, data: emptyData() }), JSON.stringify({ app: 'personal-os', version: 1, data: { schemaVersion: 1 } })]) expect(() => parseBackup(value)).toThrow()
  })
  it('rejects duplicates, impossible dates, invalid money, and executable URLs', () => {
    const duplicates = emptyData(); duplicates.tasks.push(task(), task()); expect(() => validateData(duplicates)).toThrow(/duplicate/i)
    const dates = emptyData(); dates.tasks.push({ ...task(), dueDate: '2026-02-30' }); expect(() => validateData(dates)).toThrow(/date/i)
    const money = emptyData(); money.financeTransactions.push({ ...task(), priority: undefined, status: undefined, dueDate: undefined } as unknown as Entry)
    money.financeTransactions = [{ id: 'x', createdAt: task().createdAt, updatedAt: task().updatedAt, title: 'Expense', type: 'expense', amount: -5, date: '2026-09-01' }]
    expect(() => validateData(money)).toThrow(/Amount/)
    const urls = emptyData(); urls.savedArticles = [{ id: 'x', createdAt: task().createdAt, updatedAt: task().updatedAt, title: 'Bad link', url: 'javascript:alert(1)' }]
    expect(() => validateData(urls)).toThrow(/https/)
  })
  it('merges new IDs without overwriting existing records, preferences, or timer', () => {
    const current = emptyData(); current.tasks.push(task()); current.settings.name = 'Keep me'; current.timer.topic = 'Current session'
    const incoming = emptyData(); incoming.tasks.push({ ...task(), title: 'Do not overwrite' }, task('task-2'))
    const merged = mergeData(current, incoming)
    expect(merged.tasks.map(item => item.title)).toEqual(['Study regression', 'Study regression'])
    expect(merged.settings.name).toBe('Keep me'); expect(merged.timer.topic).toBe('Current session'); expect(current.tasks).toHaveLength(1)
  })
  it('exports a running timer as a paused snapshot without changing the live timer', () => {
    const data = emptyData(); data.timer = { ...data.timer, topic: 'ML', startedAt: Date.now() - 10000, elapsed: 5000 }
    const restored = parseBackup(serializeBackup(data))
    expect(restored.timer.startedAt).toBeNull(); expect(restored.timer.elapsed).toBeGreaterThanOrEqual(15000); expect(data.timer.startedAt).not.toBeNull()
  })
})
describe('atomic local persistence', () => {
  beforeEach(async () => { await transact(() => emptyData()) })
  it('retains concurrent transaction updates and survives another read', async () => {
    await Promise.all(Array.from({ length: 8 }, (_, index) => transact(data => { data.tasks.push(task(`task-${index}`)); return data })))
    expect((await transact()).tasks).toHaveLength(8)
  })
  it('aborts invalid changes without replacing the previous data', async () => {
    await transact(data => { data.tasks.push(task()); return data })
    await expect(transact(data => { data.tasks[0].title = ''; return data })).rejects.toThrow()
    expect((await transact()).tasks[0].title).toBe('Study regression')
  })
  it('keeps completion timestamps stable when editing completed tasks', async () => {
    await useStore.getState().save('tasks', { ...task(), status: 'Completed' })
    const completed = useStore.getState().data.tasks[0]
    await useStore.getState().save('tasks', { ...completed, title: 'Updated title' })
    expect(useStore.getState().data.tasks[0].completedAt).toBe(completed.completedAt)
    await useStore.getState().save('tasks', { ...completed, status: 'Todo' })
    expect(useStore.getState().data.tasks[0].completedAt).toBeUndefined()
  })
  it('clears dangling links when deleting a related course', async () => {
    await transact(data => { data.courses.push({ id: 'course-1', createdAt: task().createdAt, updatedAt: task().updatedAt, title: 'ML' }); data.tasks.push({ ...task(), course: 'course-1' }); data.timer.course = 'course-1'; return data })
    await useStore.getState().remove('courses', 'course-1')
    const data = await transact(); expect(data.courses).toHaveLength(0); expect(data.tasks[0].course).toBe(''); expect(data.timer.course).toBe('')
  })
})
