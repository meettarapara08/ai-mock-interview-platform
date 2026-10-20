import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  HelpCircle,
  Briefcase,
  Terminal,
  ArrowLeft,
  LogOut,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './AdminSidebar.css';

const ADMIN_NAV_ITEMS = [
  { label: 'Admin Dashboard', icon: LayoutDashboard, path: '/admin' },
  { label: 'User Management', icon: Users, path: '/admin/users' },
  { label: 'Question Bank', icon: HelpCircle, path: '/admin/questions' },
  { label: 'Job Roles & Skills', icon: Briefcase, path: '/admin/roles' },
  { label: 'Coding Problems', icon: Terminal, path: '/admin/coding' },
];

export function AdminSidebar({ isOpen = false, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleNavClick = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  const handleLogout = async () => {
    if (onClose) onClose();
    await logout();
    navigate('/login');
  };

  const userInitial = (user?.first_name?.[0] || user?.username?.[0] || 'A').toUpperCase();
  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : user?.username || 'Administrator';

  return (
    <aside className={`admin-sidebar ${isOpen ? 'admin-sidebar-open' : ''}`} id="admin-sidebar">
      {/* Header Area */}
      <div className="admin-sidebar-header">
        <div
          className="admin-sidebar-logo"
          onClick={() => handleNavClick('/admin')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleNavClick('/admin');
          }}
        >
          <div className="admin-logo-icon">
            <ShieldCheck size={22} />
          </div>
          <div className="admin-logo-text">
            <div className="admin-title-row">
              <span className="admin-title">InterviewIQ</span>
              <span className="admin-badge">ADMIN</span>
            </div>
            <span className="admin-subtitle">Control & Analytics Center</span>
          </div>
        </div>

        <button
          type="button"
          className="admin-sidebar-close-btn"
          onClick={onClose}
          aria-label="Close admin menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* Nav List */}
      <nav className="admin-sidebar-nav" aria-label="Admin navigation">
        <div className="admin-nav-section-title">ADMINISTRATION</div>
        <ul className="admin-nav-list">
          {ADMIN_NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <button
                  type="button"
                  className={`admin-nav-item ${isActive ? 'admin-nav-active' : ''}`}
                  onClick={() => handleNavClick(item.path)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon size={18} className="admin-nav-icon" />
                  <span className="admin-nav-label">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="admin-nav-section-title" style={{ marginTop: '24px' }}>NAVIGATION</div>
        <ul className="admin-nav-list">
          <li>
            <button
              type="button"
              className="admin-nav-item admin-nav-exit"
              onClick={() => handleNavClick('/')}
            >
              <ArrowLeft size={18} className="admin-nav-icon" />
              <span className="admin-nav-label">Exit to Main App</span>
              <ExternalLink size={14} className="admin-nav-external" />
            </button>
          </li>
        </ul>
      </nav>

      {/* User Footer */}
      <div className="admin-sidebar-footer">
        <div className="admin-user-info">
          <div className="admin-user-avatar">
            {userInitial}
          </div>
          <div className="admin-user-details">
            <span className="admin-user-name">{displayName}</span>
            <span className="admin-user-role">Super Admin / Staff</span>
          </div>
        </div>
        <button
          type="button"
          className="admin-logout-btn"
          aria-label="Log out"
          title="Log out"
          onClick={handleLogout}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;
