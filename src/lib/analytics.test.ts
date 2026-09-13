import { describe, expect, it } from 'vitest'
import { emptyData, entryProgress, type Entry } from '../data/model'
import { daysBack, habitStats, summarize } from './analytics'

const entry = (id: string, extra: Record<string, string | number | string[]>): Entry => ({ id, title: id, createdAt: '2026-09-01T12:00:00Z', updatedAt: '2026-09-01T12:00:00Z', ...extra })
describe('deterministic analytics', () => {
  it('has honest zero values on a fresh workspace', () => {
    const stats = summarize(emptyData(), new Date(2026, 8, 13, 12))
    expect(stats.completion).toBe(0); expect(stats.savings).toBe(0); expect(stats.studyToday).toBe(0); expect(stats.goals).toEqual([])
  })
  it('excludes cancelled tasks, uses completion dates, and limits finance to this month', () => {
    const data = emptyData()
    data.tasks = [entry('done', { status: 'Completed', completedAt: '2026-09-13T12:00:00', dueDate: '2026-09-12' }), entry('late', { status: 'Todo', dueDate: '2026-09-12' }), entry('cancelled', { status: 'Cancelled', dueDate: '2026-09-01' })]
    data.financeTransactions = [entry('income', { type: 'income', amount: 1000, date: '2026-09-01' }), entry('expense', { type: 'expense', amount: 250, date: '2026-09-13' }), entry('old', { type: 'expense', amount: 999, date: '2026-08-31' })]
    const stats = summarize(data, new Date(2026, 8, 13, 15))
    expect(stats.completion).toBe(50); expect(stats.doneToday).toBe(1); expect(stats.overdue).toHaveLength(1); expect(stats.savings).toBe(750)
  })
  it('uses calendar days across month boundaries', () => { expect(daysBack(3, new Date(2026, 2, 1, 12))).toEqual(['2026-02-27', '2026-02-28', '2026-03-01']) })
  it('allows today to be incomplete without prematurely breaking a habit streak', () => {
    const habit = entry('habit', { completions: ['2026-09-11', '2026-09-12'] })
    expect(habitStats(habit, new Date(2026, 8, 13, 12))).toEqual({ streak: 2, week: 29, month: 7 })
  })
  it('derives course progress only from topics that still exist', () => { expect(entryProgress(entry('course', { topics: ['Python', 'NumPy'], completedTopics: ['Python', 'Removed'], progress: 99 }), 'courses')).toBe(50) })
})
