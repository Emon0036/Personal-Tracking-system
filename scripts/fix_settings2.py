import sys

with open('src/pages/SettingsPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the state declarations to include reminderText and reminderTime
old_state = "[confirmation, setConfirmation] = useState(''), [importMode, setImportMode] = useState<'merge' | 'replace'>('merge')"
new_state = "[confirmation, setConfirmation] = useState(''), [importMode, setImportMode] = useState<'merge' | 'replace'>('merge'), [reminderText, setReminderText] = useState(''), [reminderTime, setReminderTime] = useState('09:00')"
content = content.replace(old_state, new_state, 1)

# Remove the unused saveNotifications function
old_save = "  async function saveNotifications() {\n    const settings = { ...draft, notifications: data.settings.notifications }\n    if (await change(current => ({ ...current, settings }))) { setMessage('Notification preferences saved.'); setError('') }\n  }\n"
content = content.replace(old_save, '', 1)

# Remove Bell import since it's used inside the section already
# But remove Plus import from settings since it's used
# Actually keep Bell and Plus imports

with open('src/pages/SettingsPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Fixed SettingsPage state')
