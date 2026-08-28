import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ShopProvider } from './lib/store';
import { AccountProvider } from './lib/account';
import App from './App';
import { initEggs } from './lib/eggs';
import './styles/app.css';

initEggs();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <ShopProvider>
        <AccountProvider>
          <App />
        </AccountProvider>
      </ShopProvider>
    </BrowserRouter>
  </StrictMode>
);
