
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Bell,
  ChevronDown,
  Menu,
  User,
  Settings,
  LogOut,
  Sun,
  Moon,
  CheckCheck,
  Sparkles,
  Award,
  Info,
  Code2,
  Briefcase,
  Compass,
  FileText,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../../api/notifications';
import { getCodingProblems } from '../../api/coding';
import './Header.css';

// Static platform search data
const INTERVIEW_TYPE_SUGGESTIONS = [
  { id: 'it-tech', title: 'Technical Interview', subtitle: 'Coding concepts, system design & technical depth', category: 'Interview Type', link: '/interview/setup?type=technical' },
  { id: 'it-beh', title: 'Behavioral Interview', subtitle: 'STAR method, leadership & interpersonal scenarios', category: 'Interview Type', link: '/interview/setup?type=behavioral' },
  { id: 'it-hr', title: 'HR Interview', subtitle: 'Cultural fit, compensation & background discussions', category: 'Interview Type', link: '/interview/setup?type=hr' },
  { id: 'it-mgr', title: 'Managerial Interview', subtitle: 'Team leadership, delivery & strategic planning', category: 'Interview Type', link: '/interview/setup?type=managerial' },
  { id: 'it-resume', title: 'Resume-Based Interview', subtitle: 'Questions tailored to your uploaded experience & skills', category: 'Interview Type', link: '/resume-interview' },
];

const JOB_ROLE_SUGGESTIONS = [
  { id: 'jr-swe', title: 'Software Engineer', subtitle: 'General software design and algorithms', category: 'Job Role', link: '/interview/setup?role=Software%20Engineer' },
  { id: 'jr-fe', title: 'Frontend Developer', subtitle: 'React, modern web frameworks and UI/UX', category: 'Job Role', link: '/interview/setup?role=Frontend%20Developer' },
  { id: 'jr-be', title: 'Backend Developer', subtitle: 'APIs, databases, and microservices architecture', category: 'Job Role', link: '/interview/setup?role=Backend%20Developer' },
  { id: 'jr-fs', title: 'Full Stack Developer', subtitle: 'End-to-end web architecture and systems', category: 'Job Role', link: '/interview/setup?role=Full%20Stack%20Developer' },
  { id: 'jr-devops', title: 'DevOps Engineer', subtitle: 'CI/CD, Kubernetes, Docker and cloud infrastructure', category: 'Job Role', link: '/interview/setup?role=DevOps%20Engineer' },
  { id: 'jr-ds', title: 'Data Scientist', subtitle: 'Machine learning, statistics and Python data modeling', category: 'Job Role', link: '/interview/setup?role=Data%20Scientist' },
  { id: 'jr-pm', title: 'Product Manager', subtitle: 'Product roadmap, metrics and user requirements', category: 'Job Role', link: '/interview/setup?role=Product%20Manager' },
  { id: 'jr-qa', title: 'QA Engineer', subtitle: 'Automated testing, quality assurance and test plans', category: 'Job Role', link: '/interview/setup?role=QA%20Engineer' },
  { id: 'jr-cloud', title: 'Cloud Engineer', subtitle: 'AWS, Azure, GCP infrastructure and reliability', category: 'Job Role', link: '/interview/setup?role=Cloud%20Engineer' },
  { id: 'jr-mob', title: 'Mobile Developer', subtitle: 'iOS, Android, React Native & mobile architectures', category: 'Job Role', link: '/interview/setup?role=Mobile%20Developer' },
];

const NAVIGATION_SUGGESTIONS = [
  { id: 'nav-dash', title: 'Dashboard', subtitle: 'Overview, analytics and recent activity', category: 'Page', link: '/' },
  { id: 'nav-setup', title: 'Interview Setup', subtitle: 'Configure a new practice interview session', category: 'Page', link: '/interview/setup' },
  { id: 'nav-coding', title: 'Coding Practice', subtitle: 'Browse problem bank and code editor workspace', category: 'Page', link: '/coding-practice' },
  { id: 'nav-hist', title: 'Interview History', subtitle: 'Review previous scores and feedback reports', category: 'Page', link: '/history' },
  { id: 'nav-prof', title: 'My Profile', subtitle: 'Target role, experience and personal details', category: 'Page', link: '/profile' },
  { id: 'nav-sett', title: 'Account Settings', subtitle: 'Update preferences and credentials', category: 'Page', link: '/settings' },
];

