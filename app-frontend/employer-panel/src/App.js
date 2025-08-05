import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './pages/Login';
import EmployerDashboard from './pages/EmployerDashboard'; 
import CreateShift from './pages/createShift';
import ManageShift from './pages/ManageShift';
import GuardProfiles from './pages/GuardProfiles';

function App() {
  return (
    <Router>
      <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
        <Link to="/login" style={{ marginRight: '1rem' }}>Login</Link>
        <Link to="/employer-dashboard" style={{ marginRight: '1rem' }}>Dashboard</Link>
        <Link to="/create-shift" style={{ marginRight: '1rem' }}>Create Shift</Link>
         <Link to="/manage-shift" style={{ marginLeft: '1rem' }}>Manage Shift</Link>
        <Link to="/guard-profiles">Guard Profiles</Link>
      </nav>

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/employer-dashboard" element={<EmployerDashboard />} />
        <Route path="/create-shift" element={<CreateShift />} />
        <Route path="/manage-shift" element={<ManageShift />} />
        <Route path="/guard-profiles" element={<GuardProfiles />} />
      </Routes>
    </Router>
  );
}

export default App;
