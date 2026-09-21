import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from './App.jsx';

/**
 * Phase 0 skeleton. The full route table from section 2.2 of
 * react-migration-plan.md lands in Phase 2; these few entries exist so the
 * `.html`-suffix SPA fallback in vite.config.js can be verified now.
 *
 * Routes keep their legacy `.html` paths verbatim (DEC-1).
 */
function Placeholder({ name }) {
  return (
    <main style={{ padding: 24, fontFamily: 'var(--font-body, sans-serif)' }}>
      <h1 style={{ margin: 0 }}>{name}</h1>
      <p style={{ color: 'var(--color-muted-fg, #64748b)' }}>
        Not ported yet — scaffold only.
      </p>
    </main>
  );
}

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { path: '/', element: <Navigate to="/landing/landing-page.html" replace /> },
      { path: '/landing/landing-page.html', element: <Placeholder name="Landing" /> },
      {
        path: '/HOM/screen-02-bed-management.html',
        element: <Placeholder name="HOM — Bed Management" />,
      },
      { path: '*', element: <Placeholder name="Not Found" /> },
    ],
  },
]);
