import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import AdminNavbar from '../components/AdminNavbar';
import AdminFooter from '../components/AdminFooter';
import './AdminLayout.css';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        <AdminNavbar
          onMenuClick={() => setSidebarOpen((prev) => !prev)}
        />

        <main
          style={{
            padding: 24,
            background: '#f3f4f6',
            flex: 1,
            overflowX: 'auto',
          }}
        >
          <Outlet />
        </main>

        <AdminFooter />
      </div>
    </div>
  );
}