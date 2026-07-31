import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { registerServiceWorker, cleanupLegacyServiceWorkers } from './registerSW';

// Solo los de la v1 (ámbito distinto al nuestro); el propio se conserva.
cleanupLegacyServiceWorkers();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

registerServiceWorker();
