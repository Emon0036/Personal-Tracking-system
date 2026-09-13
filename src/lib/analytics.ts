import { entryProgress, list, localDate, numeric, text, type Data, type Entry } from '../data/model'

export function daysBack(count: number, now = new Date()): string[] {
  return Array.from({ length: count }, (_, index) => { const date = new Date(now); date.setDate(date.getDate() - count + 1 + index); return localDate(date) })
}
export function habitStats(habit: Entry, now = new Date()) {
  const completed = new Set(list(habit, 'completions'))
  let streak = 0
  const date = new Date(now)
  if (!completed.has(localDate(date))) date.setDate(date.getDate() - 1)
  while (completed.has(localDate(date))) { streak++; date.setDate(date.getDate() - 1) }
  const consistency = (days: number) => Math.round(daysBack(days, now).filter(day => completed.has(day)).length / days * 100)
  return { streak, week: consistency(7), month: consistency(30) }
}
export function summarize(data: Data, now = new Date()) {
  const today = localDate(now), month = today.slice(0, 7)
  const activeTasks = data.tasks.filter(task => task.status !== 'Cancelled')
  const completed = activeTasks.filter(task => task.status === 'Completed')
  const open = activeTasks.filter(task => task.status !== 'Completed')
  const completedDate = (task: Entry) => localDate(new Date(text(task, 'completedAt') || text(task, 'updatedAt')))
  const todayTasks = activeTasks.filter(task => task.dueDate === today || (task.status === 'Completed' && completedDate(task) === today))
  const doneToday = completed.filter(task => completedDate(task) === today).length
  const studyToday = data.studySessions.filter(session => session.date === today).reduce((sum, item) => sum + numeric(item, 'duration'), 0)
  const transactions = data.financeTransactions.filter(item => text(item, 'date').startsWith(month))
  const income = transactions.filter(item => item.type === 'income').reduce((sum, item) => sum + numeric(item, 'amount'), 0)
  const expense = transactions.filter(item => item.type === 'expense').reduce((sum, item) => sum + numeric(item, 'amount'), 0)
  const overdue = open.filter(task => text(task, 'dueDate') && text(task, 'dueDate') < today)
  const weekly = daysBack(7, now).map(date => ({ date, day: new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' }), minutes: Math.round(data.studySessions.filter(item => item.date === date).reduce((sum, item) => sum + numeric(item, 'duration'), 0)), tasks: completed.filter(item => completedDate(item) === date).length }))
  const goals = data.goals.filter(goal => numeric(goal, 'progress') < 100)
  const mean = (values: number[]) => values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0
  return { today, month, activeTasks, completed, open, doneToday, todayTasks, studyToday, income, expense, savings: income - expense, overdue, weekly, goals, habitDone: data.habits.filter(habit => list(habit, 'completions').includes(today)).length, completion: activeTasks.length ? Math.round(completed.length / activeTasks.length * 100) : 0, courseProgress: mean(data.courses.map(course => entryProgress(course, 'courses'))), skillProgress: mean(data.skills.map(skill => numeric(skill, 'progress'))), goalProgress: mean(data.goals.map(goal => numeric(goal, 'progress'))), plannedMinutes: todayTasks.filter(task => task.status !== 'Completed').reduce((sum, task) => sum + numeric(task, 'estimatedDuration'), 0) }
}
export function localInsight(data: Data): string {
  const stats = summarize(data)
  if (stats.overdue.length) return `You have ${stats.overdue.length} overdue task${stats.overdue.length === 1 ? '' : 's'}. Reschedule or finish one before taking on more work.`
  if (stats.expense > stats.income && stats.expense > 0) return 'Recorded expenses exceed income this month. Review your spending and check that all income is recorded.'
  if (stats.open.length) return `You have ${stats.open.length} open task${stats.open.length === 1 ? '' : 's'}. Choose one important next action and give it a focused study session.`
  if (data.studySessions.length) return `You logged ${Math.round(stats.weekly.reduce((sum, day) => sum + day.minutes, 0))} study minutes in the last 7 days. Set a small target for your next session to keep the habit going.`
  return 'Start with one meaningful task and one learning goal. Your dashboard will connect the dots as you build your daily rhythm.'
}
export function money(amount: number, currency: string): string {
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount) } catch { return `${currency} ${amount.toFixed(2)}` }
}
export function duration(minutes: number): string { return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${Math.round(minutes % 60)}m` : `${Math.round(minutes)}m` }
