import sys

with open('src/pages/SettingsPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add Bell and Plus imports
old_import = "import { Download, Upload, ShieldCheck, Trash2 } from 'lucide-react'"
new_import = "import { Download, Upload, ShieldCheck, Trash2, Bell, Plus } from 'lucide-react'"
content = content.replace(old_import, new_import, 1)

# Add notification state after the existing state declarations
old_state = "const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge')"
new_state = "const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge')\n  const [reminderText, setReminderText] = useState('')\n  const [reminderTime, setReminderTime] = useState('09:00')"
content = content.replace(old_state, new_state, 1)

# Add save notifications function after the readImport function
old_func_end = "  async function readImport(file?: File) {\n    if (!file) return\n    setError(''); setMessage('')\n    try { if (file.size > 20 * 1024 * 1024) throw new Error('Backup is larger than the 20 MB limit.'); const incoming = parseBackup(await file.text()); setImporting(incoming); setImportMode('merge') }\n    catch (error) { setError(error instanceof Error ? error.message : 'Could not read the backup.') }\n  }"
new_func_end = old_func_end + """
  async function saveNotifications() {
    const settings = { ...draft, notifications: data.settings.notifications }
    if (await change(current => ({ ...current, settings }))) { setMessage('Notification preferences saved.'); setError('') }
  }"""
content = content.replace(old_func_end, new_func_end, 1)

# Add notifications section inside the Profile & appearance panel, after interests section
# Find the closing </form> of the first section and add notifications before it
# Actually, let's add it right before the settings-side div
old_close_form = "</div><button className=\"button\" disabled={saving > 0}>Save preferences</button></form></section><div className=\"settings-side\">"
new_section = """</div><button className="button" disabled={saving > 0}>Save preferences</button></form></section>
    <section className="panel"><h2><Bell size={19} />Notifications</h2><p className="muted">Browser notifications remind you about tasks and focus sessions. Notifications are handled locally and never sent externally.</p>
      <div className="form-grid"><label className="field"><span>Daily reminder time</span><input type="time" value={reminderTime} onChange={e => setReminderTime(e.target.value)} /></label>
        <label className="field wide"><span>Reminder message</span><input value={reminderText} maxLength={200} placeholder="Get back to your tasks!" onChange={e => setReminderText(e.target.value)} /></label></div>
      <button className="button" disabled={saving > 0 || !reminderText.trim()} onClick={async () => {
        if (!reminderText.trim()) return;
        const n = { id: crypto.randomUUID(), title: reminderText, body: reminderText + ' — time to focus!', time: reminderTime, sent: false }
        await change(d => { d.settings.notifications = [...d.settings.notifications, n]; return d })
        setReminderText(''); setMessage('Reminder set.'); setError('')
      }}><Plus size={16} />Add reminder</button>
      <div className="notification-list" style={{ marginTop: 14 }}>
        {data.settings.notifications.filter(n => !n.sent).map(n => <div key={n.id} className="notification-item"><div><strong>{n.title}</strong><p className="small muted">{n.body} · {n.time}</p></div><button className="icon-button" aria-label={`Dismiss ${n.title}`} onClick={async () => { await change(d => { d.settings.notifications = d.settings.notifications.map(item => item.id === n.id ? { ...item, sent: true } : item); return d }); setMessage('Reminder dismissed.') }}><Trash2 size={14} /></button></div>)}
        {data.settings.notifications.filter(n => !n.sent).length === 0 && <p className="small muted">No active reminders.</p>}
      </div></section><div className="settings-side">"""
content = content.replace(old_close_form, new_section, 1)

with open('src/pages/SettingsPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Added notifications section to SettingsPage')
