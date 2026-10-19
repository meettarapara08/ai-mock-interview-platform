import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Code2,
  User,
  Users,
  Briefcase,
  FileText,
  Play,
  ChevronLeft,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getInterviewConfig, createSession, startSession } from '../api/interviews';
import './InterviewSetup.css';

const TYPE_ICONS = {
  technical: Code2,
  behavioral: User,
  hr: Users,
  managerial: Briefcase,
  resume: FileText,
};

const TYPE_COLORS = {
  technical: { bg: '#ecfeff', color: '#06b6d4', border: '#a5f3fc' },
  behavioral: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  hr: { bg: '#eef2ff', color: '#4F46E5', border: '#c7d2fe' },
  managerial: { bg: '#fefce8', color: '#eab308', border: '#fde68a' },
  resume: { bg: '#eef2ff', color: '#4F46E5', border: '#c7d2fe' },
};

const DIFFICULTY_INFO = {
  easy: { label: 'Easy', desc: 'Entry-level, straightforward questions', color: '#16a34a' },
  medium: { label: 'Medium', desc: 'Intermediate, requires some experience', color: '#f59e0b' },
  hard: { label: 'Hard', desc: 'Advanced, deep expertise required', color: '#dc2626' },
};

export function InterviewSetup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const rawType = searchParams.get('type');
  const initialType = rawType === 'hr-managerial' ? 'hr' : (rawType || '');
  const [interviewType, setInterviewType] = useState(initialType);
  const [jobRole, setJobRole] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [totalQuestions, setTotalQuestions] = useState(5);

  useEffect(() => {
    const t = searchParams.get('type');
    if (t === 'resume') {
      navigate('/resume-interview');
      return;
    }
    if (t) {
      setInterviewType(t === 'hr-managerial' ? 'hr' : t);
    }
    const r = searchParams.get('role');
    if (r) {
      setJobRole(r);
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    async function loadConfig() {
      try {
        const data = await getInterviewConfig();
        setConfig(data);
        const urlRole = searchParams.get('role');
        if (urlRole) {
          setJobRole(urlRole);
        } else if (!jobRole) {
          setJobRole(data.default_job_role || user?.profile?.target_role || 'Software Engineer');
        }
      } catch (err) {
        setError('Failed to load interview configuration. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  const handleStart = async () => {
    if (!interviewType || !jobRole.trim() || !difficulty) {
      setError('Please fill in all required fields.');
      return;
    }

    setError('');
    setStarting(true);

    try {
      // Step 1: Create the session
      const session = await createSession({
        interview_type: interviewType,
        job_role: jobRole.trim(),
        difficulty,
        total_questions: totalQuestions,
      });

      // Step 2: Start the session (generate questions)
      await startSession(session.id);

      // Navigate to the session page
      navigate(`/interview/session/${session.id}`);
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.interview_type?.[0];
      setError(detail || 'Failed to start interview. Please try again.');
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="setup-loading">
        <Loader2 size={32} className="spin" />
        <span>Loading interview options...</span>
      </div>
    );
  }

  const types = config?.interview_types || [
    { value: 'technical', label: 'Technical' },
    { value: 'behavioral', label: 'Behavioral' },
    { value: 'hr', label: 'HR' },
    { value: 'managerial', label: 'Managerial' },
  ];

  return (
    <div className="interview-setup" id="interview-setup-page">
      {/* Header */}
      <div className="setup-header">
        <button
          type="button"
          className="setup-back-btn"
          onClick={() => navigate('/')}
        >
          <ChevronLeft size={18} />
          <span>Back to Dashboard</span>
        </button>
        <div className="setup-header-text">
          <h1 className="setup-title">
            <Sparkles size={24} className="setup-title-icon" />
            Set Up Your Interview
          </h1>
          <p className="setup-subtitle">
            Configure your practice session and start preparing with AI-powered questions.
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="setup-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Interview Type */}
      <div className="setup-section">
        <h2 className="setup-section-label">1. Interview Type</h2>
        <div className="setup-type-grid">
          {types.map((type) => {
            const Icon = TYPE_ICONS[type.value] || Code2;
            const colors = TYPE_COLORS[type.value] || TYPE_COLORS.technical;
            const isSelected = interviewType === type.value;
            return (
              <button
                key={type.value}
                type="button"
                className={`setup-type-card ${isSelected ? 'setup-type-selected' : ''}`}
                style={{
                  '--type-bg': colors.bg,
                  '--type-color': colors.color,
                  '--type-border': isSelected ? colors.color : 'var(--color-border)',
                }}
                onClick={() => {
                  if (type.value === 'resume') {
                    navigate('/resume-interview');
                  } else {
                    setInterviewType(type.value);
                  }
                }}
                id={`type-${type.value}`}
              >
                <div
                  className="setup-type-icon"
                  style={{ backgroundColor: colors.bg }}
                >
                  <Icon size={22} style={{ color: colors.color }} />
                </div>
                <span className="setup-type-label">{type.label}</span>
                {isSelected && (
                  <div className="setup-type-check">✓</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Job Role */}
      <div className="setup-section">
        <h2 className="setup-section-label">2. Target Job Role</h2>
        <div className="setup-role-input-wrapper">
          <Briefcase size={16} className="setup-role-icon" />
          <input
            type="text"
            className="setup-role-input"
            value={jobRole}
            onChange={(e) => setJobRole(e.target.value)}
            placeholder="e.g. Software Engineer, Data Scientist..."
            id="job-role-input"
          />
        </div>
        {config?.suggested_job_roles && (
          <div className="setup-role-suggestions">
            {config.suggested_job_roles.slice(0, 6).map((role) => (
              <button
                key={role}
                type="button"
                className={`setup-role-chip ${jobRole === role ? 'chip-active' : ''}`}
                onClick={() => setJobRole(role)}
              >
                {role}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Step 3: Difficulty */}
      <div className="setup-section">
        <h2 className="setup-section-label">3. Difficulty Level</h2>
        <div className="setup-difficulty-grid">
          {Object.entries(DIFFICULTY_INFO).map(([key, info]) => {
            const isSelected = difficulty === key;
            return (
              <button
                key={key}
                type="button"
                className={`setup-difficulty-card ${isSelected ? 'setup-diff-selected' : ''}`}
                style={{
                  '--diff-color': info.color,
                  borderColor: isSelected ? info.color : 'var(--color-border)',
                }}
                onClick={() => setDifficulty(key)}
                id={`diff-${key}`}
              >
                <span
                  className="setup-diff-dot"
                  style={{ backgroundColor: info.color }}
                />
                <div className="setup-diff-text">
                  <span className="setup-diff-label">{info.label}</span>
                  <span className="setup-diff-desc">{info.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 4: Number of Questions */}
      <div className="setup-section">
        <h2 className="setup-section-label">4. Number of Questions</h2>
        <div className="setup-questions-control">
          <input
            type="range"
            min={config?.question_range?.min || 3}
            max={config?.question_range?.max || 15}
            value={totalQuestions}
            onChange={(e) => setTotalQuestions(Number(e.target.value))}
            className="setup-range-slider"
            id="question-count-slider"
          />
          <div className="setup-question-count-badge">
            <span className="setup-count-number">{totalQuestions}</span>
            <span className="setup-count-label">questions</span>
          </div>
        </div>
        <div className="setup-range-labels">
          <span>{config?.question_range?.min || 3} min</span>
          <span>{config?.question_range?.max || 15} max</span>
        </div>
      </div>

      {/* Start Button */}
      <div className="setup-actions">
        <button
          type="button"
          className="setup-start-btn"
          onClick={handleStart}
          disabled={starting || !interviewType || !jobRole.trim()}
          id="start-interview-btn"
        >
          {starting ? (
            <>
              <Loader2 size={18} className="spin" />
              <span>Preparing Interview...</span>
            </>
          ) : (
            <>
              <Play size={18} />
              <span>Start Interview</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default InterviewSetup;
