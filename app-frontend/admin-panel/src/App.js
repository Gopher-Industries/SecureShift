import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/adminRoutes';
import { ToastProvider, useToast } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import { attach401Handler, attachErrorToastHandler } from './lib/http';

// Auto-logout on 401 responses
attach401Handler(() => {
  window.location.href = '/login?sessionExpired=1';
});

// Wires the global error-toast handler once ToastProvider has mounted
// (it needs the showToast function, which only exists inside the provider).
function ErrorToastBridge() {
  const { showToast } = useToast();
  useEffect(() => {
    attachErrorToastHandler(showToast);
  }, [showToast]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ErrorToastBridge />
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
      </ToastProvider>
    </BrowserRouter>
  );
}
