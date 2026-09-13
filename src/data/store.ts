import { create } from 'zustand'
import { collections, emptyData, type Collection, type Data, type Entry } from './model'
import { transact } from './storage'
import { mergeData } from './validation'

interface Store {
  data: Data; ready: boolean; error: string | null; saving: number
  load: () => Promise<void>
  change: (update: (data: Data) => Data) => Promise<boolean>
  save: (collection: Collection, entry: Entry) => Promise<boolean>
  remove: (collection: Collection, id: string) => Promise<boolean>
  restore: (data: Data, merge: boolean) => Promise<boolean>
  clear: () => Promise<boolean>
  dismissError: () => void
}
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('personal-os-updates') : undefined
export const useStore = create<Store>((set, get) => ({
  data: emptyData(), ready: false, error: null, saving: 0,
  load: async () => { try { const data = await transact(); set({ data, ready: true, error: null }) } catch (error) { set({ error: error instanceof Error ? error.message : 'Local storage is unavailable.' }) } },
  change: async update => {
    set(state => ({ saving: state.saving + 1 }))
    try { const data = await transact(update); set({ data, error: null }); channel?.postMessage('updated'); return true }
    catch (error) { set({ error: error instanceof Error ? error.message : 'Unable to save your changes.' }); return false }
    finally { set(state => ({ saving: state.saving - 1 })) }
  },
  save: (collection, entry) => get().change(data => {
    const now = new Date().toISOString()
    const previous = data[collection].find(item => item.id === entry.id)
    const saved: Entry = { ...entry, updatedAt: now }
    if (collection === 'tasks') {
      if (saved.status === 'Completed') saved.completedAt = previous?.status === 'Completed' ? previous.completedAt ?? now : now
      else delete saved.completedAt
    }
    if (collection === 'skills' && (!previous || previous.progress !== saved.progress)) saved.progressHistory = [...(previous?.progressHistory as string[] ?? []), `${now}|${saved.progress ?? 0}`]
    data[collection] = previous ? data[collection].map(item => item.id === entry.id ? saved : item) : [...data[collection], saved]
    return data
  }),
  remove: (collection, id) => get().change(data => {
    data[collection] = data[collection].filter(item => item.id !== id)
    const relationKey: Partial<Record<Collection, string>> = { courses: 'course', skills: 'skill', projects: 'project', goals: 'goal' }
    const key = relationKey[collection]
    if (key) {
      for (const name of collections) data[name] = data[name].map(item => item[key] === id ? { ...item, [key]: '', updatedAt: new Date().toISOString() } : item)
      if ((key === 'course' || key === 'skill') && data.timer[key] === id) data.timer[key] = ''
    }
    return data
  }),
  restore: (data, merge) => get().change(current => merge ? mergeData(current, data) : data),
  clear: () => get().change(() => emptyData()),
  dismissError: () => set({ error: null }),
}))
channel?.addEventListener('message', () => { void useStore.getState().load() })
export function newEntry(): Entry { const now = new Date().toISOString(); return { id: crypto.randomUUID(), createdAt: now, updatedAt: now } }
