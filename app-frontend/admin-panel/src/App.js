import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/adminRoutes';
import { ToastProvider } from './components/Toast';
import { attach401Handler } from './lib/http';

// Auto-logout on 401 responses
attach401Handler(() => {
  window.location.href = '/login';
});

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </BrowserRouter>
  );
}