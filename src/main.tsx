import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import PWAUpdate from './components/PWAUpdate'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /><PWAUpdate /></React.StrictMode>)
