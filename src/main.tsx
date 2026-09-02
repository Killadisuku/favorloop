import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { bootLive } from './liveBoot'
import { StoreProvider } from './store'

function render() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <HashRouter>
        <StoreProvider>
          <App />
        </StoreProvider>
      </HashRouter>
    </StrictMode>,
  )
}

bootLive().finally(render)
