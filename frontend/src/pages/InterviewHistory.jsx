import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Code2,
  User,
  Users,
  Briefcase,
  Play,
  ArrowRight,
  Loader2,
  AlertCircle,
  Trophy,
  CheckCircle2,
  Search,
  Filter,
  BarChart2,
} from 'lucide-react';
import { listSessions } from '../api/interviews';
import './InterviewHistory.css';

const TYPE_ICONS = {
  technical: Code2,
  behavioral: User,
  hr: Users,
  managerial: Briefcase,
};

const TYPE_COLORS = {
  technical: { bg: '#ecfeff', color: '#06b6d4', label: 'Technical' },
  behavioral: { bg: '#f0fdf4', color: '#16a34a', label: 'Behavioral' },
  hr: { bg: '#eef2ff', color: '#4F46E5', label: 'HR' },
  managerial: { bg: '#fefce8', color: '#eab308', label: 'Managerial' },
};

const DIFFICULTY_BADGES = {
  easy: { label: 'Easy', bg: '#f0fdf4', color: '#16a34a' },
  medium: { label: 'Medium', bg: '#fffbeb', color: '#f59e0b' },
  hard: { label: 'Hard', bg: '#fef2f2', color: '#dc2626' },
};

export function InterviewHistory() {
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listSessions();
      setSessions(data);
    } catch (err) {
      setError('Failed to load interview history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      if (typeFilter !== 'all' && session.interview_type !== typeFilter) {
        return false;
      }
      if (statusFilter !== 'all' && session.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const role = (session.job_role || '').toLowerCase();
        const type = (session.interview_type_display || '').toLowerCase();
        if (!role.includes(query) && !type.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [sessions, typeFilter, statusFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = sessions.length;
    const completed = sessions.filter((s) => s.status === 'completed').length;
    const completedWithScore = sessions.filter(
      (s) => s.status === 'completed' && s.overall_score !== null && s.overall_score !== undefined
    );
    const avgScore = completedWithScore.length
      ? Math.round(
          completedWithScore.reduce((sum, s) => sum + s.overall_score, 0) /
            completedWithScore.length
        )
      : null;

    return { total, completed, avgScore };
  }, [sessions]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="history-page" id="interview-history-page">
      {/* Header Row */}
      <div className="history-header">
        <div className="history-header-text">
          <h1 className="history-title">Interview History</h1>
          <p className="history-subtitle">
            Review your past mock interviews, track score improvements, and revisit AI feedback.
          </p>
        </div>
        <button
          type="button"
          className="history-new-btn"
          id="history-start-new-btn"
          onClick={() => navigate('/interview/setup')}
        >
          <Play size={16} />
          <span>Start New Interview</span>
        </button>
      </div>

      {/* Summary Stats Cards */}
      <div className="history-stats-grid">
        <div className="history-stat-card">
          <div className="history-stat-icon-wrap" style={{ backgroundColor: '#eef2ff' }}>
            <Clock size={20} style={{ color: '#4F46E5' }} />
          </div>
          <div className="history-stat-info">
            <span className="history-stat-val">{stats.total}</span>
            <span className="history-stat-label">Total Interviews</span>
          </div>
        </div>

        <div className="history-stat-card">
          <div className="history-stat-icon-wrap" style={{ backgroundColor: '#f0fdf4' }}>
            <CheckCircle2 size={20} style={{ color: '#16a34a' }} />
          </div>
          <div className="history-stat-info">
            <span className="history-stat-val">{stats.completed}</span>
            <span className="history-stat-label">Completed</span>
          </div>
        </div>

        <div className="history-stat-card">
          <div className="history-stat-icon-wrap" style={{ backgroundColor: '#fffbeb' }}>
            <Trophy size={20} style={{ color: '#f59e0b' }} />
          </div>
          <div className="history-stat-info">
            <span className="history-stat-val">
              {stats.avgScore !== null ? `${stats.avgScore}%` : '—'}
            </span>
            <span className="history-stat-label">Average Score</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="history-controls-bar">
        {/* Search */}
        <div className="history-search-wrap">
          <Search size={16} className="history-search-icon" />
          <input
            type="text"
            className="history-search-input"
            placeholder="Search by job role or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Pills */}
        <div className="history-filters">
          <div className="history-filter-group">
            <span className="history-filter-label">Type:</span>
            <select
              className="history-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="technical">Technical</option>
              <option value="behavioral">Behavioral</option>
              <option value="hr">HR</option>
              <option value="managerial">Managerial</option>
            </select>
          </div>

          <div className="history-filter-group">
            <span className="history-filter-label">Status:</span>
            <select
              className="history-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="setup">Setup</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="history-loading">
          <Loader2 size={32} className="spin" />
          <span>Loading interview history...</span>
        </div>
      ) : error ? (
        <div className="history-error-card">
          <AlertCircle size={24} className="history-error-icon" />
          <p>{error}</p>
          <button type="button" className="history-retry-btn" onClick={fetchHistory}>
            Try Again
          </button>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="history-empty-card" id="history-empty-state">
          <div className="history-empty-icon-wrap">
            <BarChart2 size={36} />
          </div>
          <h3 className="history-empty-title">
            {sessions.length === 0 ? 'No Interviews Yet' : 'No Matching Interviews'}
          </h3>
          <p className="history-empty-desc">
            {sessions.length === 0
              ? 'Start your first AI mock interview to practice answering role-specific questions and receive actionable feedback.'
              : 'Try adjusting your search query or filter options to find the interview session you are looking for.'}
          </p>
          {sessions.length === 0 ? (
            <button
              type="button"
              className="history-empty-cta"
              onClick={() => navigate('/interview/setup')}
            >
              <Play size={16} />
              <span>Start an Interview</span>
            </button>
          ) : (
            <button
              type="button"
              className="history-reset-btn"
              onClick={() => {
                setTypeFilter('all');
                setStatusFilter('all');
                setSearchQuery('');
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="history-list" id="history-items-list">
          {filteredSessions.map((session) => {
            const Icon = TYPE_ICONS[session.interview_type] || Briefcase;
            const typeStyle = TYPE_COLORS[session.interview_type] || {
              bg: '#f8fafc',
              color: '#64748B',
              label: session.interview_type_display,
            };
            const diffBadge = DIFFICULTY_BADGES[session.difficulty] || {
              label: session.difficulty_display || session.difficulty,
              bg: '#f8fafc',
              color: '#64748B',
            };

            const isCompleted = session.status === 'completed';
            const isInProgress = session.status === 'in_progress';

            return (
              <div
                key={session.id}
                className="history-item-card"
                id={`history-item-${session.id}`}
                onClick={() => {
                  if (isCompleted) {
                    navigate(`/interview/result/${session.id}`);
                  } else if (isInProgress) {
                    navigate(`/interview/session/${session.id}`);
                  }
                }}
              >
                {/* Left: Type Icon */}
                <div
                  className="history-item-icon-wrap"
                  style={{ backgroundColor: typeStyle.bg }}
                >
                  <Icon size={22} style={{ color: typeStyle.color }} />
                </div>

                {/* Middle: Details */}
                <div className="history-item-details">
                  <div className="history-item-top-row">
                    <h3 className="history-item-role">{session.job_role}</h3>
                    <span
                      className="history-item-type-chip"
                      style={{ backgroundColor: typeStyle.bg, color: typeStyle.color }}
                    >
                      {session.interview_type_display || typeStyle.label}
                    </span>
                    <span
                      className="history-item-diff-chip"
                      style={{ backgroundColor: diffBadge.bg, color: diffBadge.color }}
                    >
                      {diffBadge.label}
                    </span>
                  </div>

                  <div className="history-item-meta-row">
                    <span className="history-item-date">
                      {formatDate(session.created_at)}
                    </span>
                    <span className="history-item-dot">•</span>
                    <span className="history-item-qcount">
                      {session.questions_answered ?? 0}/{session.total_questions} Questions
                    </span>
                    {session.is_ai_generated && (
                      <>
                        <span className="history-item-dot">•</span>
                        <span className="history-item-ai-tag">AI Powered</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right: Status / Score & Action */}
                <div className="history-item-right">
                  {isCompleted ? (
                    <div className="history-item-score-wrap">
                      <span className="history-item-score-val">
                        {session.overall_score !== null && session.overall_score !== undefined
                          ? `${Math.round(session.overall_score)}%`
                          : '—'}
                      </span>
                      <span className="history-item-score-label">Overall Score</span>
                    </div>
                  ) : (
                    <span
                      className={`history-item-status-badge ${
                        isInProgress ? 'status-in-progress' : 'status-setup'
                      }`}
                    >
                      {session.status_display || (isInProgress ? 'In Progress' : 'Setup')}
                    </span>
                  )}

                  <button
                    type="button"
                    className="history-item-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isCompleted) {
                        navigate(`/interview/result/${session.id}`);
                      } else {
                        navigate(`/interview/session/${session.id}`);
                      }
                    }}
                  >
                    <span>{isCompleted ? 'View Results' : 'Resume'}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default InterviewHistory;
