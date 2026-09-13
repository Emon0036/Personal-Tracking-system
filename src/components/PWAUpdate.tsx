import { useRegisterSW } from 'virtual:pwa-register/react'

export default function PWAUpdate() {
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW()
  if (!needRefresh) return null
  return <div className="toast" role="status"><span>A new Personal OS version is ready. Save any open form first.</span><button className="text-link" onClick={() => void updateServiceWorker(true)}>Update</button><button className="text-link" onClick={() => setNeedRefresh(false)}>Later</button></div>
}
