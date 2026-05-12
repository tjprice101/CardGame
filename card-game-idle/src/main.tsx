import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/cards/CardRegistry'; // side-effect: wires registry into ScoreSystem
import App from '@/app/App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
