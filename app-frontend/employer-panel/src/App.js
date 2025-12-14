import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ExpressionOfInterest from './pages/ExpressionOfInterest';
import Login from './pages/Login';
import TwoFA from './pages/2FA';
import EmployerDashboard from './pages/EmployerDashboard';
import CreateShift from './pages/createShift';
import ManageShift from './pages/ManageShift';
import ManageShiftDetails from './pages/ManageShiftDetails';
import GuardProfiles from './pages/GuardProfile';
import SubmissionConfirmation from './pages/SubmissionConfirmation';
import CompanyProfile from './pages/CompanyProfile';
import Header from './components/Header';
import Footer from './components/Footer';

function App() {
  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <main style={{ flex: 1, paddingBottom: '20px' }}>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/2fa" element={<TwoFA />} />
            <Route path="/employer-dashboard" element={<EmployerDashboard />} />
            <Route path="/create-shift" element={<CreateShift />} />

            {/* Manage shifts */}
            <Route path="/manage-shift" element={<ManageShift />} />
            <Route path="/manage-shift/:id" element={<ManageShiftDetails />} />

            <Route path="/guard-profiles" element={<GuardProfiles />} />
            <Route path="/company-profile" element={<CompanyProfile />} />
            <Route path="/submission" element={<SubmissionConfirmation />} />
            <Route path="/expression-of-interest" element={<ExpressionOfInterest />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
