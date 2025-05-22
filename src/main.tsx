import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n'

// Global error handlers to catch and suppress external script errors
window.addEventListener('error', (event) => {
  // Suppress jQuery/external SVG errors
  if (event.message?.includes('attribute d: Expected number') || 
      event.filename?.includes('jquery') ||
      event.filename?.includes('translateContent')) {
    console.warn('Suppressed external script error:', event.message);
    event.preventDefault();
    return false;
  }
});

// Handle unhandled promise rejections from browser extensions
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('message channel closed') ||
      event.reason?.message?.includes('listener indicated an asynchronous response')) {
    console.warn('Suppressed browser extension error:', event.reason.message);
    event.preventDefault();
    return false;
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
