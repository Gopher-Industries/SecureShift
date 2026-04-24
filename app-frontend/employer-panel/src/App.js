import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
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

import Timesheet from "./pages/Timesheet";

import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';

/**
 * PUBLIC ROUTE: Task Detail (no layout)
 */
function TaskRoute() {
  return (
    <Routes>
      <Route path="/task-detail" element={<TaskDetail />} />
    </Routes>
  );
}

/**
 * PROTECTED LAYOUT WRAPPER
 */
function ProtectedLayout({ children }) {
  return (
    <ProtectedRoute>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <main style={{ flex: 1, paddingBottom: '20px' }}>{children}</main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}

function AppRoutes() {
  const navigate = useNavigate();

  useEffect(() => {
    attach401Handler(() => navigate('/login'));
  }, []);

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
      </Routes>
    </>
  );
}
/**
 * MAIN APP ROUTES
 */
function App() {
  return (
    <Router>
      
      <AppRoutes />
    </Router>
  );
}

export default App;
