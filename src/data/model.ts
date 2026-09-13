export const collections = ['tasks', 'habits', 'studySessions', 'courses', 'skills', 'projects', 'goals', 'financeTransactions', 'financeBudgets', 'savedArticles', 'opportunities', 'notes'] as const
export type Collection = typeof collections[number]
export type Value = string | number | string[]
export interface Entry { id: string; createdAt: string; updatedAt: string; [key: string]: Value }
export interface Notification { id: string; title: string; body: string; time: string; sent: boolean }
export interface Settings { name: string; theme: 'system' | 'light' | 'dark'; currency: string; interests: string[]; financeCategories: string[]; notifications: Notification[] }
export interface Timer { startedAt: number | null; elapsed: number; topic: string; course: string; skill: string; category: string; notes: string }
export type Data = Record<Collection, Entry[]> & { schemaVersion: 1; settings: Settings; timer: Timer }
export interface Field { key: string; label: string; type?: 'text' | 'textarea' | 'number' | 'date' | 'url' | 'select' | 'tags' | 'topics'; options?: string[]; required?: boolean; min?: number; max?: number; relation?: Collection }
export interface Module { title: string; singular: string; description: string; fields: Field[] }
const title = (label = 'Title'): Field => ({ key: 'title', label, required: true })
const description: Field = { key: 'description', label: 'Description', type: 'textarea' }
const notes: Field = { key: 'notes', label: 'Notes', type: 'textarea' }
const date = (key: string, label: string): Field => ({ key, label, type: 'date' })
const number = (key: string, label: string, max?: number): Field => ({ key, label, type: 'number', min: 0, max })
const select = (key: string, label: string, options: string[]): Field => ({ key, label, type: 'select', options })
const relation = (key: string, label: string, relation: Collection): Field => ({ key, label, type: 'select', relation })
const progress = number('progress', 'Progress (%)', 100)
const priority = select('priority', 'Priority', ['Medium', 'High', 'Low'])
export const modules: Record<Collection, Module> = {
  tasks: { title: 'Tasks', singular: 'task', description: 'Turn your intentions into a clear next action.', fields: [title(), description, date('dueDate', 'Due date'), priority, { key: 'category', label: 'Category' }, select('status', 'Status', ['Todo', 'In Progress', 'Completed', 'Cancelled']), number('estimatedDuration', 'Estimated minutes'), number('actualDuration', 'Actual minutes'), { key: 'tags', label: 'Tags', type: 'tags' }, relation('course', 'Course', 'courses'), relation('skill', 'Skill', 'skills'), relation('project', 'Project', 'projects'), relation('goal', 'Goal', 'goals')] },
  habits: { title: 'Habits', singular: 'habit', description: 'Small actions, repeated. Build consistency one day at a time.', fields: [title('Habit name'), description, { key: 'category', label: 'Category' }] },
  studySessions: { title: 'Study sessions', singular: 'study session', description: 'A record of the time you invest in yourself.', fields: [title('Topic'), { ...date('date', 'Date'), required: true }, { ...number('duration', 'Duration (minutes)'), required: true, min: 0.01 }, relation('course', 'Course', 'courses'), relation('skill', 'Skill', 'skills'), { key: 'category', label: 'Category' }, notes] },
  courses: { title: 'Courses', singular: 'course', description: 'Connect university learning to the future you are building.', fields: [title('Course name'), { key: 'code', label: 'Course code' }, { key: 'institution', label: 'Institution' }, { key: 'semester', label: 'Semester' }, { key: 'instructor', label: 'Instructor' }, number('credits', 'Credits'), { key: 'targetGrade', label: 'Target grade' }, { key: 'currentGrade', label: 'Current grade' }, progress, { key: 'topics', label: 'Topics (one per line)', type: 'topics' }, notes] },
  skills: { title: 'Skills', singular: 'skill', description: 'Build your technical range with deliberate practice.', fields: [title('Skill name'), select('currentLevel', 'Current level', ['Beginner', 'Intermediate', 'Advanced', 'Expert']), select('targetLevel', 'Target level', ['Intermediate', 'Advanced', 'Expert']), { key: 'category', label: 'Category' }, progress, { key: 'resources', label: 'Learning resources (one URL per line)', type: 'textarea' }, notes] },
  projects: { title: 'Projects', singular: 'project', description: 'Move from an idea to something you can share.', fields: [title('Project name'), description, select('status', 'Status', ['Idea', 'Planning', 'Active', 'Paused', 'Completed']), { key: 'technologies', label: 'Technologies', type: 'tags' }, date('startDate', 'Start date'), date('deadline', 'Deadline'), progress, { key: 'githubUrl', label: 'GitHub URL', type: 'url' }, relation('course', 'Course', 'courses'), relation('skill', 'Skill', 'skills'), relation('goal', 'Goal', 'goals'), notes] },
  goals: { title: 'Goals', singular: 'goal', description: 'Give your daily work a bigger direction.', fields: [title(), description, select('category', 'Category', ['Academic', 'Career', 'Financial', 'Personal', 'Short-term', 'Long-term']), date('deadline', 'Deadline'), progress, priority, relation('skill', 'Skill', 'skills'), notes] },
  financeTransactions: { title: 'Transactions', singular: 'transaction', description: 'Know where your money comes from, and where it goes.', fields: [title('Description'), select('type', 'Type', ['expense', 'income']), { ...number('amount', 'Amount'), required: true, min: 0.01 }, { ...date('date', 'Date'), required: true }, { key: 'category', label: 'Category', type: 'select' }, { key: 'paymentMethod', label: 'Payment method' }, notes] },
  financeBudgets: { title: 'Budget', singular: 'budget', description: 'Set a monthly spending limit for each category.', fields: [title('Budget name'), { key: 'month', label: 'Month (YYYY-MM)', required: true }, { key: 'category', label: 'Category', type: 'select', required: true }, { ...number('amount', 'Monthly limit'), required: true, min: 0.01 }] },
  savedArticles: { title: 'Read later', singular: 'article', description: 'A personal reading list, saved locally.', fields: [title(), description, { key: 'url', label: 'Source URL', type: 'url', required: true }, { key: 'source', label: 'Source' }, { key: 'category', label: 'Category' }, date('publishedAt', 'Published date'), { key: 'tags', label: 'Tags', type: 'tags' }] },
  opportunities: { title: 'Saved opportunities', singular: 'opportunity', description: 'Keep verified opportunities and application deadlines together.', fields: [title(), { key: 'organizer', label: 'Organizer / university' }, select('type', 'Type', ['Competition', 'Hackathon', 'Study Abroad', 'Scholarship', 'Career']), { key: 'url', label: 'Official source URL', type: 'url', required: true }, date('deadline', 'Deadline'), date('startDate', 'Start date'), { key: 'location', label: 'Location / online' }, { key: 'country', label: 'Country' }, { key: 'degree', label: 'Degree' }, { key: 'field', label: 'Field' }, { key: 'funding', label: 'Funding' }, { key: 'eligibility', label: 'Eligibility (verify with source)' }, { key: 'prize', label: 'Prize' }, { key: 'teamSize', label: 'Team size' }, select('status', 'Status', ['Saved', 'Interested', 'Applied', 'Closed']), { key: 'tags', label: 'Tags', type: 'tags' }, notes] },
  notes: { title: 'Notes', singular: 'note', description: 'Make room for ideas and reflections.', fields: [title(), notes] },
}
export function emptyData(): Data {
  return { ...Object.fromEntries(collections.map(key => [key, []])), schemaVersion: 1,
    settings: { name: '', theme: 'system', currency: 'BDT', interests: ['AI', 'Machine Learning', 'Software Engineering'], financeCategories: ['Food', 'Transport', 'Education', 'Housing', 'Health', 'Entertainment', 'Salary', 'Other'], notifications: [] as Notification[] },
    timer: { startedAt: null, elapsed: 0, topic: '', course: '', skill: '', category: '', notes: '' },
  } as Data
}
export function text(entry: Entry, key: string): string { return String(entry[key] ?? '') }
export function numeric(entry: Entry, key: string): number { return Number(entry[key] ?? 0) }
export function list(entry: Entry, key: string): string[] { return Array.isArray(entry[key]) ? entry[key] as string[] : [] }
export function entryProgress(entry: Entry, collection: Collection): number {
  const topics = list(entry, 'topics')
  return collection === 'courses' && topics.length ? Math.round(topics.filter(t => list(entry, 'completedTopics').includes(t)).length / topics.length * 100) : numeric(entry, 'progress')
}
export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export function safeUrl(value: string): string | undefined {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined } catch { return undefined }
}
