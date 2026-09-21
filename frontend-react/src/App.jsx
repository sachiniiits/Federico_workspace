import { Outlet } from 'react-router-dom';

/**
 * Root shell. Phase 2 mounts the toast region and dialog host here, replacing
 * shared/ui-feedback.js's document-level singletons.
 */
export default function App() {
  return <Outlet />;
}
