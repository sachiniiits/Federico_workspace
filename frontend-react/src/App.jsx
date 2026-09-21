'use strict';

import { Outlet } from 'react-router-dom';
import FeedbackHost from './components/feedback/FeedbackHost.jsx';

/**
 * Root shell. FeedbackHost replaces the document-level snackbar region and
 * dialog scrims that shared/ui-feedback.js created on demand.
 */
export default function App() {
  return (
    <>
      <Outlet />
      <FeedbackHost />
    </>
  );
}
