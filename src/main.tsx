import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/vt323/latin.css';
import '@fontsource/vt323/latin-ext.css';
import '@fontsource/courier-prime/latin-400.css';
import '@fontsource/courier-prime/latin-700.css';
import '@fontsource/courier-prime/latin-ext-400.css';
import '@fontsource/courier-prime/latin-ext-700.css';
import '@fontsource/oswald/latin-500.css';
import '@fontsource/oswald/latin-600.css';
import '@fontsource/oswald/latin-700.css';
import '@fontsource/oswald/latin-ext-500.css';
import '@fontsource/oswald/latin-ext-600.css';
import '@fontsource/oswald/latin-ext-700.css';
import 'leaflet/dist/leaflet.css';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
