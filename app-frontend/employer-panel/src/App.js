import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import ExpressionOfInterest from './pages/ExpressionOfInterest';
import Login from './pages/Login';
import TwoFA from './pages/2FA';
import EmployerDashboard from './pages/EmployerDashboard';
import CreateShift from './pages/createShift';
import ManageShift from './pages/ManageShift';
import GuardProfiles from './pages/GuardProfile';
import SubmissionConfirmation from './pages/SubmissionConfirmation';
import CompanyProfile from './pages/CompanyProfile';
import Header from './components/Header';
import Footer from './components/Footer';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Header />
          <main style={{ flex: 1, paddingBottom: '20px' }}>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/2fa" element={<TwoFA />} />

              {/* Protected routes */}
              <Route
                path="/employer-dashboard"
                element={
                  <ProtectedRoute>
                    <EmployerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-shift"
                element={
                  <ProtectedRoute>
                    <CreateShift />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manage-shift"
                element={
                  <ProtectedRoute>
                    <ManageShift />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/guard-profiles"
                element={
                  <ProtectedRoute>
                    <GuardProfiles />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/company-profile"
                element={
                  <ProtectedRoute>
                    <CompanyProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/submission"
                element={
                  <ProtectedRoute>
                    <SubmissionConfirmation />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/expression-of-interest"
                element={
                  <ProtectedRoute>
                    <ExpressionOfInterest />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;