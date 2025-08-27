import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './pages/Login';
import EmployerDashboard from './pages/EmployerDashboard';
import CreateShift from './pages/createShift';
import ManageShift from './pages/ManageShift';
import GuardProfiles from './pages/GuardProfile';
import CompanyProfile from './pages/CompanyProfile';
import Header from './components/Header';
import Footer from './components/Footer';

function App() {
  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <div style={{ flex: 1, paddingBottom: '20px' }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/employer-dashboard" element={<EmployerDashboard />} />
            <Route path="/create-shift" element={<CreateShift />} />
            <Route path="/manage-shift" element={<ManageShift />} />
            <Route path="/guard-profiles" element={<GuardProfiles />} />
            <Route path="/company-profile" element={<CompanyProfile />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;