import { useState, type FormEvent } from 'react'
import { modules, localDate, list, type Collection, type Entry, type Value } from '../data/model'
import { newEntry, useStore } from '../data/store'
import { Modal } from './ui'

export default function EntryForm({ collection, entry, onClose }: { collection: Collection; entry?: Entry; onClose: () => void }) {
  const { data, save } = useStore()
  const module = modules[collection]
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState<Entry>(() => entry ? structuredClone(entry) : {
    ...newEntry(), ...Object.fromEntries(module.fields.map(field => [field.key, field.type === 'number' ? 0 : field.type === 'date' && field.required ? localDate() : field.options?.[0] ?? (field.type === 'tags' || field.type === 'topics' ? [] : field.key === 'month' ? localDate().slice(0, 7) : '')])),
  })
  function update(key: string, value: Value) { setDraft(current => ({ ...current, [key]: value })) }
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('')
    const cleaned: Entry = { ...draft, title: String(draft.title ?? '').trim() }
    for (const field of module.fields) if (field.type === 'tags' || field.type === 'topics') cleaned[field.key] = [...new Set(list(cleaned, field.key).map(value => value.trim()).filter(Boolean))]
    if (collection === 'courses') cleaned.completedTopics = list(cleaned, 'completedTopics').filter(topic => list(cleaned, 'topics').includes(topic))
    if (await save(collection, cleaned)) onClose()
    else { setError(useStore.getState().error ?? 'Could not save this entry.'); setBusy(false) }
  }
  return <Modal title={`${entry ? 'Edit' : 'New'} ${module.singular}`} onClose={() => { if (!busy) onClose() }}><form onSubmit={submit}><div className="form-grid">{module.fields.map(field => {
    const id = `field-${field.key}`
    const options = field.relation ? data[field.relation].map(item => ({ value: item.id, label: String(item.title) })) : (field.options ?? (field.key === 'category' ? data.settings.financeCategories : [])).map(value => ({ value, label: value }))
    if (field.type === 'select' && draft[field.key] && !options.some(option => option.value === draft[field.key])) options.push({ value: String(draft[field.key]), label: String(draft[field.key]) })
    return <label className={['textarea', 'topics'].includes(field.type ?? '') ? 'field wide' : 'field'} key={field.key} htmlFor={id}><span>{field.label}{field.required && ' *'}</span>{field.type === 'select' ? <select id={id} value={String(draft[field.key] ?? '')} onChange={e => update(field.key, e.target.value)} required={field.required}><option value="">Choose…</option>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : field.type === 'textarea' || field.type === 'topics' ? <textarea id={id} rows={3} value={field.type === 'topics' ? list(draft, field.key).join('\n') : String(draft[field.key] ?? '')} onChange={e => update(field.key, field.type === 'topics' ? e.target.value.split('\n') : e.target.value)} maxLength={50000} /> : <input id={id} type={field.type === 'tags' ? 'text' : field.type ?? 'text'} value={field.type === 'tags' ? list(draft, field.key).join(',') : String(draft[field.key] ?? '')} onChange={e => update(field.key, field.type === 'number' ? e.target.value === '' ? '' : Number(e.target.value) : field.type === 'tags' ? e.target.value.split(',') : e.target.value)} required={field.required} min={field.min} max={field.max} step={field.type === 'number' ? 'any' : undefined} maxLength={field.key === 'title' ? 200 : 2000} placeholder={field.type === 'tags' ? 'Comma-separated tags' : field.type === 'url' ? 'https://' : undefined} />}</label>
  })}</div>{error && <p className="error-text" role="alert">{error}</p>}<div className="form-actions"><button className="button secondary" type="button" onClick={onClose} disabled={busy}>Cancel</button><button className="button" disabled={busy}>{busy ? 'Saving…' : `Save ${module.singular}`}</button></div></form></Modal>
}
