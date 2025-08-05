import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './pages/Login';
import EmployerDashboard from './pages/EmployerDashboard';
import CreateShift from './pages/createShift';
import ManageShift from './pages/ManageShift';

function App() {
  return (
    <Router>
      <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
        <Link to="/login" style={{ marginRight: '1rem' }}>Login</Link>
        <Link to="/employer-dashboard">Dashboard</Link>
        <Link to="/create-shift" style={{ marginLeft: '1rem' }}>Create Shift</Link>
        <Link to="/manage-shift" style={{ marginLeft: '1rem' }}>Manage Shift</Link>
      </nav>

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/employer-dashboard" element={<EmployerDashboard />} />
        <Route path="/create-shift" element={<CreateShift />} />
        <Route path="/manage-shift" element={<ManageShift />} />
      </Routes>
    </Router>
  );
}

export default App;