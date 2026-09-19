import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import AdminNavbar from '../components/AdminNavbar';
import './AdminLayout.css';
import { useTheme } from '../theme/ThemeProvider';

export default function AdminLayout() {
  const { colors } = useTheme();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <AdminNavbar onMenuClick={() => setSidebarOpen((prev) => !prev)} />
        <main
          style={{
            padding: 24,
            background: colors.bg,
            flex: 1,
            overflowX: 'auto',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
