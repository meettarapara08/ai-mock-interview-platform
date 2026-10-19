import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  FileText,
  Code2,
  User,
  Users,
  Briefcase,
  ArrowRight,
  TrendingUp,
  Star,
  Clock,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  ArrowUpRight,
  Loader2,
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import heroIllustration from '../assets/hero-illustration.jpg';
import { useAuth } from '../context/AuthContext';
import { getDashboardAnalytics } from '../api/interviews';
import './Dashboard.css';

/* ─── Static Feature Modes & Tips ─── */
const INTERVIEW_MODES = [
  {
    id: 'resume-based',
    icon: FileText,
    iconBg: '#eef2ff',
    iconColor: '#4F46E5',
    title: 'Resume-Based Interview',
    description: 'Upload your resume and get personalized questions based on your profile.',
  },
  {
    id: 'technical',
    icon: Code2,
    iconBg: '#ecfeff',
    iconColor: '#06b6d4',
    title: 'Technical Interview',
    description: 'Practice coding and technical questions for your target role.',
  },
  {
    id: 'behavioral',
    icon: User,
    iconBg: '#f0fdf4',
    iconColor: '#16a34a',
    title: 'Behavioral Interview',
    description: 'Build your soft skills with real-world behavioral questions.',
  },
  {
    id: 'hr-managerial',
    icon: Users,
    iconBg: '#eef2ff',
    iconColor: '#4F46E5',
    title: 'HR / Managerial Interview',
    description: 'Prepare for HR and managerial rounds with common interview questions.',
  },
];

const TYPE_CONFIG = {
  technical: { icon: Code2, iconBg: '#ecfeff', iconColor: '#06b6d4' },
  behavioral: { icon: User, iconBg: '#f0fdf4', iconColor: '#16a34a' },
  hr: { icon: Users, iconBg: '#eef2ff', iconColor: '#4F46E5' },
  managerial: { icon: Briefcase, iconBg: '#fefce8', iconColor: '#eab308' },
  'resume-based': { icon: FileText, iconBg: '#eef2ff', iconColor: '#4F46E5' },
};

const QUICK_TIPS = [
  'Be clear and concise in your answers',
  'Use real-world examples whenever possible',
  'Maintain good communication skills',
  'Practice regularly to improve faster',
];

