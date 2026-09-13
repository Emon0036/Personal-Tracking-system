import { useState, useEffect, useRef } from 'react'
import { Bell, Trash2 } from 'lucide-react'
import { useStore } from '../data/store'
import { Modal } from './ui'

export function NotificationManager() {
  const { data, change } = useStore()
  const [open, setOpen] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [reminders, setReminders] = useState(data.settings.notifications)
  const [focusActive, setFocusActive] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const focusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setPermission('Notification' in window ? (Notification.permission as NotificationPermission) : 'denied')
  }, [])

  useEffect(() => {
    const handle = async () => {
      if (permission === 'default' && 'Notification' in window) {
        const result = await Notification.requestPermission()
        setPermission(result as NotificationPermission)
      }
    }
    handle()
  }, [permission])

  useEffect(() => {
    if (reminders.length === 0) return
    intervalRef.current = setInterval(() => {
      const now = new Date()
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      for (const reminder of reminders) {
        if (reminder.time === currentTime && !reminder.sent) {
          triggerNotification(reminder.title, reminder.body)
          setReminders(prev => prev.map(r => r.id === reminder.id ? { ...r, sent: true } : r))
        }
      }
    }, 30000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [reminders, permission])

  useEffect(() => {
    const timer = useStore.getState().data.timer
    if (timer.startedAt !== null && !focusActive) {
      setFocusActive(true)
      triggerNotification('Focus Mode Active', 'You are in a study session. Stay focused!')
      focusIntervalRef.current = setInterval(() => {
        const currentTimer = useStore.getState().data.timer
        if (currentTimer.startedAt === null) {
          setFocusActive(false)
          if (focusIntervalRef.current) clearInterval(focusIntervalRef.current)
          triggerNotification('Focus Session Complete', 'Great work! Your study session has ended.')
        } else {
          triggerNotification('Focus Mode', 'You are in a study session. Take a break if needed.')
        }
      }, 30 * 60000)
    }
  }, [])

  function triggerNotification(title: string, body: string) {
    if (permission === 'granted') {
      try {
        const n = new Notification(title, { body, icon: '/icon.svg', tag: 'personal-os' })
        setTimeout(() => n.close(), 5000)
      } catch { /* browser notifications not supported */ }
    }
  }

    function removeReminder(id: string) {
    change(d => { d.settings.notifications = d.settings.notifications.filter(r => r.id !== id); return d })
    setReminders(prev => prev.filter(r => r.id !== id))
  }

  function clearSent() {
    const unsent = reminders.filter(r => !r.sent)
    setReminders(unsent)
    change(d => { d.settings.notifications = unsent; return d })
  }

  return (
    <>
      <button className="icon-button" aria-label="Notifications" onClick={() => setOpen(true)} style={{ position: 'relative' }}>
        <Bell size={19} />
        {reminders.filter(r => !r.sent).length > 0 && (
          <span style={{ position: 'absolute', top: 4, right: 4, width: 7, height: 7, background: 'var(--danger)', borderRadius: '50%' }} />
        )}
      </button>
      {open && <Modal title="Notifications" onClose={() => setOpen(false)}>
        <div className="notifications-content">
          <div className="notification-section">
            <h3>Daily Reminders</h3>
            <p className="small muted">Set times to be reminded about tasks and study goals.</p>
            {reminders.filter(r => !r.sent).map(r => (
              <div key={r.id} className="notification-item">
                <div>
                  <strong>{r.title}</strong>
                  <p className="small muted">{r.body} · {r.time}</p>
                </div>
                <button className="icon-button" aria-label={`Dismiss ${r.title}`} onClick={() => removeReminder(r.id)}><Trash2 size={14} /></button>
              </div>
            ))}
            {reminders.filter(r => !r.sent).length === 0 && <p className="small muted">No active reminders.</p>}
            <button className="button secondary small" onClick={clearSent} style={{ marginTop: 10 }}>Clear completed</button>
          </div>
          <div className="notification-section">
            <h3>Focus Alerts</h3>
            <p className="small muted">Get notified when focus sessions start and end.</p>
            {focusActive && <div className="notification-item"><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 2s ease infinite', display: 'inline-block' }} /> Focus session is active</div>}
          </div>
        </div>
      </Modal>}
    </>
  )
}
