import { useEffect, useState } from 'react'
import { Play, Pause, Square, Clock3 } from 'lucide-react'
import { localDate } from '../data/model'
import { newEntry, useStore } from '../data/store'
import { PageHeading } from '../components/ui'
import { Link } from 'react-router-dom'

export default function TimerPage() {
  const { data, change, saving } = useStore()
  const timer = data.timer
  const [now, setNow] = useState(Date.now()), [message, setMessage] = useState('')
  const [draft, setDraft] = useState({ topic: timer.topic, course: timer.course, skill: timer.skill, category: timer.category, notes: timer.notes })
  useEffect(() => { const interval = window.setInterval(() => setNow(Date.now()), 500); return () => clearInterval(interval) }, [])
  const elapsed = timer.elapsed + (timer.startedAt !== null ? Math.max(0, now - timer.startedAt) : 0)
  const seconds = Math.floor(elapsed / 1000)
  const active = timer.startedAt !== null || timer.elapsed > 0
  async function toggle() {
    setMessage(''); setNow(Date.now())
    await change(current => {
      if (current.timer.startedAt !== null) current.timer = { ...current.timer, elapsed: current.timer.elapsed + Math.max(0, Date.now() - current.timer.startedAt), startedAt: null }
      else current.timer = { ...current.timer, ...(!active ? { ...draft, topic: draft.topic.trim() } : {}), startedAt: Date.now() }
      return current
    })
  }
  async function stop() {
    const success = await change(current => {
      const duration = (current.timer.elapsed + (current.timer.startedAt !== null ? Math.max(0, Date.now() - current.timer.startedAt) : 0)) / 60000
      if (duration < 0.01) throw new Error('Track at least one second before saving.')
      current.studySessions.push({ ...newEntry(), title: current.timer.topic, date: localDate(), duration: Math.round(duration * 100) / 100, course: current.timer.course, skill: current.timer.skill, category: current.timer.category, notes: current.timer.notes })
      current.timer = { ...current.timer, startedAt: null, elapsed: 0 }
      return current
    })
    if (success) setMessage('Session saved to your study history.')
  }
  return <><PageHeading eyebrow="PRODUCTIVITY" title="Time tracking" description="One topic. Your full attention. Make the time count." action={<Link className="button secondary" to="/study-sessions">Session history</Link>} /><section className="panel timer-panel"><span className="empty-icon"><Clock3 size={26} /></span><p className="eyebrow">FOCUS SESSION</p><div className="timer-display" role="timer" aria-label="Elapsed study time">{String(Math.floor(seconds / 3600)).padStart(2, '0')}:{String(Math.floor(seconds / 60) % 60).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</div><p className="muted">{timer.startedAt !== null ? 'Your session is running. You can navigate away.' : active ? 'Paused. Take a breath, then come back.' : 'Choose a topic to begin.'}</p><div className="form-grid"><label className="field wide"><span>Topic *</span><input value={active ? timer.topic : draft.topic} disabled={active} maxLength={200} onChange={e => setDraft({ ...draft, topic: e.target.value })} placeholder="What are you studying?" /></label>{(['course', 'skill'] as const).map(key => <label className="field" key={key}><span>{key === 'course' ? 'Course' : 'Skill'}</span><select disabled={active} value={active ? timer[key] : draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.value })}><option value="">No {key}</option>{data[key === 'course' ? 'courses' : 'skills'].map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>)}<label className="field wide"><span>Category</span><input disabled={active} value={active ? timer.category : draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })} /></label><label className="field wide"><span>Session notes</span><textarea disabled={active} value={active ? timer.notes : draft.notes} onChange={e => setDraft({ ...draft, notes: e.target.value })} rows={2} /></label></div><div className="button-row"><button className="button" disabled={saving > 0 || (!active && !draft.topic.trim())} onClick={() => void toggle()}>{timer.startedAt !== null ? <Pause size={17} /> : <Play size={17} />}{timer.startedAt !== null ? 'Pause' : active ? 'Resume' : 'Start session'}</button><button className="button secondary" disabled={saving > 0 || !active} onClick={() => void stop()}><Square size={16} />Stop & save</button></div>{message && <p className="success-text" role="status">{message}</p>}<p className="small muted">The timer survives refreshes. Sessions are recorded on the local date you stop them.</p></section></>
}
