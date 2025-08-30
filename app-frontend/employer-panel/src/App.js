import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ExpressionOfInterest from './pages/ExpressionOfInterest';
import Login from './pages/Login';
import EmployerDashboard from './pages/EmployerDashboard';
import CreateShift from './pages/createShift';
import ManageShift from './pages/ManageShift';
import GuardProfiles from './pages/GuardProfile';
import SubmissionConfirmation from './pages/SubmissionConfirmation';
import CompanyProfile from './pages/CompanyProfile';

function App() {
  return (
    <Router>
      <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
        <Link to="/expression-of-interest" style={{ marginRight: '1rem' }}>
          Expression of Interest
        </Link>
        <Link to="/login" style={{ marginRight: '1rem' }}>Login</Link>
        <Link to="/employer-dashboard" style={{ marginRight: '1rem' }}>Dashboard</Link>
        <Link to="/submission">Submission</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/expression-of-interest" element={<ExpressionOfInterest />} />
        <Route path="/login" element={<Login />} />
        <Route path="/employer-dashboard" element={<EmployerDashboard />} />
        <Route path="/create-shift" element={<CreateShift />} />
        <Route path="/manage-shift" element={<ManageShift />} />
        <Route path="/guard-profiles" element={<GuardProfiles />} />
        <Route path="/submission" element={<SubmissionConfirmation />} />
        <Route path="/company-profile" element={<CompanyProfile />} />
      </Routes>
    </Router>
  );
}

export default App;
