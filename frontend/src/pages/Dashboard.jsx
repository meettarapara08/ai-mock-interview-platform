import React from 'react';
import {
  Play,
  FileText,
  Code2,
  User,
  Users,
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
import './Dashboard.css';

/* ─── Static Data ─── */
const STATS = [
  {
    id: 'total-interviews',
    icon: FileText,
    iconBg: '#eef2ff',
    iconColor: '#4F46E5',
    label: 'Total Interviews',
    value: '12',
    trend: '↑ 2 this week',
    trendColor: '#16a34a',
  },
  {
    id: 'avg-score',
    icon: Star,
    iconBg: '#fefce8',
    iconColor: '#eab308',
    label: 'Average Score',
    value: '78%',
    trend: '↑ 6% this week',
    trendColor: '#16a34a',
  },
  {
    id: 'practice-time',
    icon: Clock,
    iconBg: '#ecfeff',
    iconColor: '#06b6d4',
    label: 'Practice Time',
    value: '6.5 hrs',
    trend: '1.2 hrs this week',
    trendColor: '#64748b',
  },
  {
    id: 'streak',
    icon: Flame,
    iconBg: '#fff7ed',
    iconColor: '#f97316',
    label: 'Current Streak',
    value: '5 days',
    trend: '↑ 2 days',
    trendColor: '#16a34a',
  },
];

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

const RADAR_DATA = [
  { subject: 'Knowledge', value: 82, fullMark: 100 },
  { subject: 'Relevance', value: 76, fullMark: 100 },
  { subject: 'Communication', value: 78, fullMark: 100 },
  { subject: 'Confidence', value: 74, fullMark: 100 },
  { subject: 'Behavior', value: 74, fullMark: 100 },
];

const PERFORMANCE_BARS = [
  { label: 'Knowledge', value: 82, color: '#4F46E5' },
  { label: 'Relevance', value: 76, color: '#06b6d4' },
  { label: 'Communication', value: 78, color: '#4F46E5' },
  { label: 'Confidence', value: 74, color: '#f97316' },
];

const PROGRESS_DATA = [
  { name: 'Technical', value: 78, color: '#4F46E5' },
  { name: 'Behavioral', value: 65, color: '#06b6d4' },
  { name: 'HR / Managerial', value: 60, color: '#f59e0b' },
  { name: 'Coding', value: 85, color: '#16a34a' },
];

const PROGRESS_DONUT_DATA = [
  { name: 'Completed', value: 72 },
  { name: 'Remaining', value: 28 },
];

const STRENGTHS = [
  'Good technical knowledge',
  'Clear communication',
  'Relevant answers',
];

const AREAS_TO_IMPROVE = [
  'More confidence in answers',
  'Better real-world examples',
  'Improve explanation depth',
];

const RECENT_ACTIVITY = [
  {
    id: 'ra-1',
    type: 'Technical Interview',
    role: 'Python Developer',
    date: 'Jun 1, 2026',
    score: 82,
    rarity: 'Rare',
    icon: Code2,
    iconBg: '#ecfeff',
    iconColor: '#06b6d4',
  },
  {
    id: 'ra-2',
    type: 'Behavioral Interview',
    role: 'Team Collaboration',
    date: 'May 28, 2026',
    score: 76,
    rarity: 'Rare',
    icon: User,
    iconBg: '#f0fdf4',
    iconColor: '#16a34a',
  },
  {
    id: 'ra-3',
    type: 'Resume-Based Interview',
    role: 'Full Stack Developer',
    date: 'May 25, 2026',
    score: 88,
    rarity: 'Rare',
    icon: FileText,
    iconBg: '#eef2ff',
    iconColor: '#4F46E5',
  },
  {
    id: 'ra-4',
    type: 'HR / Managerial Interview',
    role: 'Leadership',
    date: 'May 20, 2026',
    score: 70,
    rarity: 'Rare',
    icon: Users,
    iconBg: '#fefce8',
    iconColor: '#eab308',
  },
];

const QUICK_TIPS = [
  'Be clear and concise in your answers',
  'Use real-world examples whenever possible',
  'Maintain good communication skills',
  'Practice regularly to improve faster',
];

/* ─── Dashboard Component ─── */
export function Dashboard() {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="dashboard" id="dashboard-page">
      {/* Row 1: Welcome Banner + Stats */}
      <div className="dash-top-row">
        {/* Welcome Banner */}
        <div className="dash-welcome-card" id="welcome-banner">
          <div className="dash-welcome-text">
            <span className="dash-welcome-greeting">{getGreeting()},</span>
            <h1 className="dash-welcome-name">Meet Tarapara 👋</h1>
            <p className="dash-welcome-desc">
              Ready to ace your next interview? Practice, get AI feedback,
              and build the skills you need for your dream job.
            </p>
            <button type="button" className="dash-welcome-cta" id="start-interview-cta">
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
          {STATS.map((stat) => {
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
            <p className="dash-section-subtitle">Choose a mode and start practicing with AI-powered feedback.</p>
          </div>
          <div className="dash-modes-grid">
            {INTERVIEW_MODES.map((mode) => {
              const Icon = mode.icon;
              return (
                <div className="dash-mode-card" key={mode.id} id={`mode-${mode.id}`}>
                  <div
                    className="dash-mode-icon-wrapper"
                    style={{ backgroundColor: mode.iconBg }}
                  >
                    <Icon size={22} style={{ color: mode.iconColor }} />
                  </div>
                  <h3 className="dash-mode-title">{mode.title}</h3>
                  <p className="dash-mode-desc">{mode.description}</p>
                  <button type="button" className="dash-mode-cta" aria-label={`Start ${mode.title}`}>
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
            <button type="button" className="dash-view-details-link">
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
                      data={PROGRESS_DONUT_DATA}
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
                  <span className="dash-donut-percent">72%</span>
                  <span className="dash-donut-label">Overall Progress</span>
                </div>
              </div>

              {/* Legend */}
              <div className="dash-progress-legend">
                {PROGRESS_DATA.map((item) => (
                  <div className="dash-progress-legend-row" key={item.name}>
                    <span
                      className="dash-progress-legend-dot"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="dash-progress-legend-name">{item.name}</span>
                    <span className="dash-progress-legend-val">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Motivational Card */}
            <div className="dash-motivational-card">
              <span className="dash-motivational-emoji" aria-hidden="true">🏆</span>
              <div className="dash-motivational-text">
                <strong>Small steps make big progress!</strong>
                <span>Keep practicing. You're doing great!</span>
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
          <p className="dash-section-subtitle">Your performance across different evaluation dimensions.</p>

          <div className="dash-perf-content">
            {/* Radar Chart */}
            <div className="dash-perf-radar">
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={RADAR_DATA} outerRadius={80}>
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
              {PERFORMANCE_BARS.map((bar) => (
                <div className="dash-perf-bar-row" key={bar.label}>
                  <div className="dash-perf-bar-header">
                    <span className="dash-perf-bar-label">{bar.label}</span>
                    <span className="dash-perf-bar-value">{bar.value}%</span>
                  </div>
                  <div className="dash-perf-bar-track">
                    <div
                      className="dash-perf-bar-fill"
                      style={{ width: `${bar.value}%`, backgroundColor: bar.color }}
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
                  {STRENGTHS.map((s) => (
                    <li key={s} className="dash-insight-item dash-insight-strength">
                      <CheckCircle2 size={14} className="dash-insight-icon-green" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="dash-perf-insight-box dash-improve-box">
                <h4 className="dash-insight-title">Areas to Improve</h4>
                <ul className="dash-insight-list">
                  {AREAS_TO_IMPROVE.map((a) => (
                    <li key={a} className="dash-insight-item dash-insight-improve">
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
            <button type="button" className="dash-view-details-link">
              View All <ArrowRight size={14} />
            </button>
          </div>

          <div className="dash-activity-list">
            {RECENT_ACTIVITY.map((item) => {
              const Icon = item.icon;
              return (
                <div className="dash-activity-item" key={item.id} id={item.id}>
                  <div
                    className="dash-activity-icon-wrapper"
                    style={{ backgroundColor: item.iconBg }}
                  >
                    <Icon size={18} style={{ color: item.iconColor }} />
                  </div>
                  <div className="dash-activity-info">
                    <span className="dash-activity-type">{item.type}</span>
                    <span className="dash-activity-role">{item.role}</span>
                    <span className="dash-activity-date">{item.date}</span>
                  </div>
                  <div className="dash-activity-score-col">
                    <span className="dash-activity-score">{item.score}%</span>
                    <span className="dash-activity-rarity">{item.rarity}</span>
                  </div>
                  <button type="button" className="dash-activity-feedback-link">
                    View Feedback
                  </button>
                </div>
              );
            })}
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
