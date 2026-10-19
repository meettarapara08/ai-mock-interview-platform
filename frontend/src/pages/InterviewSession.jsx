import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Loader2,
  AlertCircle,
  Send,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  MessageSquare,
  Clock,
  Star,
  XCircle,
} from 'lucide-react';
import { getCurrentQuestion, submitAnswer, completeSession, getSession } from '../api/interviews';
import './InterviewSession.css';

export function InterviewSession() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sessionData, setSessionData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  const [answerText, setAnswerText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState('');

  // After answer submission
  const [evaluation, setEvaluation] = useState(null);
  const [nextQuestion, setNextQuestion] = useState(null);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [evalNote, setEvalNote] = useState('');

  // Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Load session and current question
  const loadCurrentState = useCallback(async () => {
    try {
      const session = await getSession(id);
      setSessionData(session);
      setTotalQuestions(session.total_questions);

      if (session.status === 'completed') {
        navigate(`/interview/result/${id}`, { replace: true });
        return;
      }

      if (session.status !== 'in_progress') {
        setError('This session is not active.');
        setLoading(false);
        return;
      }

      const qData = await getCurrentQuestion(id);
      setCurrentQuestion(qData.current_question);
      setQuestionIndex(qData.current_question_index);
      setTotalQuestions(qData.total_questions);
    } catch (err) {
      const status = err.response?.status;
      if (status === 404) {
        setError('Interview session not found.');
      } else if (status === 409) {
        setError(err.response?.data?.detail || 'Session is not active.');
      } else {
        setError('Failed to load interview session.');
      }
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadCurrentState();
  }, [loadCurrentState]);

  // Timer
  useEffect(() => {
    if (loading || error || showFeedback) return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, error, showFeedback]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Submit answer
  const handleSubmit = async () => {
    if (answerText.trim().length < 10) {
      setError('Your answer must be at least 10 characters long.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const result = await submitAnswer(id, answerText.trim());

      setEvaluation(result.evaluation || null);
      setEvalNote(result.evaluation_note || '');
      setNextQuestion(result.next_question || null);
      setIsSessionComplete(result.is_session_complete);
      setQuestionIndex(result.current_question_index);
      setShowFeedback(true);
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.answer_text?.[0];
      setError(detail || 'Failed to submit answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Move to next question
  const handleNext = () => {
    if (nextQuestion) {
      setCurrentQuestion(nextQuestion);
      setNextQuestion(null);
      setEvaluation(null);
      setEvalNote('');
      setShowFeedback(false);
      setAnswerText('');
      setElapsedSeconds(0);
    }
  };

  // Complete session
  const handleComplete = async () => {
    setCompleting(true);
    try {
      await completeSession(id);
      navigate(`/interview/result/${id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to complete session.');
      setCompleting(false);
    }
  };

  // Exit confirmation
  const handleExit = () => {
    if (window.confirm('Are you sure you want to leave? Your progress will be saved, and you can resume later.')) {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="session-loading">
        <Loader2 size={32} className="spin" />
        <span>Loading interview session...</span>
      </div>
    );
  }

  if (error && !currentQuestion) {
    return (
      <div className="session-error-page">
        <AlertCircle size={40} className="session-error-icon" />
        <h2>Unable to Load Session</h2>
        <p>{error}</p>
        <button
          type="button"
          className="session-back-btn"
          onClick={() => navigate('/')}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const progressPercent = totalQuestions > 0
    ? Math.round(((questionIndex + (showFeedback ? 1 : 0)) / totalQuestions) * 100)
    : 0;

  return (
    <div className="interview-session" id="interview-session-page">
      {/* Top Bar */}
      <div className="session-top-bar">
        <div className="session-info">
          <span className="session-type-badge">
            {sessionData?.interview_type_display || 'Interview'}
          </span>
          <span className="session-role">
            {sessionData?.job_role}
          </span>
        </div>
        <div className="session-meta">
          <div className="session-timer">
            <Clock size={14} />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>
          <button
            type="button"
            className="session-exit-btn"
            onClick={handleExit}
          >
            <XCircle size={16} />
            <span>Exit</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="session-progress-area">
        <div className="session-progress-header">
          <span className="session-progress-text">
            Question {questionIndex + 1} of {totalQuestions}
          </span>
          <span className="session-progress-percent">{progressPercent}%</span>
        </div>
        <div className="session-progress-track">
          <div
            className="session-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="session-error-banner">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Question Card */}
      {!showFeedback && currentQuestion && (
        <div className="session-question-card">
          <div className="session-q-header">
            <MessageSquare size={18} className="session-q-icon" />
            <span className="session-q-label">
              Question {questionIndex + 1}
              {currentQuestion.is_follow_up && (
                <span className="session-followup-badge">Follow-up</span>
              )}
            </span>
          </div>
          <p className="session-q-text">{currentQuestion.question_text}</p>

          {/* Answer Area */}
          <div className="session-answer-area">
            <label htmlFor="answer-textarea" className="session-answer-label">
              Your Answer
            </label>
            <textarea
              id="answer-textarea"
              className="session-answer-textarea"
              rows={6}
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Type your answer here... (minimum 10 characters)"
              disabled={submitting}
            />
            <div className="session-answer-footer">
              <span className="session-char-count">
                {answerText.length} characters
              </span>
              <button
                type="button"
                className="session-submit-btn"
                onClick={handleSubmit}
                disabled={submitting || answerText.trim().length < 10}
                id="submit-answer-btn"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    <span>Evaluating...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Submit Answer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Card (shown after answer submission) */}
      {showFeedback && (
        <div className="session-feedback-card">
          {evaluation ? (
            <>
              <div className="feedback-header">
                <Star size={20} className="feedback-star" />
                <h3 className="feedback-title">AI Evaluation</h3>
                <span className="feedback-overall-score">
                  {evaluation.overall_score.toFixed(0)}
                  <span className="feedback-score-max">/100</span>
                </span>
              </div>

              {/* Score Bars */}
              <div className="feedback-scores">
                {[
                  { label: 'Knowledge', value: evaluation.knowledge_score, color: '#4F46E5' },
                  { label: 'Relevance', value: evaluation.relevance_score, color: '#06b6d4' },
                  { label: 'Completeness', value: evaluation.completeness_score, color: '#16a34a' },
                  { label: 'Communication', value: evaluation.communication_score, color: '#f59e0b' },
                ].map((item) => (
                  <div className="feedback-score-row" key={item.label}>
                    <div className="feedback-score-header">
                      <span className="feedback-score-label">{item.label}</span>
                      <span className="feedback-score-value">{item.value}</span>
                    </div>
                    <div className="feedback-score-track">
                      <div
                        className="feedback-score-fill"
                        style={{
                          width: `${item.value}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Feedback Text */}
              {evaluation.feedback_text && (
                <p className="feedback-text">{evaluation.feedback_text}</p>
              )}

              {/* Strengths & Weaknesses */}
              <div className="feedback-insights">
                {evaluation.strengths?.length > 0 && (
                  <div className="feedback-insight-box feedback-strengths">
                    <h4>Strengths</h4>
                    <ul>
                      {evaluation.strengths.map((s, i) => (
                        <li key={i}>
                          <CheckCircle2 size={13} />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {evaluation.suggestions?.length > 0 && (
                  <div className="feedback-insight-box feedback-suggestions">
                    <h4>Suggestions</h4>
                    <ul>
                      {evaluation.suggestions.map((s, i) => (
                        <li key={i}>
                          <ArrowRight size={13} />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="feedback-unavailable">
              <AlertCircle size={20} />
              <p>{evalNote || 'AI evaluation was unavailable for this answer. Your answer has been recorded.'}</p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="feedback-actions">
            {!isSessionComplete && nextQuestion ? (
              <button
                type="button"
                className="feedback-next-btn"
                onClick={handleNext}
                id="next-question-btn"
              >
                <span>Next Question</span>
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                className="feedback-complete-btn"
                onClick={handleComplete}
                disabled={completing}
                id="complete-interview-btn"
              >
                {completing ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    <span>Finishing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Complete Interview</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default InterviewSession;
