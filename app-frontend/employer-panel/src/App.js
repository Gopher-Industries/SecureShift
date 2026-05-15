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
import Documents from './pages/Documents';

import CompanyProfile from './pages/CompanyProfile';
import SubmissionConfirmation from './pages/SubmissionConfirmation';

import EmailSettings from './pages/EmailSettings';
import TaskDetail from './pages/TaskDetail';

import Header from './components/Header';
import Footer from './components/Footer';
import PageTitleHandler from './components/PageTitleHandler';

import ProtectedRoute from './routes/ProtectedRoute';

import Timesheet from './pages/Timesheet';
import DailyMonitoring from './pages/DailyMonitoring';
import Payroll from './pages/Payroll';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';

function TaskRoute() {
  return (
    <Routes>
      <Route path="/task-detail" element={<TaskDetail />} />
    </Routes>
  );
}

function ProtectedLayout({ children, language, setLanguage }) {
  return (
    <ProtectedRoute>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header language={language} setLanguage={setLanguage} />
        <main style={{ flex: 1, paddingBottom: '20px' }}>{children}</main>
        <Footer language={language} />
      </div>
    </ProtectedRoute>
  );
}

function AppRoutes({ language, setLanguage }) {
  const navigate = useNavigate();

  useEffect(() => {
    attach401Handler(() => navigate('/login'));
  }, [navigate]);

  const protectedLayout = (children) => (
    <ProtectedLayout language={language} setLanguage={setLanguage}>
      {children}
    </ProtectedLayout>
  );

  return (
    <>
      <PageTitleHandler />
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

        {/* PROTECTED ROUTES */}
        <Route path="/employer-dashboard" element={<ProtectedLayout><EmployerDashboard /></ProtectedLayout>} />
        <Route path="/create-shift" element={<ProtectedLayout><CreateShift /></ProtectedLayout>} />
        <Route path="/timesheet" element={<ProtectedLayout><Timesheet /></ProtectedLayout>} />
        <Route path="/manage-shift" element={<ProtectedLayout><ManageShift /></ProtectedLayout>} />
        <Route path="/guard-profiles" element={<ProtectedLayout><GuardProfiles /></ProtectedLayout>} />
        <Route path="/guard-profiles/:guardId" element={<ProtectedLayout><GuardProfilePage /></ProtectedLayout>} />
        <Route path="/company-profile" element={<ProtectedLayout><CompanyProfile /></ProtectedLayout>} />
        <Route path="/email-settings" element={<ProtectedLayout><EmailSettings /></ProtectedLayout>} />
        <Route path="/payroll" element={<ProtectedLayout><Payroll /></ProtectedLayout>} />
        <Route path="/daily-monitoring" element={<ProtectedLayout><DailyMonitoring /></ProtectedLayout>} />
        <Route path="/documents" element={<ProtectedLayout><Documents /></ProtectedLayout>} />
        <Route
          path="/employer-dashboard"
          element={protectedLayout(<EmployerDashboard language={language} />)}
        />
        <Route
          path="/create-shift"
          element={protectedLayout(<CreateShift language={language} />)}
        />
        <Route
          path="/timesheet"
          element={protectedLayout(<Timesheet language={language} />)}
        />
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
        <Route
          path="/payroll"
          element={protectedLayout(<Payroll language={language} />)}
        />

      </Routes>
    </>
  );
}

function App() {
  const [language, setLanguage] = useState(
    localStorage.getItem('language') || 'en'
  );

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  return (
    <Router>
      <AppRoutes language={language} setLanguage={setLanguage} />
    </Router>
  );
}

export default App;