export function Header({ isMobileSidebarOpen = false, onToggleSidebar }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  // Dropdown states
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [codingResults, setCodingResults] = useState([]);
  const [isSearchingCoding, setIsSearchingCoding] = useState(false);

  const userMenuRef = useRef(null);
  const notificationsRef = useRef(null);
  const searchWrapperRef = useRef(null);
  const searchInputRef = useRef(null);

  // Fetch unread notification count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const count = await getUnreadCount();
      setUnreadCount(typeof count === 'number' ? count : 0);
    } catch {
      // Background poll fail silently
    }
  }, [user]);

  // Fetch notification list
  const fetchNotificationList = useCallback(async () => {
    if (!user) return;
    setIsLoadingNotifications(true);
    try {
      const data = await getNotifications(20);
      setNotifications(data?.notifications || []);
      setUnreadCount(data?.unread_count || 0);
    } catch {
      // Non-blocking error handling
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Search debouncing for coding problems API
  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setCodingResults([]);
      setIsSearchingCoding(false);
      return;
    }

    setIsSearchingCoding(true);
    const timer = setTimeout(async () => {
      try {
        const problems = await getCodingProblems({ search: query });
        if (Array.isArray(problems)) {
          setCodingResults(
            problems.slice(0, 5).map((p) => ({
              id: `cp-${p.slug}`,
              title: p.title,
              subtitle: `${p.category || 'Problem'} • ${p.difficulty || 'Medium'}`,
              category: 'Coding Problem',
              link: `/coding-practice/${p.slug}`,
              difficulty: p.difficulty,
            }))
          );
        } else {
          setCodingResults([]);
        }
      } catch {
        setCodingResults([]);
      } finally {
        setIsSearchingCoding(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter static platform suggestions
  const filteredSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { interviewTypes: [], jobRoles: [], pages: [] };

    return {
      interviewTypes: INTERVIEW_TYPE_SUGGESTIONS.filter(
        (i) => i.title.toLowerCase().includes(q) || i.subtitle.toLowerCase().includes(q)
      ),
      jobRoles: JOB_ROLE_SUGGESTIONS.filter(
        (r) => r.title.toLowerCase().includes(q) || r.subtitle.toLowerCase().includes(q)
      ),
      pages: NAVIGATION_SUGGESTIONS.filter(
        (p) => p.title.toLowerCase().includes(q) || p.subtitle.toLowerCase().includes(q)
      ),
    };
  }, [searchQuery]);

  const totalResultsCount =
    filteredSuggestions.interviewTypes.length +
    filteredSuggestions.jobRoles.length +
    filteredSuggestions.pages.length +
    codingResults.length;

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchResultClick = (link) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    navigate(link);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setIsSearchOpen(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const toggleNotifications = () => {
    if (!isNotificationsOpen) {
      setIsNotificationsOpen(true);
      setIsUserMenuOpen(false);
      setIsSearchOpen(false);
      fetchNotificationList();
    } else {
      setIsNotificationsOpen(false);
    }
  };

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    setIsNotificationsOpen(false);
    setIsSearchOpen(false);
    await logout();
    navigate('/login');
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // Quiet fail
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      try {
        await markNotificationAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // Proceed anyway
      }
    }
    setIsNotificationsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  const renderNotificationIcon = (type) => {
    switch (type) {
      case 'interview':
        return <Award size={16} className="notif-type-icon notif-interview" />;
      case 'coding':
        return <Sparkles size={16} className="notif-type-icon notif-coding" />;
      default:
        return <Info size={16} className="notif-type-icon notif-system" />;
    }
  };

  const userInitial = (user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase();
  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : user?.username || 'User';

  return (
    <header className="app-header" id="app-header">
      {/* Left Area: Mobile Menu Toggle + Functional Search */}
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

        {/* Search Bar Container */}
        <div className="header-search-wrapper" ref={searchWrapperRef}>
          <Search size={18} className="header-search-icon" />
          <input
            ref={searchInputRef}
            type="search"
            className="header-search-input"
            placeholder="Search interview types, questions, or job roles..."
            id="header-search"
            aria-label="Search interview types, questions, or job roles"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => {
              if (searchQuery.trim().length > 0) {
                setIsSearchOpen(true);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsSearchOpen(false);
              }
            }}
            autoComplete="off"
          />

          {searchQuery && (
            <button
              type="button"
              className="header-search-clear-btn"
              onClick={handleClearSearch}
              aria-label="Clear search"
              title="Clear search"
            >
              <X size={15} />
            </button>
          )}

          {/* Search Results Dropdown */}
          {isSearchOpen && searchQuery.trim().length > 0 && (
            <div className="header-search-dropdown" role="listbox" id="header-search-dropdown">
              {totalResultsCount === 0 && !isSearchingCoding ? (
                <div className="search-empty-state">
                  <Search size={24} className="search-empty-icon" />
                  <span className="search-empty-text">No results found for "{searchQuery}"</span>
                  <span className="search-empty-sub">
                    Try searching for "Technical", "Frontend", "React", or "Two Sum"
                  </span>
                </div>
              ) : (
                <div className="search-results-list">
                  {/* Interview Types */}
                  {filteredSuggestions.interviewTypes.length > 0 && (
                    <div className="search-group">
                      <div className="search-group-header">
                        <Layers size={13} />
                        <span>Interview Types</span>
                      </div>
                      {filteredSuggestions.interviewTypes.map((item) => (
                        <div
                          key={item.id}
                          className="search-result-item"
                          onClick={() => handleSearchResultClick(item.link)}
                          role="option"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSearchResultClick(item.link);
                          }}
                        >
                          <div className="search-item-icon-wrapper interview">
                            <Award size={15} />
                          </div>
                          <div className="search-item-info">
                            <span className="search-item-title">{item.title}</span>
                            <span className="search-item-desc">{item.subtitle}</span>
                          </div>
                          <span className="search-badge interview-badge">Practice</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Job Roles */}
                  {filteredSuggestions.jobRoles.length > 0 && (
                    <div className="search-group">
                      <div className="search-group-header">
                        <Briefcase size={13} />
                        <span>Job Roles</span>
                      </div>
                      {filteredSuggestions.jobRoles.map((item) => (
                        <div
                          key={item.id}
                          className="search-result-item"
                          onClick={() => handleSearchResultClick(item.link)}
                          role="option"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSearchResultClick(item.link);
                          }}
                        >
                          <div className="search-item-icon-wrapper role">
                            <Briefcase size={15} />
                          </div>
                          <div className="search-item-info">
                            <span className="search-item-title">{item.title}</span>
                            <span className="search-item-desc">{item.subtitle}</span>
                          </div>
                          <span className="search-badge role-badge">Role</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Coding Practice Problems */}
                  {(codingResults.length > 0 || isSearchingCoding) && (
                    <div className="search-group">
                      <div className="search-group-header">
                        <Code2 size={13} />
                        <span>Coding Problems</span>
                        {isSearchingCoding && <span className="search-loading-dot" />}
                      </div>
                      {codingResults.map((item) => (
                        <div
                          key={item.id}
                          className="search-result-item"
                          onClick={() => handleSearchResultClick(item.link)}
                          role="option"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSearchResultClick(item.link);
                          }}
                        >
                          <div className="search-item-icon-wrapper coding">
                            <Code2 size={15} />
                          </div>
                          <div className="search-item-info">
                            <span className="search-item-title">{item.title}</span>
                            <span className="search-item-desc">{item.subtitle}</span>
                          </div>
                          {item.difficulty && (
                            <span className={`search-badge diff-${item.difficulty.toLowerCase()}`}>
                              {item.difficulty}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Navigation Pages */}
                  {filteredSuggestions.pages.length > 0 && (
                    <div className="search-group">
                      <div className="search-group-header">
                        <Compass size={13} />
                        <span>Platform Pages</span>
                      </div>
                      {filteredSuggestions.pages.map((item) => (
                        <div
                          key={item.id}
                          className="search-result-item"
                          onClick={() => handleSearchResultClick(item.link)}
                          role="option"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSearchResultClick(item.link);
                          }}
                        >
                          <div className="search-item-icon-wrapper page">
                            <FileText size={15} />
                          </div>
                          <div className="search-item-info">
                            <span className="search-item-title">{item.title}</span>
                            <span className="search-item-desc">{item.subtitle}</span>
                          </div>
                          <span className="search-badge page-badge">Go to</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Side: Theme Toggle + Notification + User */}
      <div className="header-right">
        {user?.is_staff && (
          <button
            type="button"
            className="header-admin-quick-btn"
            onClick={() => navigate('/admin')}
            title="Open Admin Portal"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: 'var(--color-accent-indigo-light, #eef2ff)',
              color: 'var(--color-accent-indigo, #4f46e5)',
              border: '1px solid var(--color-accent-indigo-border, #c7d2fe)',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              marginRight: '4px',
            }}
          >
            <ShieldCheck size={15} />
            <span>Admin</span>
          </button>
        )}

        {/* Dark/Light Mode Toggle */}
        <button
          type="button"
          className="header-theme-toggle"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          id="header-theme-toggle"
        >
          {isDark ? <Sun size={19} /> : <Moon size={19} />}
        </button>

        {/* Notification Bell & Dropdown */}
        <div className="header-notification-wrapper" ref={notificationsRef}>
          <button
            type="button"
            className={`header-notification-btn ${isNotificationsOpen ? 'active' : ''}`}
            aria-label="Notifications"
            id="header-notifications"
            onClick={toggleNotifications}
            aria-expanded={isNotificationsOpen}
            aria-haspopup="true"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="header-notification-badge" aria-label={`${unreadCount} unread notifications`}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="header-notifications-dropdown" role="menu" id="header-notifications-dropdown">
              <div className="notification-dropdown-header">
                <div className="notification-header-left">
                  <span className="notification-title">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="notification-badge-pill">{unreadCount} new</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="notification-mark-all-btn"
                    onClick={handleMarkAllRead}
                    title="Mark all as read"
                  >
                    <CheckCheck size={14} />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="notification-list">
                {isLoadingNotifications ? (
                  <div className="notification-loading-state">
                    <span className="notification-spinner" />
                    <span>Loading notifications...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="notification-empty-state">
                    <div className="notification-empty-icon">
                      <Bell size={28} />
                    </div>
                    <span className="notification-empty-title">All caught up!</span>
                    <p className="notification-empty-desc">
                      You don't have any notifications right now.
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
                      onClick={() => handleNotificationClick(notif)}
                      role="menuitem"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleNotificationClick(notif);
                        }
                      }}
                    >
                      <div className="notification-item-icon-wrapper">
                        {renderNotificationIcon(notif.notification_type)}
                      </div>
                      <div className="notification-item-content">
                        <div className="notification-item-title-row">
                          <span className="notification-item-title">{notif.title}</span>
                          {!notif.is_read && <span className="notification-unread-dot" />}
                        </div>
                        <p className="notification-item-message">{notif.message}</p>
                        <span className="notification-item-time">
                          {formatTimestamp(notif.created_at)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="header-user-wrapper" ref={userMenuRef}>
          <div
            className="header-user-menu"
            id="header-user-menu"
            onClick={() => {
              setIsUserMenuOpen(!isUserMenuOpen);
              setIsNotificationsOpen(false);
              setIsSearchOpen(false);
            }}
            role="button"
            tabIndex={0}
            aria-expanded={isUserMenuOpen}
            aria-haspopup="true"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setIsUserMenuOpen(!isUserMenuOpen);
                setIsNotificationsOpen(false);
                setIsSearchOpen(false);
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
              {user?.is_staff && (
                <button
                  type="button"
                  className="dropdown-item"
                  role="menuitem"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigate('/admin');
                  }}
                  style={{ color: 'var(--color-accent-indigo, #4f46e5)', fontWeight: 600 }}
                >
                  <ShieldCheck size={16} />
                  <span>Admin Portal</span>
                </button>
              )}
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
