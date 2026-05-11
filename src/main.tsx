import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const rootEl = document.getElementById('root');
console.log('[ST Resume] Bootstrap: root element found', !!rootEl);

try {
  createRoot(rootEl!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  console.log('[ST Resume] App rendered successfully');
} catch (err) {
  console.error('[ST Resume] Fatal render error:', err);
  rootEl!.innerHTML = `<div style="padding:40px;font-family:sans-serif;"><h1 style="color:red;">App Failed to Load</h1><pre style="background:#fee;padding:20px;border-radius:12px;overflow:auto;max-height:70vh;">${err instanceof Error ? err.stack || err.message : String(err)}</pre></div>`;
}
