import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import '@fontsource-variable/fraunces';
import '@fontsource/figtree/400.css';
import '@fontsource/figtree/600.css';
import '@fontsource/figtree/700.css';
import './styles.css';
import { App } from './App';
import { loadFamily } from './lib/family';
import { listenForInstall } from './lib/install';

// Installs the service worker that keeps the app working without signal, and updates it quietly.
registerSW({ immediate: true });
listenForInstall();
void loadFamily();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
