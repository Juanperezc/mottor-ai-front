import { createBrowserRouter, Navigate } from 'react-router';
import { AppShell } from './AppShell';
import { QuotesPage } from '../features/quotes/QuotesPage';
import { QuoteDetailPage } from '../features/quote-detail/QuoteDetailPage';
import { ImportPage } from '../features/import/ImportPage';

export const routes = [
  {
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/quotes" replace /> },
      { path: 'quotes', element: <QuotesPage /> },
      { path: 'quotes/:id', element: <QuoteDetailPage /> },
      { path: 'import', element: <ImportPage /> },
    ],
  },
];

export const createRouter = () => createBrowserRouter(routes);
