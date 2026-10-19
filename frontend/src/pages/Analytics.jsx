import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Award,
  Clock,
  Code2,
  Brain,
  Sparkles,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Calendar,
  Zap,
  Target,
  Terminal,
  FileText,
  User,
  Users,
  Briefcase,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { getUserAnalytics } from '../api/interviews';
import CategoryChip from '../components/ui/CategoryChip';
import './Analytics.css';

const CATEGORY_ICONS = {
  technical: Code2,
  behavioral: User,
  hr: Users,
  managerial: Briefcase,
  resume: FileText,
};

export function Analytics() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadAnalytics = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const res = await getUserAnalytics();
      setData(res);
    } catch (err) {
      console.error('Failed to load user analytics:', err);
      setError('Unable to load progress analytics. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="analytics-loading-state">
          <RefreshCw size={32} className="spin-icon text-indigo" />
          <span>Crunching your interview & practice analytics...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="analytics-page">
        <div className="analytics-error-card">
          <AlertCircle size={32} className="text-error" />
          <h2>Unable to Load Analytics</h2>
          <p>{error || 'An unexpected error occurred while fetching your analytics data.'}</p>
          <button type="button" className="btn-analytics-primary" onClick={() => loadAnalytics()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const {
    summary = {},
    score_trend = [],
    competencies = {},
    categories = [],
    coding_analytics = {},
    ai_insights = {},
    recent_interviews = [],
  } = data;

  const hasInterviews = summary.total_interviews > 0;
  const hasCompletedInterviews = summary.completed_interviews > 0;
  const hasCoding = coding_analytics.total_attempted > 0;

  return (
    <div className="analytics-page" id="analytics-container">
      {/* Page Header */}
      <div className="analytics-header">
        <div className="analytics-header-left">
          <div className="analytics-badge">
            <BarChart3 size={14} />
            Real-Time Performance
          </div>
          <h1 className="analytics-title">Progress & Analytics</h1>
          <p className="analytics-subtitle">
            Comprehensive breakdown of your interview evaluations, core competencies, and coding practice progress.
          </p>
        </div>

        <div className="analytics-header-actions">
          <button
            type="button"
            className="analytics-refresh-btn"
            onClick={() => loadAnalytics(true)}
            disabled={refreshing}
            title="Refresh analytics data"
          >
            <RefreshCw size={16} className={refreshing ? 'spin-icon' : ''} />
            <span>{refreshing ? 'Updating...' : 'Refresh'}</span>
          </button>
          <button
            type="button"
            className="btn-analytics-primary"
            onClick={() => navigate('/interview/setup')}
          >
            <Zap size={16} />
            <span>Start Practice</span>
          </button>
        </div>
      </div>

      {/* Top Summary KPI Cards */}
      <div className="analytics-kpi-grid">
        {/* KPI 1: Completed Interviews */}
        <div className="analytics-kpi-card" id="kpi-interviews">
          <div className="kpi-card-header">
            <span className="kpi-label">Mock Interviews</span>
            <div className="kpi-icon-badge badge-indigo">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="kpi-card-body">
            <span className="kpi-value">{summary.completed_interviews}</span>
            <span className="kpi-subtext">
              {summary.total_interviews > 0
                ? `${summary.total_interviews} created (${Math.round((summary.completed_interviews / summary.total_interviews) * 100)}% completed)`
                : 'No interviews started yet'}
            </span>
          </div>
        </div>

        {/* KPI 2: Average Score */}
        <div className="analytics-kpi-card" id="kpi-avg-score">
          <div className="kpi-card-header">
            <span className="kpi-label">Average Score</span>
            <div className="kpi-icon-badge badge-emerald">
              <Award size={18} />
            </div>
          </div>
          <div className="kpi-card-body">
            <span className="kpi-value">
              {hasCompletedInterviews ? `${Math.round(summary.average_interview_score)}%` : '—'}
            </span>
            <span className="kpi-subtext">
              {hasCompletedInterviews && summary.highest_score
                ? `Peak score: ${Math.round(summary.highest_score)}%`
                : 'Based on AI evaluations'}
            </span>
          </div>
        </div>

        {/* KPI 3: Questions Answered */}
        <div className="analytics-kpi-card" id="kpi-questions">
          <div className="kpi-card-header">
            <span className="kpi-label">Questions Answered</span>
            <div className="kpi-icon-badge badge-cyan">
              <Clock size={18} />
            </div>
          </div>
          <div className="kpi-card-body">
            <span className="kpi-value">{summary.total_questions_answered}</span>
            <span className="kpi-subtext">
              ~{summary.total_practice_hours} hrs total active practice
            </span>
          </div>
        </div>

        {/* KPI 4: Coding Problems Solved */}
        <div className="analytics-kpi-card" id="kpi-coding">
          <div className="kpi-card-header">
            <span className="kpi-label">Coding Challenges</span>
            <div className="kpi-icon-badge badge-amber">
              <Terminal size={18} />
            </div>
          </div>
          <div className="kpi-card-body">
            <span className="kpi-value">{coding_analytics.total_solved}</span>
            <span className="kpi-subtext">
              {coding_analytics.total_attempted > 0
                ? `${coding_analytics.total_attempted} attempted (${coding_analytics.acceptance_rate}% pass rate)`
                : `${coding_analytics.total_problems || 12} challenges available`}
            </span>
          </div>
        </div>
      </div>

      {/* Row 1: Score Trend & Competencies Radar */}
      <div className="analytics-charts-row">
        {/* Left: Performance Score Trajectory */}
        <div className="analytics-chart-card trajectory-card">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-card-title">Performance Trajectory</h3>
              <p className="chart-card-subtitle">
                Historical scores across your completed interview sessions.
              </p>
            </div>
            {score_trend.length > 1 && (
              <span className="trend-stat-chip">
                <TrendingUp size={14} />
                {score_trend[score_trend.length - 1].score >= score_trend[0].score ? 'Upward Trend' : 'Active Practice'}
              </span>
            )}
          </div>

          <div className="chart-container">
            {score_trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart
                  data={score_trend}
                  margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="display_date"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    stroke="#cbd5e1"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    stroke="#cbd5e1"
                  />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="custom-chart-tooltip">
                            <span className="tooltip-role">{item.role}</span>
                            <span className="tooltip-type">{item.type} ({item.difficulty})</span>
                            <span className="tooltip-score">Score: {item.score}%</span>
                            <span className="tooltip-date">{item.date}</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#4F46E5"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#scoreGradient)"
                    dot={{ r: 5, fill: '#4F46E5', stroke: '#ffffff', strokeWidth: 2 }}
                    activeDot={{ r: 7 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty-state">
                <Brain size={40} className="text-muted" />
                <h4>No Score Trajectory Yet</h4>
                <p>Complete your first interview session to start plotting your performance curve.</p>
                <button
                  type="button"
                  className="btn-empty-action"
                  onClick={() => navigate('/interview/setup')}
                >
                  Start First Session
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Core Competencies Radar */}
        <div className="analytics-chart-card competency-card">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-card-title">Core Competencies</h3>
              <p className="chart-card-subtitle">
                AI evaluation criteria benchmark across 4 pillars.
              </p>
            </div>
          </div>

          <div className="competencies-body">
            {hasCompletedInterviews ? (
              <div className="radar-layout">
                <div className="radar-chart-wrapper">
                  <ResponsiveContainer width="100%" height={210}>
                    <RadarChart data={competencies.radar_data || []}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                      />
                      <Radar
                        name="Competency"
                        dataKey="score"
                        stroke="#4F46E5"
                        fill="#4F46E5"
                        fillOpacity={0.25}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="competency-bars-list">
                  {(competencies.competency_bars || []).map((comp, idx) => (
                    <div key={idx} className="comp-bar-item">
                      <div className="comp-bar-header">
                        <span className="comp-name">{comp.label}</span>
                        <div className="comp-scores">
                          <span className={`comp-level-badge level-${comp.level.toLowerCase()}`}>
                            {comp.level}
                          </span>
                          <strong className="comp-val">{comp.score}%</strong>
                        </div>
                      </div>
                      <div className="comp-bar-bg">
                        <div
                          className="comp-bar-fill"
                          style={{ width: `${comp.score}%`, backgroundColor: comp.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="chart-empty-state">
                <Award size={40} className="text-muted" />
                <h4>Competencies Pending</h4>
                <p>AI evaluators assess Knowledge, Relevance, Completeness, and Communication after your first interview answer.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Category Mastery & Coding Practice Progress */}
      <div className="analytics-mid-row">
        {/* Left: Category Mastery */}
        <div className="analytics-card category-mastery-card">
          <div className="card-top-row">
            <div>
              <h3 className="card-heading">Interview Mode Breakdown</h3>
              <p className="card-subheading">
                Distribution and average scores across all 5 interview modes.
              </p>
            </div>
          </div>

          <div className="category-items-grid">
            {categories.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.type] || FileText;
              return (
                <div key={cat.type} className="category-stat-row">
                  <div className="cat-icon-col" style={{ backgroundColor: `${cat.color}15`, color: cat.color }}>
                    <Icon size={18} />
                  </div>
                  <div className="cat-details-col">
                    <div className="cat-name-row">
                      <strong className="cat-title">{cat.name}</strong>
                      <span className="cat-count-pill">{cat.count} {cat.count === 1 ? 'session' : 'sessions'}</span>
                    </div>
                    <div className="cat-progress-track">
                      <div
                        className="cat-progress-fill"
                        style={{
                          width: `${Math.min(100, cat.avg_score || 0)}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                  <div className="cat-score-col">
                    <span className="cat-score-text">
                      {cat.count > 0 ? `${Math.round(cat.avg_score)}%` : '—'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Coding Practice Analytics */}
        <div className="analytics-card coding-mastery-card">
          <div className="card-top-row">
            <div>
              <h3 className="card-heading">Coding Practice Mastery</h3>
              <p className="card-subheading">
                Algorithmic problem solving and language proficiency.
              </p>
            </div>
            <button
              type="button"
              className="btn-text-link"
              onClick={() => navigate('/coding-practice')}
            >
              Coding Workspace <ArrowRight size={14} />
            </button>
          </div>

          <div className="coding-stats-content">
            {/* Difficulty Tier Progress */}
            <div className="coding-tiers-row">
              <div className="tier-pill tier-easy">
                <span className="tier-tag">Easy</span>
                <strong className="tier-count">{coding_analytics.easy_solved || 0} Solved</strong>
              </div>
              <div className="tier-pill tier-medium">
                <span className="tier-tag">Medium</span>
                <strong className="tier-count">{coding_analytics.medium_solved || 0} Solved</strong>
              </div>
              <div className="tier-pill tier-hard">
                <span className="tier-tag">Hard</span>
                <strong className="tier-count">{coding_analytics.hard_solved || 0} Solved</strong>
              </div>
            </div>

            {/* Languages Breakdown */}
            <div className="coding-languages-section">
              <span className="section-small-title">Languages Practiced</span>
              {coding_analytics.language_breakdown && coding_analytics.language_breakdown.length > 0 ? (
                <div className="lang-tags-list">
                  {coding_analytics.language_breakdown.map((item, idx) => (
                    <div key={idx} className="lang-tag-item">
                      <span className="lang-name">{item.language}</span>
                      <span className="lang-sub-count">{item.count} submissions</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="lang-empty-text">
                  No code submissions yet. Python 3, Java, and C++ supported in Coding Practice.
                </p>
              )}
            </div>

            {/* Total Problems Banner */}
            <div className="coding-total-banner">
              <div className="banner-left">
                <strong>{coding_analytics.total_solved || 0} / {coding_analytics.total_problems || 12}</strong>
                <span>Problems Mastered</span>
              </div>
              <button
                type="button"
                className="btn-solve-more"
                onClick={() => navigate('/coding-practice')}
              >
                Solve Challenges
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: AI Diagnostic Takeaways & Recommended Action Plan */}
      <div className="analytics-insights-row">
        {/* Identified Strengths */}
        <div className="insight-card strengths-card">
          <div className="insight-card-header">
            <div className="insight-icon-circle circle-emerald">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h3 className="insight-title">Demonstrated Strengths</h3>
              <p className="insight-desc">Consistently identified strengths from your interview evaluations</p>
            </div>
          </div>
          <ul className="insight-points-list">
            {(ai_insights.strengths || []).map((item, idx) => (
              <li key={idx} className="point-item">
                <CheckCircle2 size={16} className="text-success bullet-icon" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Improvement & Recommended Focus */}
        <div className="insight-card focus-card">
          <div className="insight-card-header">
            <div className="insight-icon-circle circle-indigo">
              <Target size={18} />
            </div>
            <div>
              <h3 className="insight-title">Targeted Growth Areas</h3>
              <p className="insight-desc">High-leverage areas highlighted by AI feedback</p>
            </div>
          </div>
          <ul className="insight-points-list">
            {(ai_insights.weaknesses || []).map((item, idx) => (
              <li key={idx} className="point-item">
                <AlertCircle size={16} className="text-indigo bullet-icon" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          {ai_insights.recommended_focus && (
            <div className="recommended-action-box">
              <div className="action-box-header">
                <Sparkles size={14} className="text-amber" />
                <strong>Recommended Next Action</strong>
              </div>
              <p className="action-box-text">{ai_insights.recommended_focus}</p>
            </div>
          )}
        </div>
      </div>

      {/* Row 4: Recent Completed Interviews Table */}
      <div className="analytics-recent-card">
        <div className="card-top-row">
          <div>
            <h3 className="card-heading">Recent Interview Sessions</h3>
            <p className="card-subheading">
              Quick access to feedback reports and evaluations from your latest sessions.
            </p>
          </div>
          <button
            type="button"
            className="btn-text-link"
            onClick={() => navigate('/history')}
          >
            Full History <ArrowRight size={14} />
          </button>
        </div>

        {recent_interviews.length > 0 ? (
          <div className="analytics-table-wrapper">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Interview Mode</th>
                  <th>Target Role</th>
                  <th>Difficulty</th>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recent_interviews.map((sess) => (
                  <tr key={sess.id}>
                    <td>
                      <CategoryChip
                        type={sess.interview_type === 'resume' ? 'resume' : sess.interview_type}
                        label={sess.type_display}
                      />
                    </td>
                    <td>
                      <strong className="table-role">{sess.job_role}</strong>
                    </td>
                    <td>
                      <span className={`diff-tag diff-${sess.difficulty}`}>
                        {sess.difficulty_display}
                      </span>
                    </td>
                    <td className="table-date">{sess.date}</td>
                    <td>
                      {sess.overall_score !== null ? (
                        <span className="table-score-badge">
                          {sess.overall_score}%
                        </span>
                      ) : (
                        <span className="table-status-pill">{sess.status_display}</span>
                      )}
                    </td>
                    <td>
                      {sess.status === 'completed' ? (
                        <button
                          type="button"
                          className="btn-table-action"
                          onClick={() => navigate(`/interview/result/${sess.id}`)}
                        >
                          View Report
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-table-action btn-resume-action"
                          onClick={() => navigate(`/interview/session/${sess.id}`)}
                        >
                          Continue
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-empty-notice">
            <HelpCircle size={24} className="text-muted" />
            <p>No interview sessions recorded yet. Start your first session to populate history.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Analytics;
