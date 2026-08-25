import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProtectedRoute from '../routes/ProtectedRoute';
import BackToTop from '../components/BackToTop/BackToTop';

const ProtectedLayout = () => {
  return (
    <ProtectedRoute>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <main style={{ flex: 1, paddingBottom: '20px' }}>
          <Outlet />
        </main>
        <BackToTop />
        <Footer />
       
      </div>
    </ProtectedRoute>
  );
};

export default ProtectedLayout;
