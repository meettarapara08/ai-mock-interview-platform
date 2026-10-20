import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  Sun,
  Moon,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import AdminSidebar from './AdminSidebar';
import './AdminLayout.css';

export function AdminLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen((prev) => !prev);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  // Determine breadcrumb title
  const getBreadcrumbTitle = () => {
    if (location.pathname === '/admin') return 'Overview & Analytics';
    if (location.pathname === '/admin/users') return 'User Management';
    if (location.pathname === '/admin/questions') return 'Question Bank';
    if (location.pathname === '/admin/roles') return 'Job Roles & Skills';
    if (location.pathname === '/admin/coding') return 'Coding Problems';
    return 'Admin';
  };

  return (
    <div className="admin-layout">
      {/* Mobile Drawer Backdrop */}
      <div
        className={`admin-backdrop ${isMobileSidebarOpen ? 'admin-backdrop-active' : ''}`}
        onClick={closeMobileSidebar}
        aria-hidden="true"
      />

      <AdminSidebar
        isOpen={isMobileSidebarOpen}
        onClose={closeMobileSidebar}
      />

      <div className="admin-main-wrapper">
        {/* Admin Header */}
        <header className="admin-header">
          <div className="admin-header-left">
            <button
              type="button"
              className="admin-menu-toggle"
              onClick={toggleMobileSidebar}
              aria-label="Toggle navigation menu"
            >
              <Menu size={20} />
            </button>
            <div className="admin-breadcrumbs">
              <span className="admin-breadcrumb-root">Admin Portal</span>
              <span className="admin-breadcrumb-sep">/</span>
              <span className="admin-breadcrumb-current">{getBreadcrumbTitle()}</span>
            </div>
          </div>

          <div className="admin-header-right">
            {/* Quick Live Mode Indicator */}
            <div className="admin-status-pill" title="Live Database Connection Active">
              <span className="admin-status-dot" />
              <span>MySQL Live</span>
            </div>

            {/* Dark / Light Mode Switcher */}
            <button
              type="button"
              className="admin-header-icon-btn"
              onClick={toggleTheme}
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Switch to Candidate view */}
            <button
              type="button"
              className="admin-view-app-btn"
              onClick={() => navigate('/')}
              title="Return to regular interview platform"
            >
              <span>User App</span>
              <ExternalLink size={14} />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="admin-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