/* ─── Dashboard Component ─── */
export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchDashboard() {
      try {
        const data = await getDashboardAnalytics();
        if (isMounted) {
          setAnalytics(data);
        }
      } catch (err) {
        console.error('Failed to load dashboard analytics:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    fetchDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const userGreetingName = user?.first_name || user?.username || 'Candidate';

  // Real Stats Mapping
  const statCards = [
    {
      id: 'total-interviews',
      icon: FileText,
      iconBg: '#eef2ff',
      iconColor: '#4F46E5',
      label: 'Total Interviews',
      value: analytics ? String(analytics.stats.total_interviews) : '0',
      trend: analytics?.stats?.interviews_this_week
        ? `↑ ${analytics.stats.interviews_this_week} this week`
        : '0 this week',
      trendColor: '#16a34a',
    },
    {
      id: 'avg-score',
      icon: Star,
      iconBg: '#fefce8',
      iconColor: '#eab308',
      label: 'Average Score',
      value:
        analytics && analytics.stats.average_score > 0
          ? `${analytics.stats.average_score}%`
          : '—',
      trend:
        analytics && analytics.stats.avg_score_this_week > 0
          ? `↑ ${analytics.stats.avg_score_this_week}% avg this week`
          : 'Keep practicing',
      trendColor: '#16a34a',
    },
    {
      id: 'practice-time',
      icon: Clock,
      iconBg: '#ecfeff',
      iconColor: '#06b6d4',
      label: 'Practice Time',
      value: analytics?.stats?.practice_time || '0 mins',
      trend: `${analytics?.stats?.total_questions_answered ?? 0} questions`,
      trendColor: '#64748b',
    },
    {
      id: 'completion-rate',
      icon: CheckCircle2,
      iconBg: '#f0fdf4',
      iconColor: '#16a34a',
      label: 'Completion Rate',
      value: `${analytics?.progress?.completion_rate ?? 0}%`,
      trend: `${analytics?.stats?.completed_interviews ?? 0} completed`,
      trendColor: '#16a34a',
    },
  ];

  // Donut Chart Data
  const donutData =
    analytics &&
    (analytics.progress.completed_count > 0 || analytics.progress.remaining_count > 0)
      ? [
          { name: 'Completed', value: analytics.progress.completed_count },
          { name: 'Remaining', value: Math.max(0, analytics.progress.remaining_count) },
        ]
      : [
          { name: 'Completed', value: 0 },
          { name: 'Remaining', value: 1 },
        ];

  const categoryBreakdown = analytics?.progress?.category_breakdown || [
    { name: 'Technical', value: 0, color: '#4F46E5' },
    { name: 'Behavioral', value: 0, color: '#06b6d4' },
    { name: 'HR Round', value: 0, color: '#f59e0b' },
    { name: 'Managerial', value: 0, color: '#16a34a' },
  ];

  // Performance Radar & Bars
  const radarData = analytics?.performance?.radar_data || [
    { subject: 'Knowledge', value: 0, fullMark: 100 },
    { subject: 'Relevance', value: 0, fullMark: 100 },
    { subject: 'Completeness', value: 0, fullMark: 100 },
    { subject: 'Communication', value: 0, fullMark: 100 },
  ];

  const performanceBars = analytics?.performance?.performance_bars || [
    { label: 'Knowledge', value: 0, color: '#4F46E5' },
    { label: 'Relevance', value: 0, color: '#06b6d4' },
    { label: 'Completeness', value: 0, color: '#16a34a' },
    { label: 'Communication', value: 0, color: '#f59e0b' },
  ];

  // Insights
  const strengths = analytics?.insights?.strengths || [];
  const areasToImprove = analytics?.insights?.areas_to_improve || [];

  // Recent Activity
  const recentActivity = analytics?.recent_activity || [];

  return (
    <div className="dashboard" id="dashboard-page">
      {/* Row 1: Welcome Banner + Stats */}
      <div className="dash-top-row">
        {/* Welcome Banner */}
        <div className="dash-welcome-card" id="welcome-banner">
          <div className="dash-welcome-text">
            <span className="dash-welcome-greeting">{getGreeting()},</span>
            <h1 className="dash-welcome-name">{userGreetingName} 👋</h1>
            <p className="dash-welcome-desc">
              Ready to ace your next interview? Practice, get AI feedback,
              and build the skills you need for your dream job.
            </p>
            <button
              type="button"
              className="dash-welcome-cta"
              id="start-interview-cta"
              onClick={() => navigate('/interview/setup')}
            >
              <Play size={16} />
              <span>Start New Interview</span>
            </button>
          </div>
          <div className="dash-welcome-illustration">
            <img
              src={heroIllustration}
              alt="Interview preparation illustration"
              className="dash-hero-img"
            />
          </div>
        </div>

        {/* Stat Cards */}
        <div className="dash-stats-row">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div className="dash-stat-card" key={stat.id} id={`stat-${stat.id}`}>
                <div
                  className="dash-stat-icon-wrapper"
                  style={{ backgroundColor: stat.iconBg }}
                >
                  <Icon size={20} style={{ color: stat.iconColor }} />
                </div>
                <span className="dash-stat-label">{stat.label}</span>
                <span className="dash-stat-value">{stat.value}</span>
                <span
                  className="dash-stat-trend"
                  style={{ color: stat.trendColor }}
                >
                  {stat.trend}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 2: Interview Modes + Your Progress */}
      <div className="dash-mid-row">
        {/* Start an Interview */}
        <div className="dash-section" id="start-interview-section">
          <div className="dash-section-header">
            <h2 className="dash-section-title">Start an Interview</h2>
            <p className="dash-section-subtitle">
              Choose a mode and start practicing with AI-powered feedback.
            </p>
          </div>
          <div className="dash-modes-grid">
            {INTERVIEW_MODES.map((mode) => {
              const Icon = mode.icon;
              const modePathMap = {
                technical: '/interview/setup?type=technical',
                behavioral: '/interview/setup?type=behavioral',
                'hr-managerial': '/interview/setup?type=hr',
                'resume-based': '/resume-interview',
              };
              const targetPath = modePathMap[mode.id] || '/interview/setup';

              return (
                <div
                  className="dash-mode-card"
                  key={mode.id}
                  id={`mode-${mode.id}`}
                  onClick={() => navigate(targetPath)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') navigate(targetPath);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div
                    className="dash-mode-icon-wrapper"
                    style={{ backgroundColor: mode.iconBg }}
                  >
                    <Icon size={22} style={{ color: mode.iconColor }} />
                  </div>
                  <h3 className="dash-mode-title">{mode.title}</h3>
                  <p className="dash-mode-desc">{mode.description}</p>
                  <button
                    type="button"
                    className="dash-mode-cta"
                    aria-label={`Start ${mode.title}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(targetPath);
                    }}
                  >
                    <ArrowRight size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Your Progress */}
        <div className="dash-progress-section" id="progress-section">
          <div className="dash-section-header-row">
            <h2 className="dash-section-title">Your Progress</h2>
            <button
              type="button"
              className="dash-view-details-link"
              onClick={() => navigate('/history')}
            >
              View Details <ArrowRight size={14} />
            </button>
          </div>

          <div className="dash-progress-content">
            {/* Donut Chart */}
            <div className="dash-progress-chart-area">
              <div className="dash-donut-wrapper">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={72}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      <Cell fill="#4F46E5" />
                      <Cell fill="#E2E8F0" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="dash-donut-center-text">
                  <span className="dash-donut-percent">
                    {analytics?.progress?.completion_rate ?? 0}%
                  </span>
                  <span className="dash-donut-label">Overall Progress</span>
                </div>
              </div>

              {/* Legend */}
              <div className="dash-progress-legend">
                {categoryBreakdown.map((item) => (
                  <div className="dash-progress-legend-row" key={item.name}>
                    <span
                      className="dash-progress-legend-dot"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="dash-progress-legend-name">{item.name}</span>
                    <span className="dash-progress-legend-val">
                      {item.value > 0 ? `${item.value}%` : `${item.count} done`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Motivational Card */}
            <div className="dash-motivational-card">
              <span className="dash-motivational-emoji" aria-hidden="true">🏆</span>
              <div className="dash-motivational-text">
                <strong>
                  {analytics?.stats?.completed_interviews && analytics.stats.completed_interviews > 0
                    ? `${analytics.stats.completed_interviews} interviews completed!`
                    : 'Small steps make big progress!'}
                </strong>
                <span>
                  {analytics?.stats?.total_interviews && analytics.stats.total_interviews > 0
                    ? 'Keep building confidence with targeted rounds.'
                    : "Start your first mock interview to track progress!"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: AI Performance Analysis + Recent Activity */}
      <div className="dash-bottom-row">
        {/* AI Performance Analysis */}
        <div className="dash-performance-section" id="performance-section">
          <h2 className="dash-section-title">AI Performance Analysis</h2>
          <p className="dash-section-subtitle">
            Your performance across different evaluation dimensions.
          </p>

          <div className="dash-perf-content">
            {/* Radar Chart */}
            <div className="dash-perf-radar">
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData} outerRadius={80}>
                  <PolarGrid stroke="#E2E8F0" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={false}
                    axisLine={false}
                  />
                  <Radar
                    name="Performance"
                    dataKey="value"
                    stroke="#4F46E5"
                    fill="#4F46E5"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Metrics */}
            <div className="dash-perf-bars">
              {performanceBars.map((bar) => (
                <div className="dash-perf-bar-row" key={bar.label}>
                  <div className="dash-perf-bar-header">
                    <span className="dash-perf-bar-label">{bar.label}</span>
                    <span className="dash-perf-bar-value">
                      {bar.value > 0 ? `${bar.value}%` : '—'}
                    </span>
                  </div>
                  <div className="dash-perf-bar-track">
                    <div
                      className="dash-perf-bar-fill"
                      style={{
                        width: `${bar.value}%`,
                        backgroundColor: bar.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Strengths & Areas */}
            <div className="dash-perf-insights">
              <div className="dash-perf-insight-box dash-strengths-box">
                <h4 className="dash-insight-title">Strengths</h4>
                <ul className="dash-insight-list">
                  {strengths.map((s, idx) => (
                    <li key={idx} className="dash-insight-item dash-insight-strength">
                      <CheckCircle2 size={14} className="dash-insight-icon-green" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="dash-perf-insight-box dash-improve-box">
                <h4 className="dash-insight-title">Areas to Improve</h4>
                <ul className="dash-insight-list">
                  {areasToImprove.map((a, idx) => (
                    <li key={idx} className="dash-insight-item dash-insight-improve">
                      <AlertTriangle size={14} className="dash-insight-icon-red" />
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dash-activity-section" id="recent-activity-section">
          <div className="dash-section-header-row">
            <h2 className="dash-section-title">Recent Activity</h2>
            <button
              type="button"
              className="dash-view-details-link"
              onClick={() => navigate('/history')}
            >
              View All <ArrowRight size={14} />
            </button>
          </div>

          <div className="dash-activity-list">
            {recentActivity.length === 0 ? (
              <div
                style={{
                  padding: '40px 16px',
                  textAlign: 'center',
                  color: 'var(--color-secondary)',
                }}
              >
                <Clock size={32} style={{ margin: '0 auto 8px', color: '#94a3b8' }} />
                <p style={{ margin: '0 0 12px', fontSize: '14px' }}>
                  No interviews taken yet.
                </p>
                <button
                  type="button"
                  className="dash-welcome-cta"
                  style={{
                    margin: '0 auto',
                    fontSize: '13px',
                    padding: '8px 16px',
                    display: 'inline-flex',
                  }}
                  onClick={() => navigate('/interview/setup')}
                >
                  <Play size={14} />
                  <span>Start Your First Interview</span>
                </button>
              </div>
            ) : (
              recentActivity.map((item) => {
                const conf = TYPE_CONFIG[item.interview_type] || {
                  icon: Code2,
                  iconBg: '#ecfeff',
                  iconColor: '#06b6d4',
                };
                const Icon = conf.icon;
                const isCompleted = item.status === 'completed';
                const isInProgress = item.status === 'in_progress';

                return (
                  <div
                    className="dash-activity-item"
                    key={item.id}
                    id={`activity-${item.id}`}
                    onClick={() => {
                      if (isCompleted) {
                        navigate(`/interview/result/${item.id}`);
                      } else if (isInProgress) {
                        navigate(`/interview/session/${item.id}`);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div
                      className="dash-activity-icon-wrapper"
                      style={{ backgroundColor: conf.iconBg }}
                    >
                      <Icon size={18} style={{ color: conf.iconColor }} />
                    </div>
                    <div className="dash-activity-info">
                      <span className="dash-activity-type">{item.type}</span>
                      <span className="dash-activity-role">{item.role}</span>
                      <span className="dash-activity-date">{item.date}</span>
                    </div>
                    <div className="dash-activity-score-col">
                      <span className="dash-activity-score">
                        {item.score !== null ? `${item.score}%` : '—'}
                      </span>
                      <span className="dash-activity-rarity">
                        {item.status_display}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="dash-activity-feedback-link"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCompleted) {
                          navigate(`/interview/result/${item.id}`);
                        } else if (isInProgress) {
                          navigate(`/interview/session/${item.id}`);
                        } else {
                          navigate('/history');
                        }
                      }}
                    >
                      {isCompleted ? 'View Feedback' : 'Resume'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Quick Tips Footer */}
      <div className="dash-quick-tips" id="quick-tips">
        <div className="dash-tips-header">
          <Lightbulb size={18} className="dash-tips-icon" />
          <div className="dash-tips-title-area">
            <strong>Quick Tips</strong>
            <span>Improve your performance with these simple tips.</span>
          </div>
        </div>
        <div className="dash-tips-list">
          {QUICK_TIPS.map((tip) => (
            <div className="dash-tip-item" key={tip}>
              <CheckCircle size={14} className="dash-tip-check" />
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
