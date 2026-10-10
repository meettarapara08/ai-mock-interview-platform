import React from 'react';
import { Search, Bell, ChevronDown, Menu } from 'lucide-react';
import './Header.css';

export function Header({ isMobileSidebarOpen = false, onToggleSidebar }) {
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

        <div className="header-user-menu" id="header-user-menu">
          <div className="header-user-avatar" aria-hidden="true">M</div>
          <span className="header-user-name">Meet Tarapara</span>
          <ChevronDown size={16} className="header-user-chevron" />
        </div>
      </div>
    </header>
  );
}

export default Header;

