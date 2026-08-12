import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// Set before the first paint so a returning user with a saved 'light'
// preference never sees a flash of the dark default (ThemeProvider's own
// effect runs after mount, which would be one frame too late).
const savedTheme = localStorage.getItem('storedash_admin_theme');
document.documentElement.dataset.theme = savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'dark';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
