import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './pages/Login';
import EmployerDashboard from './pages/EmployerDashboard';
import CreateShift from './pages/createShift';
import ManageShift from './pages/ManageShift';
import GuardProfiles from './pages/GuardProfile';
import Header from './components/Header';
import Footer from './components/Footer';

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/employer-dashboard" element={<EmployerDashboard />} />
        <Route path="/create-shift" element={<CreateShift />} />
        <Route path="/manage-shift" element={<ManageShift />} />
        <Route path="/guard-profiles" element={<GuardProfiles />}>
        </Route>
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;