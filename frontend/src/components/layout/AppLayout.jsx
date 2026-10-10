import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './AppLayout.css';

export function AppLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen((prev) => !prev);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="app-layout">
      {/* Mobile Drawer Backdrop */}
      <div
        className={`sidebar-backdrop ${isMobileSidebarOpen ? 'sidebar-backdrop-active' : ''}`}
        onClick={closeMobileSidebar}
        aria-hidden="true"
      />

      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={closeMobileSidebar}
      />

      <div className="app-main-wrapper">
        <Header
          isMobileSidebarOpen={isMobileSidebarOpen}
          onToggleSidebar={toggleMobileSidebar}
        />
        <main className="app-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;

