import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

import { attach401Handler } from './lib/http';

import ExpressionOfInterest from './pages/ExpressionOfInterest';
import Login from './pages/Login';
import EmployerDashboard from './pages/EmployerDashboard';
import CreateShift from './pages/createShift';
import ManageShift from './pages/ManageShift';
import GuardProfiles from './pages/GuardProfile';
import GuardProfilePage from './pages/GuardProfilePage';
import CompanyProfile from './pages/CompanyProfile';
import SubmissionConfirmation from './pages/SubmissionConfirmation';
import EmailSettings from './pages/EmailSettings';
import TaskDetail from './pages/TaskDetail';

import Header from './components/Header';
import Footer from './components/Footer';
import PageTitleHandler from './components/PageTitleHandler';
import ProtectedRoute from './routes/ProtectedRoute';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import KeyboardShortcutModal from './components/KeyboardShortcutModal';

import Timesheet from './pages/Timesheet';
import DailyMonitoring from './pages/DailyMonitoring';
import Payroll from './pages/Payroll';

import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import FAQs from './pages/FAQs';
import ContactUs from './pages/ContactUs';
import { NotificationProvider } from './components/NotificationContext';

import i18n from './i18n';

function TaskRoute() {
  return (
    <Routes>
      <Route path="/task-detail" element={<TaskDetail />} />
    </Routes>
  );
}

function ProtectedLayout({ children, language, setLanguage, theme, setTheme }) {
  return (
    <ProtectedRoute>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          backgroundColor: 'var(--background)',
          color: 'var(--text-primary)',
          transition: 'background-color 0.3s ease, color 0.3s ease',
        }}
      >
        <Header language={language} setLanguage={setLanguage} theme={theme} setTheme={setTheme} />

        <main
          style={{
            flex: 1,
            paddingBottom: '20px',
          }}
        >
          {children}
        </main>

        <Footer language={language} />
      </div>
    </ProtectedRoute>
  );
}

function AppRoutes({ language, setLanguage, theme, setTheme }) {
  const navigate = useNavigate();
  const { isHelpModalOpen, closeHelpModal } = useKeyboardShortcuts(navigate);

  useEffect(() => {
    attach401Handler(() => navigate('/login'));
  }, [navigate]);

  const protectedLayout = (children) => (
    <ProtectedLayout
      language={language}
      setLanguage={setLanguage}
      theme={theme}
      setTheme={setTheme}
    >
      {children}
    </ProtectedLayout>
  );

  return (
    <>
      <PageTitleHandler />
      <KeyboardShortcutModal isOpen={isHelpModalOpen} onClose={closeHelpModal} />
      <Routes>
        {/* PUBLIC ROUTES */}

        <Route path="/" element={<Login />} />

        <Route path="/login" element={<Login />} />

        <Route path="/2fa" element={<Login />} />

        <Route path="/expression-of-interest" element={<ExpressionOfInterest />} />

        <Route path="/submission" element={<SubmissionConfirmation />} />

        <Route path="/task-detail" element={<TaskRoute />} />

        <Route path="/privacy-policy" element={<PrivacyPolicy />} />

        <Route path="/terms-and-condition" element={<TermsAndConditions />} />

        <Route path="/contact-us" element={<ContactUs />} />

        {/* PROTECTED ROUTES */}

        <Route
          path="/employer-dashboard"
          element={protectedLayout(<EmployerDashboard language={language} />)}
        />

        <Route
          path="/create-shift"
          element={protectedLayout(<CreateShift language={language} />)}
        />

        <Route path="/timesheet" element={protectedLayout(<Timesheet language={language} />)} />

        <Route
          path="/manage-shift"
          element={protectedLayout(<ManageShift language={language} />)}
        />

        <Route
          path="/guard-profiles"
          element={protectedLayout(<GuardProfiles language={language} />)}
        />

        <Route
          path="/guard-profiles/:guardId"
          element={protectedLayout(<GuardProfilePage language={language} />)}
        />

        <Route
          path="/company-profile"
          element={protectedLayout(<CompanyProfile language={language} />)}
        />

        <Route
          path="/email-settings"
          element={protectedLayout(<EmailSettings language={language} />)}
        />

        <Route
          path="/daily-monitoring"
          element={protectedLayout(<DailyMonitoring language={language} />)}
        />

        <Route path="/payroll" element={protectedLayout(<Payroll language={language} />)} />

        <Route path="/faqs" element={protectedLayout(<FAQs />)} />
      </Routes>
    </>
  );
}

function App() {
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    // Save preferences
    localStorage.setItem('language', language);
    localStorage.setItem('theme', theme);

    // Apply theme globally to the <html> element
    document.documentElement.setAttribute('data-theme', theme);

    // Keep i18n language synchronised
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, theme]);

  return (
    <Router>
      <NotificationProvider>
        <AppRoutes
          language={language}
          setLanguage={setLanguage}
          theme={theme}
          setTheme={setTheme}
        />
      </NotificationProvider>
    </Router>
  );
}

export default App;