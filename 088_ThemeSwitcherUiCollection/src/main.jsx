import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ThemeProvider } from './context/ThemeContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* アプリ全体をThemeProviderで囲むことで、グローバルなテーマ管理を可能にする */}
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)
