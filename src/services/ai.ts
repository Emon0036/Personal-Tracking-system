import type { Data } from '../data/model'
import { numeric, text, localDate } from '../data/model'
import { summarize } from '../lib/analytics'

export interface AIConfig { endpoint: string; model: string; apiKey: string }
export function aiSummary(data: Data) {
  const stats = summarize(data)
  const previousStart = new Date(); previousStart.setDate(previousStart.getDate() - 13)
  const previousEnd = new Date(); previousEnd.setDate(previousEnd.getDate() - 7)
  return { period: 'Last 7 days; finance is current calendar month', tasks: { total: stats.activeTasks.length, completed: stats.completed.length, open: stats.open.length, overdue: stats.overdue.length }, study: { last7DaysMinutes: stats.weekly.reduce((sum, day) => sum + day.minutes, 0), previous7DaysMinutes: data.studySessions.filter(item => text(item, 'date') >= localDate(previousStart) && text(item, 'date') <= localDate(previousEnd)).reduce((sum, item) => sum + numeric(item, 'duration'), 0) }, learning: { courses: data.courses.length, averageCourseProgress: stats.courseProgress, skills: data.skills.length, averageSkillProgress: stats.skillProgress }, goals: { active: stats.goals.length, averageProgress: stats.goalProgress }, projects: { active: data.projects.filter(item => item.status === 'Active').length, completed: data.projects.filter(item => item.status === 'Completed').length }, finance: { currency: data.settings.currency, monthIncome: stats.income, monthExpenses: stats.expense, monthSavings: stats.savings } }
}
export async function askAI(config: AIConfig, summary: ReturnType<typeof aiSummary>, question: string, signal: AbortSignal): Promise<string> {
  const url = new URL(config.endpoint)
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) throw new Error('Use an HTTPS endpoint, or HTTP on localhost for a local model.')
  const response = await fetch(url, { method: 'POST', signal, credentials: 'omit', referrerPolicy: 'no-referrer', headers: { 'Content-Type': 'application/json', ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}) }, body: JSON.stringify({ model: config.model, messages: [{ role: 'system', content: 'You are a concise personal productivity assistant. Use only the provided summary. Do not invent facts, trends, or personal details. If detail is unavailable, say so. Give practical next steps. All numeric data is user-entered and may be incomplete.' }, { role: 'user', content: JSON.stringify({ summary, question }) }], max_tokens: 700 }) })
  if (!response.ok) throw new Error(`AI provider returned ${response.status}. Check your endpoint, model, and credentials.`)
  const result = await response.json()
  const content = result?.choices?.[0]?.message?.content
  if (typeof content !== 'string' || !content.trim()) throw new Error('The provider did not return a readable response.')
  return content
}
