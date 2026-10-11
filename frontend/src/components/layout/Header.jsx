import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, ChevronDown, Menu, User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

export function Header({ isMobileSidebarOpen = false, onToggleSidebar }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const userInitial = (user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase();
  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : user?.username || 'User';

  return (
    <header className="app-header" id="app-header">
      {/* Left Area: Mobile Menu Toggle + Search */}
      <div className="header-left">
        <button
          type="button"
          className="header-mobile-toggle"
          onClick={onToggleSidebar}
          aria-label={isMobileSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMobileSidebarOpen}
          id="header-mobile-toggle"
        >
          <Menu size={22} />
        </button>

        {/* Search Bar */}
        <div className="header-search-wrapper">
          <Search size={18} className="header-search-icon" />
          <input
            type="search"
            className="header-search-input"
            placeholder="Search interview types, questions, or job roles..."
            id="header-search"
            aria-label="Search interview types, questions, or job roles"
          />
        </div>
      </div>

      {/* Right Side: Notification + User */}
      <div className="header-right">
        <button
          type="button"
          className="header-notification-btn"
          aria-label="Notifications"
          id="header-notifications"
        >
          <Bell size={20} />
          <span className="header-notification-dot" aria-hidden="true" />
        </button>

        <div className="header-user-wrapper" ref={userMenuRef}>
          <div
            className="header-user-menu"
            id="header-user-menu"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            role="button"
            tabIndex={0}
            aria-expanded={isUserMenuOpen}
            aria-haspopup="true"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setIsUserMenuOpen(!isUserMenuOpen);
              }
            }}
          >
            <div className="header-user-avatar" aria-hidden="true">
              {userInitial}
            </div>
            <span className="header-user-name">{displayName}</span>
            <ChevronDown
              size={16}
              className={`header-user-chevron ${isUserMenuOpen ? 'chevron-rotated' : ''}`}
            />
          </div>

          {/* User Dropdown */}
          {isUserMenuOpen && (
            <div className="header-user-dropdown" role="menu">
              <div className="dropdown-user-header">
                <span className="dropdown-user-name">{displayName}</span>
                <span className="dropdown-user-email">{user?.email || ''}</span>
              </div>
              <div className="dropdown-divider" />
              <button
                type="button"
                className="dropdown-item"
                role="menuitem"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  navigate('/profile');
                }}
              >
                <User size={16} />
                <span>My Profile</span>
              </button>
              <button
                type="button"
                className="dropdown-item"
                role="menuitem"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  navigate('/settings');
                }}
              >
                <Settings size={16} />
                <span>Account Settings</span>
              </button>
              <div className="dropdown-divider" />
              <button
                type="button"
                className="dropdown-item dropdown-logout"
                role="menuitem"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
