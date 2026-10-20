import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Code2,
  User,
  Users,
  Terminal,
  Clock,
  BarChart3,
  Settings,
  LogOut,
  BotMessageSquare,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Resume-Based Interview', icon: FileText, path: '/resume-interview' },
  { label: 'Technical Interview', icon: Code2, path: '/interview/setup?type=technical' },
  { label: 'Behavioral Interview', icon: User, path: '/interview/setup?type=behavioral' },
  { label: 'HR / Managerial Interview', icon: Users, path: '/interview/setup?type=hr' },
  { label: 'Coding Practice', icon: Terminal, path: '/coding-practice' },
  { label: 'Interview History', icon: Clock, path: '/history' },
  { label: 'Progress & Analytics', icon: BarChart3, path: '/analytics' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

export function Sidebar({ isOpen = false, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleNavClick = (path) => {
    navigate(path);
    if (onClose) {
      onClose();
    }
  };

  const handleLogout = async () => {
    if (onClose) onClose();
    await logout();
    navigate('/login');
  };

  const userInitial = (user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase();
  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : user?.username || 'User';

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`} id="app-sidebar">
      {/* Logo & Mobile Close */}
      <div className="sidebar-header-area">
        <div
          className="sidebar-logo"
          onClick={() => handleNavClick('/')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleNavClick('/');
          }}
        >
          <div className="sidebar-logo-icon">
            <BotMessageSquare size={24} />
          </div>
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-title">AI Mock Interview</span>
            <span className="sidebar-logo-tagline">Practice · Improve · Get Hired</span>
          </div>
        </div>

        {/* Mobile Close Button */}
        <button
          type="button"
          className="sidebar-close-btn"
          onClick={onClose}
          aria-label="Close navigation menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" aria-label="Main navigation">
        <ul className="sidebar-nav-list">
          {NAV_ITEMS.map((item) => {
            const currentFullPath = location.pathname + location.search;
            const isActive = item.path.includes('?')
              ? currentFullPath === item.path
              : location.pathname === item.path;
            const Icon = item.icon;
            const safeId = `nav-${item.path.split('?')[0].replace(/\//g, '').replace(/-/g, '_') || 'dashboard'}${
              item.path.includes('?') ? '_' + item.path.split('?')[1].replace(/[=&]/g, '_') : ''
            }`;
            return (
              <li key={item.path}>
                <button
                  type="button"
                  id={safeId}
                  className={`sidebar-nav-item ${isActive ? 'sidebar-nav-active' : ''}`}
                  onClick={() => handleNavClick(item.path)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon size={18} className="sidebar-nav-icon" />
                  <span className="sidebar-nav-label">{item.label}</span>
                </button>
              </li>
            );
          })}
          {user?.is_staff && (
            <li key="/admin" style={{ marginTop: '12px', borderTop: '1px solid var(--color-border, #e2e8f0)', paddingTop: '12px' }}>
              <button
                type="button"
                id="nav-admin_portal"
                className={`sidebar-nav-item ${location.pathname.startsWith('/admin') ? 'sidebar-nav-active' : ''}`}
                onClick={() => handleNavClick('/admin')}
                style={{
                  color: 'var(--color-accent-indigo, #4f46e5)',
                  backgroundColor: location.pathname.startsWith('/admin') ? 'var(--color-accent-indigo-light, #eef2ff)' : 'transparent',
                  fontWeight: 600,
                }}
              >
                <ShieldCheck size={18} className="sidebar-nav-icon" />
                <span className="sidebar-nav-label">Admin Portal</span>
                <span style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--color-accent-indigo, #4f46e5)',
                  color: '#ffffff',
                  fontWeight: 700,
                  marginLeft: 'auto',
                }}>STAFF</span>
              </button>
            </li>
          )}
        </ul>
      </nav>

      {/* User Footer */}
      <div className="sidebar-user-footer">
        <div
          className="sidebar-user-info"
          onClick={() => handleNavClick('/profile')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleNavClick('/profile');
          }}
          style={{ cursor: 'pointer' }}
          title="View profile"
        >
          <div className="sidebar-user-avatar" aria-hidden="true">
            {userInitial}
          </div>
          <div className="sidebar-user-details">
            <span className="sidebar-user-name">{displayName}</span>
            <span className="sidebar-user-email">{user?.email || ''}</span>
          </div>
        </div>
        <button
          type="button"
          className="sidebar-logout-btn"
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

export default Sidebar;

