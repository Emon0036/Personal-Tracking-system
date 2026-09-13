import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { BookOpen, CheckSquare, ChevronDown, ChevronRight, CircleHelp, Clock3, Compass, Flag, FolderKanban, GraduationCap, LayoutDashboard, Menu, Moon, PanelLeftClose, Settings, ShieldCheck, Sparkles, Sun, TrendingUp, Wallet, WifiOff, X } from 'lucide-react'
import { useStore } from '../data/store'

const groups = [
  { label: 'Productivity', icon: CheckSquare, links: [['Tasks', '/tasks'], ['Habits', '/habits'], ['Time Tracking', '/time-tracking']] },
  { label: 'Learning', icon: GraduationCap, links: [['Courses', '/courses'], ['Skills', '/skills'], ['Study Sessions', '/study-sessions']] },
  { label: 'Finance', icon: Wallet, links: [['Overview', '/finance'], ['Transactions', '/finance/transactions'], ['Budget', '/finance/budget']] },
  { label: 'Information Hub', icon: Compass, links: [['Overview', '/information'], ['AI / ML', '/information/ai-ml'], ['CSE', '/information/cse'], ['Software Engineering', '/information/software'], ['Career', '/information/career'], ['Study Abroad', '/information/study-abroad'], ['Scholarships', '/information/scholarships'], ['Competitions', '/information/competitions'], ['Hackathons', '/information/hackathons'], ['Read Later', '/read-later'], ['Saved Opportunities', '/opportunities']] },
]
export default function Shell() {
  const { data, saving, error, dismissError, change } = useStore()
  const [mobileOpen, setMobileOpen] = useState(false), [collapsed, setCollapsed] = useState<string[]>(['Information Hub']), [online, setOnline] = useState(navigator.onLine)
  const location = useLocation(), sidebar = useRef<HTMLElement>(null), menuButton = useRef<HTMLButtonElement>(null)
  useEffect(() => { setMobileOpen(false); document.getElementById('main-content')?.focus(); document.title = `${location.pathname === '/' ? 'Dashboard' : location.pathname.split('/').filter(Boolean).at(-1)?.replaceAll('-', ' ')} · Personal OS` }, [location.pathname])
  useEffect(() => { const update = () => setOnline(navigator.onLine); window.addEventListener('online', update); window.addEventListener('offline', update); return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update) } }, [])
  useEffect(() => {
    if (!mobileOpen) return
    const overflow = document.body.style.overflow; document.body.style.overflow = 'hidden'
    sidebar.current?.querySelector<HTMLElement>('button, a')?.focus()
    function keydown(event: KeyboardEvent) {
      if (event.key === 'Escape') { setMobileOpen(false); menuButton.current?.focus() }
      if (event.key === 'Tab') {
        const elements = Array.from(sidebar.current?.querySelectorAll<HTMLElement>('a, button') ?? []).filter(element => element.offsetParent !== null)
        const first = elements[0], last = elements.at(-1)
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }
    window.addEventListener('keydown', keydown)
    return () => { document.body.style.overflow = overflow; window.removeEventListener('keydown', keydown) }
  }, [mobileOpen])
  function navGroup(group: typeof groups[number]) {
    const hidden = collapsed.includes(group.label), active = group.links.some(([, path]) => location.pathname === path)
    return <div className="nav-group" key={group.label}><button className={`nav-group-toggle ${active ? 'group-active' : ''}`} onClick={() => setCollapsed(current => hidden ? current.filter(item => item !== group.label) : [...current, group.label])} aria-expanded={!hidden}><group.icon size={18} /><span>{group.label}</span>{hidden ? <ChevronRight size={14} /> : <ChevronDown size={14} />}</button>{!hidden && <div className="nav-children">{group.links.map(([label, path]) => <NavLink end key={path} to={path}>{label}</NavLink>)}</div>}</div>
  }
  return <div className="app-shell"><a className="skip-link" href="#main-content">Skip to content</a>{mobileOpen && <div className="sidebar-backdrop" onClick={() => { setMobileOpen(false); menuButton.current?.focus() }} />}<aside ref={sidebar} className={`sidebar ${mobileOpen ? 'open' : ''}`} aria-label="Primary navigation" role={mobileOpen ? 'dialog' : undefined} aria-modal={mobileOpen || undefined}><div className="brand"><img src="/icon.svg" width="35" height="35" alt="" /><div><strong>Personal OS<span>.</span></strong><small>YOUR LIFE, CONNECTED</small></div><button className="icon-button mobile-close" aria-label="Close navigation" onClick={() => { setMobileOpen(false); menuButton.current?.focus() }}><X size={20} /></button></div><nav><span className="nav-label">WORKSPACE</span><NavLink className="nav-direct" to="/" end><LayoutDashboard size={18} />Dashboard</NavLink>{navGroup(groups[0])}{navGroup(groups[1])}<NavLink className="nav-direct" to="/projects"><FolderKanban size={18} />Projects</NavLink>{navGroup(groups[2])}<NavLink className="nav-direct" to="/goals"><Flag size={18} />Goals</NavLink><span className="nav-label intelligence-label">INTELLIGENCE</span>{navGroup(groups[3])}<NavLink className="nav-direct" to="/analytics"><TrendingUp size={18} />Analytics</NavLink><NavLink className="nav-direct" to="/insights"><Sparkles size={18} />AI Insights</NavLink><NavLink className="nav-direct" to="/notes"><BookOpen size={18} />Notes</NavLink></nav><div className="sidebar-bottom"><div className="local-badge"><ShieldCheck size={17} /><div><strong>Private by default</strong><span>Stored on this device</span></div></div><NavLink className="nav-direct" to="/settings"><Settings size={18} />Settings</NavLink><div className="sidebar-version"><span>PERSONAL OS</span><span>v0.1</span></div></div></aside><div className="main-shell"><header className="topbar"><div><button ref={menuButton} className="icon-button mobile-menu" aria-label="Open navigation" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}><Menu size={22} /></button><PanelLeftClose className="desktop-only muted" size={18} /><span className="breadcrumb">Workspace <ChevronRight size={13} /><strong>{location.pathname === '/' ? 'Dashboard' : location.pathname.split('/').filter(Boolean).at(-1)?.replaceAll('-', ' ')}</strong></span></div><div className="topbar-actions">{data.timer.startedAt !== null && <NavLink className="timer-badge" to="/time-tracking"><Clock3 size={14} />Focus active</NavLink>}<span className="local-status">{!online ? <WifiOff size={14} /> : <span className="status-dot" />}{saving ? 'Saving…' : online ? 'Local workspace' : 'Offline · local data ready'}</span><NavLink className="icon-button help-link" aria-label="Backup and privacy settings" to="/settings"><CircleHelp size={19} /></NavLink><button className="icon-button" aria-label="Toggle light and dark theme" onClick={() => void change(current => ({ ...current, settings: { ...current.settings, theme: document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark' } }))}>{document.documentElement.dataset.theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}</button><NavLink className="avatar" to="/settings" aria-label="Profile settings">{data.settings.name ? data.settings.name.slice(0, 2).toUpperCase() : 'OS'}</NavLink></div></header><main id="main-content" tabIndex={-1}>{error && <div className="notice error-banner" role="alert"><span>{error}</span><button className="text-link" onClick={dismissError}>Dismiss</button></div>}<Outlet /></main><footer className="app-footer"><span>Small steps. Meaningful progress.</span><span><ShieldCheck size={13} /> Your data stays yours.</span></footer></div></div>
}
