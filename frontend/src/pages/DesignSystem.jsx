/* Preserved from original App.jsx — Design System Showcase page */
import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Mic,
  Code2,
  Clock,
  BarChart3,
  Settings,
  User,
  Bell,
  Search,
  UploadCloud,
  Play,
  CheckCircle2,
  Calendar,
  ChevronRight,
  TrendingUp,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

import Button from '../components/ui/Button';
import CategoryChip from '../components/ui/CategoryChip';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import ProgressIndicator from '../components/ui/ProgressIndicator';
import ScoreMeter from '../components/ui/ScoreMeter';
import { Card, CardHeader, CardBody } from '../components/ui/Card';

import './DesignSystem.css';

export function DesignSystem() {
  const [userName, setUserName] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [activeStep, setActiveStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('resume');

  const colorPalette = [
    { name: 'Primary (Dark Navy)', hex: '#111827', bg: '#111827', textDark: false },
    { name: 'Secondary (Slate)', hex: '#64748B', bg: '#64748B', textDark: false },
    { name: 'Surface (White)', hex: '#FFFFFF', bg: '#FFFFFF', border: true, textDark: true },
    { name: 'Background', hex: '#F8FAFC', bg: '#F8FAFC', border: true, textDark: true },
    { name: 'Accent (Indigo)', hex: '#4F46E5', bg: '#4F46E5', textDark: false },
    { name: 'Accent (Cyan)', hex: '#06B6D4', bg: '#06B6D4', textDark: false },
    { name: 'Success (Green)', hex: '#16A34A', bg: '#16A34A', textDark: false },
    { name: 'Warning (Amber)', hex: '#F59E0B', bg: '#F59E0B', textDark: false },
    { name: 'Error (Red)', hex: '#DC2626', bg: '#DC2626', textDark: false },
    { name: 'Border', hex: '#E2E8F0', bg: '#E2E8F0', border: true, textDark: true },
  ];

  const iconCatalog = [
    { icon: LayoutDashboard, label: 'Dashboard' },
    { icon: FileText, label: 'Resume' },
    { icon: Mic, label: 'Interview' },
    { icon: Code2, label: 'Code' },
    { icon: Clock, label: 'History' },
    { icon: BarChart3, label: 'Analytics' },
    { icon: Settings, label: 'Settings' },
    { icon: User, label: 'User' },
    { icon: Bell, label: 'Notifications' },
    { icon: Search, label: 'Search' },
    { icon: UploadCloud, label: 'Upload' },
    { icon: Play, label: 'Play' },
    { icon: CheckCircle2, label: 'Success' },
    { icon: Calendar, label: 'Calendar' },
    { icon: ChevronRight, label: 'Chevron Right' },
  ];

  return (
    <div className="design-system-container">
      {/* Top Banner */}
      <header className="ds-top-bar">
        <div className="brand-logo-group">
          <span className="brand-title">Interview<span className="brand-highlight">IQ</span></span>
          <span className="brand-badge">Design System v1.0</span>
        </div>
        <span className="brand-tagline">Practice smarter. Interview with confidence.</span>
      </header>

      {/* Main Grid Section */}
      <div className="ds-board">
        {/* ROW 1: BRAND, COLOR PALETTE, TYPOGRAPHY, UI ELEMENTS */}
        <div className="ds-row ds-row-top">
          {/* BRAND PANEL */}
          <section className="ds-panel ds-panel-brand">
            <div className="panel-label">BRAND</div>
            <div className="brand-hero">
              <div className="logo-main">
                Interview<span className="logo-accent">IQ</span>
              </div>
              <div className="logo-subtitle">AI Mock Interview Platform</div>
              <p className="brand-motto">
                Practice smarter. Interview with confidence.
              </p>
            </div>
          </section>

          {/* COLOR PALETTE PANEL */}
          <section className="ds-panel ds-panel-colors">
            <div className="panel-label">COLOR PALETTE</div>
            <div className="color-list">
              {colorPalette.map((c) => (
                <div key={c.name} className="color-item">
                  <div
                    className="color-swatch"
                    style={{
                      backgroundColor: c.bg,
                      border: c.border ? '1px solid #E2E8F0' : 'none',
                    }}
                  />
                  <div className="color-info">
                    <span className="color-name">{c.name}</span>
                    <span className="color-hex">{c.hex}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* TYPOGRAPHY PANEL */}
          <section className="ds-panel ds-panel-typography">
            <div className="panel-label">TYPOGRAPHY</div>
            <div className="type-header">
              <span className="type-family-title">Inter</span>
              <span className="text-caption">Font Family</span>
            </div>

            <div className="type-scale-list">
              <div className="type-scale-row">
                <span className="type-tag">H1 <span>32px • Bold</span></span>
                <div className="h1-sample">Build Your Future Career</div>
              </div>
              <div className="type-scale-row">
                <span className="type-tag">H2 <span>24px • Semibold</span></span>
                <div className="h2-sample">Practice with AI<br />Get Real Feedback</div>
              </div>
              <div className="type-scale-row">
                <span className="type-tag">H3 <span>20px • Semibold</span></span>
                <div className="h3-sample">Interview Modules</div>
              </div>
              <div className="type-scale-row">
                <span className="type-tag">H4 <span>16px • Medium</span></span>
                <div className="h4-sample">Section Title</div>
              </div>
              <div className="type-scale-row">
                <span className="type-tag">Body <span>14px • Regular</span></span>
                <div className="body-sample">
                  Your interview preparation journey starts here. Build skills, get feedback and improve.
                </div>
              </div>
              <div className="type-scale-row">
                <span className="type-tag">Caption <span>12px • Regular</span></span>
                <div className="caption-sample">Helper text or metadata</div>
              </div>
            </div>
          </section>

          {/* UI ELEMENTS PANEL */}
          <section className="ds-panel ds-panel-elements">
            <div className="panel-label">UI ELEMENTS</div>

            {/* Buttons Matrix */}
            <div className="elements-group">
              <span className="sub-group-title">Buttons</span>
              <div className="buttons-matrix">
                {/* Primary Row */}
                <div className="button-state-row">
                  <Button variant="primary">Primary</Button>
                  <Button variant="primary" className="btn-hover-preview">Hover</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="primary" disabled>Disabled</Button>
                </div>
                {/* Secondary Row */}
                <div className="button-state-row">
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="secondary" className="btn-hover-preview">Hover</Button>
                  <Button variant="outline" className="btn-secondary-outline">Outline</Button>
                  <Button variant="secondary" disabled>Disabled</Button>
                </div>
              </div>
            </div>

            {/* Category Chips */}
            <div className="elements-group">
              <span className="sub-group-title">Category Chips</span>
              <div className="category-chips-row">
                <CategoryChip
                  type="resume"
                  active={selectedCategory === 'resume'}
                  onClick={() => setSelectedCategory('resume')}
                />
                <CategoryChip
                  type="technical"
                  active={selectedCategory === 'technical'}
                  onClick={() => setSelectedCategory('technical')}
                />
                <CategoryChip
                  type="behavioral"
                  active={selectedCategory === 'behavioral'}
                  onClick={() => setSelectedCategory('behavioral')}
                />
                <CategoryChip
                  type="hr"
                  active={selectedCategory === 'hr'}
                  onClick={() => setSelectedCategory('hr')}
                />
              </div>
            </div>

            {/* Form Fields */}
            <div className="elements-group">
              <span className="sub-group-title">Form Fields</span>
              <div className="form-fields-grid">
                <Input
                  label="Text Input"
                  icon={User}
                  placeholder="Enter your name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />
                <Select
                  label="Select"
                  placeholder="Choose job role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  options={[
                    'Python Developer',
                    'Full Stack Engineer',
                    'Frontend Developer',
                    'DevOps Specialist',
                  ]}
                />
              </div>
            </div>

            {/* Progress & Score Meter Dual Row */}
            <div className="elements-dual-row">
              <div className="elements-group-half">
                <span className="sub-group-title">Progress Indicator</span>
                <div className="progress-interactive-wrapper">
                  <ProgressIndicator steps={[1, 2, 3, 4]} currentStep={activeStep} />
                  <div className="step-toggle-buttons">
                    {[1, 2, 3, 4].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setActiveStep(s)}
                        className={`step-btn ${activeStep === s ? 'active' : ''}`}
                      >
                        Step {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="elements-group-half">
                <span className="sub-group-title">Score Meter</span>
                <ScoreMeter score={82} maxScore={100} />
              </div>
            </div>
          </section>
        </div>

        {/* ROW 2: ICONS & CARD EXAMPLES */}
        <div className="ds-row ds-row-mid">
          {/* ICONS PANEL */}
          <section className="ds-panel ds-panel-icons">
            <div className="panel-label">ICONS</div>
            <div className="icons-catalog-grid">
              {iconCatalog.map((item) => {
                const IconComponent = item.icon;
                return (
                  <div key={item.label} className="icon-card">
                    <IconComponent size={20} strokeWidth={2} className="catalog-icon" />
                    <span className="icon-name">{item.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="icon-caption">Line icons • 2px stroke • Feather style</div>
          </section>

          {/* CARD EXAMPLES PANEL */}
          <section className="ds-panel ds-panel-cards">
            <div className="panel-label">CARD EXAMPLE</div>
            <div className="cards-preview-grid">
              {/* Card 1: Interview Performance */}
              <Card className="perf-card" elevation="sm">
                <CardHeader
                  action={
                    <span className="view-details-link">
                      View Details <ChevronRight size={14} />
                    </span>
                  }
                >
                  <BarChart3 size={18} className="card-header-icon" />
                  <span>Interview Performance</span>
                </CardHeader>
                <CardBody>
                  <div className="perf-card-content">
                    {/* Gauge & Trend line */}
                    <div className="gauge-trend-box">
                      <ScoreMeter score={82} maxScore={100} size={78} strokeWidth={7} showLegend={false} />
                      <div className="trend-badge-column">
                        <div className="trend-pill">
                          <TrendingUp size={13} />
                          <span>+12%</span>
                        </div>
                        <span className="trend-subtext">vs. last 5 interviews</span>
                        {/* Mini SVG Trend Wave */}
                        <svg className="mini-trend-wave" width="100" height="28" viewBox="0 0 100 28">
                          <path
                            d="M2 22 L25 18 L50 24 L75 10 L98 6"
                            fill="none"
                            stroke="#4F46E5"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* 4 Score Pillars */}
                    <div className="perf-metrics-row">
                      <div className="metric-box">
                        <span className="metric-label">Knowledge</span>
                        <span className="metric-val">85</span>
                      </div>
                      <div className="metric-box">
                        <span className="metric-label">Relevance</span>
                        <span className="metric-val">82</span>
                      </div>
                      <div className="metric-box">
                        <span className="metric-label">Communication</span>
                        <span className="metric-val">78</span>
                      </div>
                      <div className="metric-box">
                        <span className="metric-label">Confidence</span>
                        <span className="metric-val">86</span>
                      </div>
                    </div>

                    <Button variant="primary" fullWidth icon={Play}>
                      Start Interview
                    </Button>
                  </div>
                </CardBody>
              </Card>

              {/* Card 2 & 3 Column */}
              <div className="cards-right-column">
                {/* Recommended Practice */}
                <Card className="rec-card" elevation="sm">
                  <CardHeader>
                    <Sparkles size={16} className="card-header-icon text-indigo" />
                    <span>Recommended Practice</span>
                  </CardHeader>
                  <CardBody>
                    <div className="rec-item-row">
                      <div className="tech-badge">
                        <span className="py-logo">🐍</span>
                      </div>
                      <div className="rec-item-info">
                        <div className="rec-item-title">Python Developer</div>
                        <div className="rec-item-category">Technical Interview</div>
                        <div className="rec-meta-tags">
                          <span className="meta-pill"><Clock size={12} /> 20 min</span>
                          <span className="meta-pill"><FileText size={12} /> 10 questions</span>
                        </div>
                      </div>
                      <ChevronRight size={18} className="rec-chevron" />
                    </div>

                    <div className="rec-action-row">
                      <Button variant="outline" size="sm" icon={Play}>
                        Start Practice
                      </Button>
                    </div>
                  </CardBody>
                </Card>

                {/* Recent Activity */}
                <Card className="activity-card" elevation="sm">
                  <CardHeader
                    action={
                      <span className="view-details-link">
                        View All <ArrowRight size={13} />
                      </span>
                    }
                  >
                    <span>Recent Activity</span>
                  </CardHeader>
                  <CardBody>
                    <div className="activity-item-row">
                      <div className="activity-status-icon">
                        <CheckCircle2 size={20} className="text-green" />
                      </div>
                      <div className="activity-item-info">
                        <span className="activity-item-title">Technical Interview</span>
                        <span className="activity-item-time">Finished • 2 hours ago</span>
                      </div>
                      <div className="activity-item-score">
                        <span className="score-num">86</span>
                        <span className="score-denom">/100</span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>
          </section>
        </div>

        {/* ROW 3: SPACING, GRID, SHADOWS, BORDER RADIUS */}
        <div className="ds-row ds-row-bottom">
          {/* SPACING SYSTEM */}
          <section className="ds-panel ds-panel-spacing">
            <div className="panel-label">SPACING SYSTEM <span className="label-sub">(4px base unit)</span></div>
            <div className="spacing-bars-container">
              {[
                { val: '4px', height: 16 },
                { val: '8px', height: 26 },
                { val: '16px', height: 38 },
                { val: '24px', height: 50 },
                { val: '32px', height: 62 },
                { val: '40px', height: 74 },
                { val: '64px', height: 86 },
              ].map((s) => (
                <div key={s.val} className="spacing-bar-item">
                  <div
                    className="spacing-bar-box"
                    style={{ height: `${s.height}px` }}
                  />
                  <span className="spacing-val-text">{s.val}</span>
                </div>
              ))}
            </div>
            <div className="system-footer-note">Consistent spacing scale based on 4px base unit.</div>
          </section>

          {/* GRID SYSTEM */}
          <section className="ds-panel ds-panel-grid">
            <div className="panel-label">GRID SYSTEM</div>
            <div className="grid-visualizer-row">
              <div className="grid-columns-preview">
                {Array.from({ length: 12 }).map((_, idx) => (
                  <div key={idx} className="grid-column-bar" />
                ))}
              </div>
              <div className="grid-specs-sidebar">
                <div className="grid-spec-line"><strong>12 Columns</strong> (Desktop)</div>
                <div className="grid-spec-line">Content width 1280px</div>
                <div className="grid-spec-line">Gutters 24px</div>
                <div className="grid-spec-line">Page margins 24px</div>
              </div>
            </div>
            <div className="system-footer-note">12 column grid with 24px gutters and 24px page margins.</div>
          </section>

          {/* SHADOWS */}
          <section className="ds-panel ds-panel-shadows">
            <div className="panel-label">SHADOWS</div>
            <div className="shadow-boxes-list">
              <div className="shadow-box-item">
                <div className="shadow-preview shadow-sm" />
                <div className="shadow-desc">
                  <span className="shadow-title">Small</span>
                  <span className="shadow-code">0px 1px 2px rgba(0,0,0,0.05)</span>
                </div>
              </div>
              <div className="shadow-box-item">
                <div className="shadow-preview shadow-md" />
                <div className="shadow-desc">
                  <span className="shadow-title">Medium</span>
                  <span className="shadow-code">0px 4px 12px rgba(0,0,0,0.08)</span>
                </div>
              </div>
              <div className="shadow-box-item">
                <div className="shadow-preview shadow-lg" />
                <div className="shadow-desc">
                  <span className="shadow-title">Large</span>
                  <span className="shadow-code">0px 12px 24px rgba(0,0,0,0.12)</span>
                </div>
              </div>
            </div>
          </section>

          {/* BORDER RADIUS */}
          <section className="ds-panel ds-panel-radius">
            <div className="panel-label">BORDER RADIUS</div>
            <div className="radius-boxes-list">
              <div className="radius-item">
                <div className="radius-preview rad-sm" />
                <span className="radius-label">Small</span>
                <span className="radius-val">4px</span>
              </div>
              <div className="radius-item">
                <div className="radius-preview rad-md" />
                <span className="radius-label">Medium</span>
                <span className="radius-val">8px</span>
              </div>
              <div className="radius-item">
                <div className="radius-preview rad-lg" />
                <span className="radius-label">Large</span>
                <span className="radius-val">12px</span>
              </div>
              <div className="radius-item">
                <div className="radius-preview rad-pill" />
                <span className="radius-label">Pill</span>
                <span className="radius-val">9998px</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Footer Branding Bar */}
      <footer className="ds-footer">
        <div className="footer-brand">
          <span className="footer-title">InterviewIQ</span>
          <span className="footer-sep">|</span>
          <span className="footer-text">Practice. Improve. Get hired.</span>
        </div>
        <div className="footer-version">Design System v1.0</div>
      </footer>
    </div>
  );
}

export default DesignSystem;
