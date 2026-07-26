import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import AdminNavbar from '../components/AdminNavbar';

export default function AdminLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <AdminNavbar />
        <main style={{ padding: 24, background: '#f3f4f6', flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
