import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { createRouter } from './app/router';
import './index.css';

async function start() {
  if (import.meta.env.MODE === 'mock') {
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
  createRoot(document.getElementById('root') as HTMLElement).render(
    <StrictMode>
      <RouterProvider router={createRouter()} />
    </StrictMode>,
  );
}

void start();
