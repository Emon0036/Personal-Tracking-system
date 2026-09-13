import { Component, lazy, Suspense, useEffect, type ReactNode } from 'react'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { useStore } from './data/store'
import Shell from './components/Shell'
import Dashboard from './pages/Dashboard'
import { EmptyState } from './components/ui'
import type { Collection } from './data/model'

const CollectionPage = lazy(() => import('./pages/CollectionPage'))
const TimerPage = lazy(() => import('./pages/TimerPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'))
const InformationPage = lazy(() => import('./pages/InformationPage'))
const InsightsPage = lazy(() => import('./pages/InsightsPage'))
const routes: [string, Collection][] = [['tasks', 'tasks'], ['habits', 'habits'], ['courses', 'courses'], ['skills', 'skills'], ['study-sessions', 'studySessions'], ['projects', 'projects'], ['goals', 'goals'], ['finance/transactions', 'financeTransactions'], ['finance/budget', 'financeBudgets'], ['read-later', 'savedArticles'], ['opportunities', 'opportunities'], ['notes', 'notes']]

class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <div className="startup"><h1>Something interrupted your workspace.</h1><p>Your saved local data has not been cleared. Reload to try again.</p><button className="button" onClick={() => window.location.reload()}>Reload Personal OS</button></div> : this.props.children }
}
export default function App() {
  const { ready, error, load, data } = useStore()
  useEffect(() => { void load() }, [load])
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => { document.documentElement.dataset.theme = data.settings.theme === 'system' ? media.matches ? 'dark' : 'light' : data.settings.theme }
    apply(); media.addEventListener('change', apply); return () => media.removeEventListener('change', apply)
  }, [data.settings.theme])
  if (!ready) return <div className="startup"><img src="/icon.svg" width="48" height="48" alt="" /><h1>Personal OS</h1>{error ? <><p role="alert">{error}</p><p>Enable browser storage, or close other tabs and try again. Existing data will not be reset.</p><button className="button" onClick={() => void load()}>Retry local storage</button></> : <p role="status">Opening your private workspace…</p>}</div>
  return <ErrorBoundary><BrowserRouter><Suspense fallback={<div className="startup" role="status">Loading your workspace…</div>}><Routes><Route element={<Shell />}><Route index element={<Dashboard />} />{routes.map(([path, collection]) => <Route key={path} path={path} element={<CollectionPage key={collection} collection={collection} />} />)}<Route path="time-tracking" element={<TimerPage />} /><Route path="finance" element={<AnalyticsPage finance />} /><Route path="analytics" element={<AnalyticsPage />} /><Route path="information" element={<InformationPage />} /><Route path="information/:category" element={<InformationPage />} /><Route path="insights" element={<InsightsPage />} /><Route path="settings" element={<SettingsPage />} /><Route path="*" element={<EmptyState title="This page is off the map" description="Return to your dashboard to find your next step." action={<Link className="button" to="/">Back to dashboard</Link>} />} /></Route></Routes></Suspense></BrowserRouter></ErrorBoundary>
}
