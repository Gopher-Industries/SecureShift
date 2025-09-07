import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Pages
import ExpressionOfInterest from './pages/ExpressionOfInterest';
import Login from './pages/Login';
import TwoFA from './pages/2FA';
import EmployerDashboard from './pages/EmployerDashboard';
import CreateShift from './pages/createShift';
import ManageShift from './pages/ManageShift';
import GuardProfiles from './pages/GuardProfile';
import SubmissionConfirmation from './pages/SubmissionConfirmation';
import CompanyProfile from './pages/CompanyProfile';

// Layout Components
import Header from './components/Header';
import Footer from './components/Footer';

function AppContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header will always show */}
      <Header />

      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/2fa" element={<TwoFA />} />
          <Route path="/employer-dashboard" element={<EmployerDashboard />} />
          <Route path="/create-shift" element={<CreateShift />} />
          <Route path="/manage-shift" element={<ManageShift />} />
          <Route path="/guard-profiles" element={<GuardProfiles />} />
          <Route path="/company-profile" element={<CompanyProfile />} />
          <Route path="/submission" element={<SubmissionConfirmation />} />
          <Route path="/expression-of-interest" element={<ExpressionOfInterest />} />
        </Routes>
      </main>

      {/* Footer will always show */}
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
