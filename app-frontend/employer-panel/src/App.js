import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import EmployerRegistration from './pages/EmployerRegistration';
import Login from './pages/Login';
import EmployerDashboard from './pages/EmployerDashboard'; 
import CreateShift from './pages/createShift';

function App() {
  return (
    <Router>
      <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
        <Link to="/employer-registration" style={{ marginRight: '1rem' }}>SignUP</Link>
        <Link to="/login" style={{ marginRight: '1rem' }}>Login</Link>
        <Link to="/employer-dashboard">Dashboard</Link>
        <Link to="/create-shift"style={{ marginLeft: '1rem' }}>Create Shift</Link> 
      </nav>

      <Routes>
        <Route path="/employer-registration" element={<EmployerRegistration />} />
        <Route path="/login" element={<Login />} />
        <Route path="/employer-dashboard" element={<EmployerDashboard />} />
        <Route path="/create-shift" element={<CreateShift />} />
        
      </Routes>
    </Router>
  );
}

export default App;