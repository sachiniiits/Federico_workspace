import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

// The three stylesheets every legacy page loaded on every route. Portal-specific
// stylesheets are imported by their own route chunk instead, so only one portal's
// CSS is live at a time — see DEC-5 in react-migration-plan.md.
import './styles/design-tokens.css';
import './styles/material-components.css';
import './styles/ui-feedback.css';

import { router } from './routes.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
