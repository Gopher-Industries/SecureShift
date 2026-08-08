import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import AdminNavbar from '../components/AdminNavbar';
import AdminFooter from '../components/AdminFooter';

export default function AdminLayout() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <AdminNavbar />

      <div
        style={{
          display: 'flex',
          flex: 1,
        }}
      >
        <AdminSidebar />

        <main
          style={{
            padding: 24,
            background: '#f3f4f6',
            flex: 1,
          }}
        >
          <Outlet />
        </main>
      </div>

      <AdminFooter />
    </div>
  );
}