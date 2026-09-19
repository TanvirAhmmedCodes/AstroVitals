import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import './i18n'; // Initialize i18n
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { SoundProvider } from './components/SoundProvider.jsx';

// Register Service Worker for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('PWA ServiceWorker registration failed: ', err);
    });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <SoundProvider>
          <App />
        </SoundProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
