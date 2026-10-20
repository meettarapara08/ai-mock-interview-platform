import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Briefcase,
  Terminal,
  Database,
  RefreshCw,
  Clock,
  AlertCircle,
  UserCheck,
  Code2,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from 'recharts';
import { getAdminDashboardStats } from '../../api/admin';
import { useTheme } from '../../context/ThemeContext';
import './AdminDashboard.css';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activityFilter, setActivityFilter] = useState('all');

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const res = await getAdminDashboardStats();
      setData(res);
    } catch (err) {
      console.error('Failed to load admin dashboard statistics:', err);
      setError(err?.response?.data?.detail || 'Unable to connect to the administration server. Please verify credentials.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Activity filter handler
  const filteredActivity = (data?.recent_activity || []).filter((item) => {
    if (activityFilter === 'all') return true;
    if (activityFilter === 'interviews') return item.type === 'interview_session';
    if (activityFilter === 'coding') return item.type === 'coding_submission';
    if (activityFilter === 'users') return item.type === 'user_registered';
    return true;
  });

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'completed' || status === 'accepted' || status === 'active') {
      return 'badge-success';
    }
    if (status === 'in_progress' || status === 'setup' || status === 'time_limit_exceeded') {
      return 'badge-warning';
    }
    if (status === 'wrong_answer' || status === 'compilation_error' || status === 'runtime_error' || status === 'failed') {
      return 'badge-danger';
    }
    return 'badge-secondary';
  };

  if (isLoading) {
    return (
      <div className="admin-dashboard-loading">
        <div className="admin-loading-spinner" />
        <span className="admin-loading-text">Loading platform intelligence...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error-card">
        <AlertCircle size={36} className="admin-error-icon" />
        <h3>Failed to Load Admin Intelligence</h3>
        <p>{error}</p>
        <button
          type="button"
          className="admin-retry-btn"
          onClick={() => fetchStats(false)}
        >
          <RefreshCw size={16} />
          Retry Connection
        </button>
      </div>
    );
  }

  const { summary, category_breakdown, activity_trends } = data || {};

  return (
    <div className="admin-dashboard">
      {/* Top Welcome & Actions */}
      <div className="admin-hero-banner">
        <div className="admin-hero-content">
          <div className="admin-hero-tag">
            <ShieldCheck size={14} />
            <span>REAL-TIME PLATFORM CONTROL</span>
          </div>
          <h1 className="admin-hero-title">Platform Operations & Analytics</h1>
          <p className="admin-hero-desc">
            Aggregated metrics across candidates, mock interview sessions, algorithm coding practice, and question banks.
          </p>
        </div>

        <div className="admin-hero-actions">
          <button
            type="button"
            className="admin-refresh-btn"
            onClick={() => fetchStats(true)}
            disabled={isRefreshing}
          >
            <RefreshCw size={16} className={isRefreshing ? 'spin-icon' : ''} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Live Data'}</span>
          </button>
        </div>
      </div>

      {/* 4 Core KPI Stat Cards */}
      <div className="admin-kpi-grid">
        {/* KPI 1: Total Users */}
        <div className="admin-kpi-card kpi-indigo">
          <div className="kpi-header">
            <span className="kpi-label">Registered Candidates</span>
            <div className="kpi-icon-wrap">
              <Users size={20} />
            </div>
          </div>
          <div className="kpi-value">{summary?.total_users?.toLocaleString() ?? 0}</div>
          <div className="kpi-footer">
            <span className="kpi-badge kpi-badge-positive">
              +{summary?.new_users_30d ?? 0} in 30d
            </span>
            <span className="kpi-subtext">{summary?.active_users ?? 0} active • {summary?.staff_users ?? 0} staff</span>
          </div>
        </div>

        {/* KPI 2: Total Interviews */}
        <div className="admin-kpi-card kpi-cyan">
          <div className="kpi-header">
            <span className="kpi-label">Mock Interviews</span>
            <div className="kpi-icon-wrap">
              <Briefcase size={20} />
            </div>
          </div>
          <div className="kpi-value">{summary?.total_interviews?.toLocaleString() ?? 0}</div>
          <div className="kpi-footer">
            <span className="kpi-badge kpi-badge-cyan">
              {summary?.interview_completion_rate ?? 0}% completed
            </span>
            <span className="kpi-subtext">Avg Score: {summary?.average_interview_score ?? 0}%</span>
          </div>
        </div>

        {/* KPI 3: Coding Submissions */}
        <div className="admin-kpi-card kpi-green">
          <div className="kpi-header">
            <span className="kpi-label">Code Submissions</span>
            <div className="kpi-icon-wrap">
              <Terminal size={20} />
            </div>
          </div>
          <div className="kpi-value">{summary?.total_coding_submissions?.toLocaleString() ?? 0}</div>
          <div className="kpi-footer">
            <span className="kpi-badge kpi-badge-green">
              {summary?.coding_acceptance_rate ?? 0}% Accepted
            </span>
            <span className="kpi-subtext">{summary?.total_coding_problems ?? 0} problem bank items</span>
          </div>
        </div>

        {/* KPI 4: Question Bank & Resumes */}
        <div className="admin-kpi-card kpi-amber">
          <div className="kpi-header">
            <span className="kpi-label">Question Bank & Data</span>
            <div className="kpi-icon-wrap">
              <Database size={20} />
            </div>
          </div>
          <div className="kpi-value">{summary?.total_question_bank?.toLocaleString() ?? 0}</div>
          <div className="kpi-footer">
            <span className="kpi-badge kpi-badge-amber">
              {summary?.total_resumes ?? 0} Resumes
            </span>
            <span className="kpi-subtext">Verified database records</span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="admin-charts-grid">
        {/* Chart 1: 14-Day Activity Trends */}
        <div className="admin-chart-card chart-wide">
          <div className="chart-card-header">
            <div>
              <h2 className="chart-title">14-Day Platform Velocity</h2>
              <p className="chart-subtitle">Daily mock interview sessions vs. coding submissions</p>
            </div>
            <div className="chart-legend-custom">
              <span className="legend-indicator dot-indigo">Interviews</span>
              <span className="legend-indicator dot-cyan">Code Submissions</span>
            </div>
          </div>
          <div className="chart-body" style={{ height: 280 }}>
            {activity_trends && activity_trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activity_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorInterviews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#e2e8f0'} />
                  <XAxis dataKey="label" stroke={isDark ? '#94a3b8' : '#64748b'} tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#64748b' }} />
                  <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1e293b' : '#ffffff',
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                      borderRadius: '8px',
                      boxShadow: 'var(--shadow-md)',
                      color: isDark ? '#f8fafc' : '#111827',
                    }}
                    itemStyle={{ color: isDark ? '#f8fafc' : '#111827' }}
                    labelStyle={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600, marginBottom: '4px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="interviews"
                    name="Interviews"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorInterviews)"
                  />
                  <Area
                    type="monotone"
                    dataKey="submissions"
                    name="Submissions"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSubmissions)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty-state">No activity recorded in the past 14 days</div>
            )}
          </div>
        </div>

        {/* Chart 2: Category Breakdown */}
        <div className="admin-chart-card">
          <div className="chart-card-header">
            <div>
              <h2 className="chart-title">Interview Categories</h2>
              <p className="chart-subtitle">Practice distribution by category</p>
            </div>
          </div>
          <div className="chart-body" style={{ height: 280 }}>
            {category_breakdown && category_breakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={category_breakdown}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="count"
                    nameKey="name"
                  >
                    {category_breakdown.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color || '#4f46e5'}
                        stroke={isDark ? '#1e293b' : '#ffffff'}
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1e293b' : '#ffffff',
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                      borderRadius: '8px',
                      boxShadow: 'var(--shadow-md)',
                      color: isDark ? '#f8fafc' : '#111827',
                    }}
                    itemStyle={{ color: isDark ? '#f8fafc' : '#111827' }}
                    labelStyle={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600, marginBottom: '4px' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '12px', paddingTop: '10px', color: isDark ? '#94a3b8' : '#64748b' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty-state">No interview sessions initiated yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Navigation / Management Cards */}
      <div className="admin-shortcuts-section">
        <h2 className="section-title">Administrative Modules</h2>
        <div className="admin-shortcuts-grid">
          <div
            className="shortcut-card"
            onClick={() => navigate('/admin/users')}
            role="button"
            tabIndex={0}
          >
            <div className="shortcut-icon icon-indigo">
              <Users size={22} />
            </div>
            <div className="shortcut-info">
              <h3>User Management</h3>
              <p>Inspect registered candidates, toggle status, and inspect profiles.</p>
            </div>
            <ChevronRight size={18} className="shortcut-arrow" />
          </div>

          <div
            className="shortcut-card"
            onClick={() => navigate('/admin/questions')}
            role="button"
            tabIndex={0}
          >
            <div className="shortcut-icon icon-cyan">
              <HelpCircle size={22} />
            </div>
            <div className="shortcut-info">
              <h3>Question Bank</h3>
              <p>Manage pre-defined questions, categories, and difficulty levels.</p>
            </div>
            <ChevronRight size={18} className="shortcut-arrow" />
          </div>

          <div
            className="shortcut-card"
            onClick={() => navigate('/admin/roles')}
            role="button"
            tabIndex={0}
          >
            <div className="shortcut-icon icon-amber">
              <Briefcase size={22} />
            </div>
            <div className="shortcut-info">
              <h3>Job Roles & Skills</h3>
              <p>Configure industry job titles, suggested tech stacks, and topics.</p>
            </div>
            <ChevronRight size={18} className="shortcut-arrow" />
          </div>

          <div
            className="shortcut-card"
            onClick={() => navigate('/admin/coding')}
            role="button"
            tabIndex={0}
          >
            <div className="shortcut-icon icon-green">
              <Code2 size={22} />
            </div>
            <div className="shortcut-info">
              <h3>Coding Problems</h3>
              <p>Curate algorithm challenges, starter templates, and test cases.</p>
            </div>
            <ChevronRight size={18} className="shortcut-arrow" />
          </div>
        </div>
      </div>

      {/* Recent Platform Activity Feed */}
      <div className="admin-activity-section">
        <div className="activity-section-header">
          <div>
            <h2 className="section-title">Recent Platform Activity</h2>
            <p className="section-subtitle">Real-time log of registrations, interview completions, and coding submissions</p>
          </div>

          <div className="activity-filter-pills">
            <button
              type="button"
              className={`filter-pill ${activityFilter === 'all' ? 'filter-pill-active' : ''}`}
              onClick={() => setActivityFilter('all')}
            >
              All Events
            </button>
            <button
              type="button"
              className={`filter-pill ${activityFilter === 'interviews' ? 'filter-pill-active' : ''}`}
              onClick={() => setActivityFilter('interviews')}
            >
              Interviews
            </button>
            <button
              type="button"
              className={`filter-pill ${activityFilter === 'coding' ? 'filter-pill-active' : ''}`}
              onClick={() => setActivityFilter('coding')}
            >
              Coding
            </button>
            <button
              type="button"
              className={`filter-pill ${activityFilter === 'users' ? 'filter-pill-active' : ''}`}
              onClick={() => setActivityFilter('users')}
            >
              Registrations
            </button>
          </div>
        </div>

        <div className="activity-table-wrapper">
          {filteredActivity.length > 0 ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Event Type</th>
                  <th>Candidate / User</th>
                  <th>Action Details</th>
                  <th>Status / Score</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivity.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className={`event-type-badge ${item.type}`}>
                        {item.type === 'interview_session' && <Briefcase size={13} />}
                        {item.type === 'coding_submission' && <Terminal size={13} />}
                        {item.type === 'user_registered' && <UserCheck size={13} />}
                        <span>
                          {item.type === 'interview_session' && 'Interview'}
                          {item.type === 'coding_submission' && 'Coding'}
                          {item.type === 'user_registered' && 'Sign Up'}
                        </span>
                      </span>
                    </td>
                    <td>
                      <div className="table-user-cell">
                        <span className="table-user-name">{item.user?.username || 'Unknown'}</span>
                        <span className="table-user-email">{item.user?.email || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="table-details-cell">
                        <span className="table-detail-title">{item.title}</span>
                        <span className="table-detail-sub">{item.subtitle}</span>
                      </div>
                    </td>
                    <td>
                      <div className="table-status-cell">
                        <span className={`status-pill ${getStatusBadgeClass(item.status, item.type)}`}>
                          {item.status?.replace('_', ' ')}
                        </span>
                        {item.score !== null && item.score !== undefined && (
                          <span className="status-score-tag">{item.score}%</span>
                        )}
                      </div>
                    </td>
                    <td className="table-time-cell">
                      {formatDate(item.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="activity-empty-state">
              <Clock size={32} className="empty-icon" />
              <p>No activity matching the selected filter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
