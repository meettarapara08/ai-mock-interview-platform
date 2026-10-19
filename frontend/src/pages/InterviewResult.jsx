import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Loader2,
  AlertCircle,
  Trophy,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowLeft,
  Play,
  Clock,
  Sparkles,
} from 'lucide-react';
import { getSessionReport } from '../api/interviews';
import './InterviewResult.css';

const CRITERIA_COLORS = {
  knowledge: '#4F46E5',
  relevance: '#06b6d4',
  completeness: '#16a34a',
  communication: '#f59e0b',
};

const CRITERIA_LABELS = {
  knowledge: 'Knowledge',
  relevance: 'Relevance',
  completeness: 'Completeness',
  communication: 'Communication',
};

function getScoreGrade(score) {
  if (score >= 90) return { label: 'Excellent', color: '#16a34a' };
  if (score >= 75) return { label: 'Good', color: '#4F46E5' };
  if (score >= 60) return { label: 'Average', color: '#f59e0b' };
  return { label: 'Needs Improvement', color: '#dc2626' };
}

export function InterviewResult() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedQuestions, setExpandedQuestions] = useState({});

  useEffect(() => {
    async function loadReport() {
      try {
        const data = await getSessionReport(id);
        setReport(data);
        // Auto-expand first question
        if (data.questions?.length > 0) {
          setExpandedQuestions({ 0: true });
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setError('Interview session not found.');
        } else {
          setError('Failed to load interview report.');
        }
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [id]);

  const toggleQuestion = (index) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  if (loading) {
    return (
      <div className="result-loading">
        <Loader2 size={32} className="spin" />
        <span>Loading interview results...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="result-error-page">
        <AlertCircle size={40} className="result-error-icon" />
        <h2>Unable to Load Results</h2>
        <p>{error}</p>
        <button
          type="button"
          className="result-back-btn"
          onClick={() => navigate('/')}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const { session, questions, overall_score, score_breakdown } = report;
  const grade = overall_score != null ? getScoreGrade(overall_score) : null;

  return (
    <div className="interview-result" id="interview-result-page">
      {/* Header */}
      <div className="result-header">
        <button
          type="button"
          className="result-nav-back"
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={16} />
          <span>Dashboard</span>
        </button>
        <div className="result-header-content">
          <div className="result-header-left">
            <h1 className="result-title">
              <Trophy size={24} className="result-trophy" />
              Interview Results
            </h1>
            <div className="result-meta-row">
              <span className="result-type-badge">
                {session.interview_type_display}
              </span>
              <span className="result-role">{session.job_role}</span>
              <span className="result-divider">·</span>
              <span className="result-diff">{session.difficulty_display}</span>
              <span className="result-divider">·</span>
              <span className="result-date">
                <Clock size={12} />
                {new Date(session.created_at).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Score Card */}
      {overall_score != null && (
        <div className="result-score-card">
          <div className="result-score-gauge">
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle
                cx="70" cy="70" r="60"
                fill="none" stroke="#E2E8F0" strokeWidth="10"
              />
              <circle
                cx="70" cy="70" r="60"
                fill="none"
                stroke="url(#resultGradient)"
                strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 60}`}
                strokeDashoffset={`${2 * Math.PI * 60 * (1 - overall_score / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 70 70)"
                className="result-gauge-progress"
              />
              <defs>
                <linearGradient id="resultGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4F46E5" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="result-score-center">
              <span className="result-score-number">{overall_score.toFixed(0)}</span>
              <span className="result-score-label">/ 100</span>
            </div>
          </div>

          <div className="result-score-info">
            <span
              className="result-grade-badge"
              style={{ color: grade.color, backgroundColor: `${grade.color}15` }}
            >
              {grade.label}
            </span>
            <p className="result-score-summary">
              You answered {report.total_questions_answered} of {session.total_questions} questions
              {session.is_ai_generated && (
                <span className="result-ai-badge">
                  <Sparkles size={12} /> AI-Powered
                </span>
              )}
            </p>

            {/* Score Breakdown */}
            <div className="result-breakdown">
              {Object.entries(score_breakdown).map(([key, value]) => (
                <div className="result-breakdown-row" key={key}>
                  <div className="result-breakdown-header">
                    <span className="result-breakdown-label">
                      {CRITERIA_LABELS[key] || key}
                    </span>
                    <span className="result-breakdown-value">{value.toFixed(0)}</span>
                  </div>
                  <div className="result-breakdown-track">
                    <div
                      className="result-breakdown-fill"
                      style={{
                        width: `${value}%`,
                        backgroundColor: CRITERIA_COLORS[key] || '#4F46E5',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Aggregate Insights */}
      {(report.aggregate_strengths?.length > 0 || report.aggregate_suggestions?.length > 0) && (
        <div className="result-insights-row">
          {report.aggregate_strengths?.length > 0 && (
            <div className="result-insight-card result-strengths-card">
              <h3>
                <CheckCircle2 size={16} className="insight-icon-green" />
                Key Strengths
              </h3>
              <ul>
                {report.aggregate_strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {report.aggregate_weaknesses?.length > 0 && (
            <div className="result-insight-card result-weaknesses-card">
              <h3>
                <AlertTriangle size={16} className="insight-icon-amber" />
                Areas to Improve
              </h3>
              <ul>
                {report.aggregate_weaknesses.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
          {report.aggregate_suggestions?.length > 0 && (
            <div className="result-insight-card result-suggestions-card">
              <h3>
                <Lightbulb size={16} className="insight-icon-indigo" />
                Recommendations
              </h3>
              <ul>
                {report.aggregate_suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Per-Question Details */}
      <div className="result-questions-section">
        <h2 className="result-section-title">Question-by-Question Review</h2>
        <div className="result-questions-list">
          {questions.map((q, index) => {
            const isExpanded = expandedQuestions[index];
            const eval_ = q.evaluation;
            return (
              <div
                className={`result-q-card ${isExpanded ? 'result-q-expanded' : ''}`}
                key={q.id}
              >
                <button
                  type="button"
                  className="result-q-toggle"
                  onClick={() => toggleQuestion(index)}
                >
                  <div className="result-q-toggle-left">
                    <span className="result-q-number">Q{q.question_order + 1}</span>
                    <span className="result-q-text-preview">
                      {q.question_text.length > 100
                        ? q.question_text.substring(0, 100) + '...'
                        : q.question_text}
                    </span>
                    {q.is_follow_up && (
                      <span className="result-q-followup">Follow-up</span>
                    )}
                  </div>
                  <div className="result-q-toggle-right">
                    {eval_ && (
                      <span
                        className="result-q-score"
                        style={{ color: getScoreGrade(eval_.overall_score).color }}
                      >
                        {eval_.overall_score.toFixed(0)}
                      </span>
                    )}
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="result-q-detail">
                    {/* Full Question */}
                    <div className="result-q-full">
                      <h4>Question</h4>
                      <p>{q.question_text}</p>
                    </div>

                    {/* Answer */}
                    {q.answer ? (
                      <div className="result-q-answer">
                        <h4>Your Answer</h4>
                        <p>{q.answer.answer_text}</p>
                      </div>
                    ) : (
                      <div className="result-q-no-answer">
                        <p>No answer submitted.</p>
                      </div>
                    )}

                    {/* Evaluation */}
                    {eval_ && (
                      <div className="result-q-eval">
                        <h4>Evaluation</h4>
                        <div className="result-q-scores-grid">
                          {['knowledge', 'relevance', 'completeness', 'communication'].map(
                            (key) => (
                              <div className="result-q-score-item" key={key}>
                                <span className="result-q-score-label">
                                  {CRITERIA_LABELS[key]}
                                </span>
                                <div className="result-q-score-bar-track">
                                  <div
                                    className="result-q-score-bar-fill"
                                    style={{
                                      width: `${eval_[`${key}_score`]}%`,
                                      backgroundColor: CRITERIA_COLORS[key],
                                    }}
                                  />
                                </div>
                                <span className="result-q-score-val">
                                  {eval_[`${key}_score`]}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                        {eval_.feedback_text && (
                          <p className="result-q-feedback">{eval_.feedback_text}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="result-bottom-actions">
        <button
          type="button"
          className="result-action-secondary"
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>
        <button
          type="button"
          className="result-action-primary"
          onClick={() => navigate('/interview/setup')}
        >
          <Play size={16} />
          <span>Start New Interview</span>
        </button>
      </div>
    </div>
  );
}

export default InterviewResult;
