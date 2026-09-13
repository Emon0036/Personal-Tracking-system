import sys

with open('src/components/Shell.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old = '<div className="topbar-actions">'
if old in content:
    new = '<div className="topbar-actions"><NotificationManager />'
    content = content.replace(old, new, 1)
    with open('src/components/Shell.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Added NotificationManager to Shell')
else:
    print('Could not find topbar-actions')
    # Look for close button in topbar
    import re
    matches = re.findall(r'topbar-actions[^>]*>', content)
    print('Matches:', matches[:3])
