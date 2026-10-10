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
} from 'lucide-react';
import './Sidebar.css';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Resume-Based Interview', icon: FileText, path: '/resume-interview' },
  { label: 'Technical Interview', icon: Code2, path: '/technical-interview' },
  { label: 'Behavioral Interview', icon: User, path: '/behavioral-interview' },
  { label: 'HR / Managerial Interview', icon: Users, path: '/hr-interview' },
  { label: 'Coding Practice', icon: Terminal, path: '/coding-practice' },
  { label: 'Interview History', icon: Clock, path: '/history' },
  { label: 'Progress & Analytics', icon: BarChart3, path: '/analytics' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

export function Sidebar({ isOpen = false, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavClick = (path) => {
    navigate(path);
    if (onClose) {
      onClose();
    }
  };

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
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <button
                  type="button"
                  id={`nav-${item.path.replace(/\//g, '').replace(/-/g, '_') || 'dashboard'}`}
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
        </ul>
      </nav>

      {/* User Footer */}
      <div className="sidebar-user-footer">
        <div className="sidebar-user-info">
          <div className="sidebar-user-avatar" aria-hidden="true">M</div>
          <div className="sidebar-user-details">
            <span className="sidebar-user-name">Meet Tarapara</span>
            <span className="sidebar-user-email">meet@example.com</span>
          </div>
        </div>
        <button type="button" className="sidebar-logout-btn" aria-label="Log out" title="Log out">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;

