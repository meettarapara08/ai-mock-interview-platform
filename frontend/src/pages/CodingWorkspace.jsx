import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  RotateCcw,
  BookOpen,
  History,
  FileCode,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  getCodingProblemDetail,
  runCode,
  submitCode,
  getProblemSubmissions,
  getSubmissionDetail,
} from '../api/coding';
import CodeEditor from '../components/coding/CodeEditor';
import TestResultsPanel from '../components/coding/TestResultsPanel';
import './CodingWorkspace.css';

export function CodingWorkspace() {
  const { slug } = useParams();
  const navigate = useNavigate();

  // Problem State
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Editor State
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');

  // Active Left Tab: 'description' | 'submissions'
  const [activeLeftTab, setActiveLeftTab] = useState('description');

  // Execution & Submission State
  const [executing, setExecuting] = useState(false);
  const [executionMode, setExecutionMode] = useState('run'); // 'run' | 'submit'
  const [executionResults, setExecutionResults] = useState(null);
  const [executionError, setExecutionError] = useState(null);

  // Submissions Tab State
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [selectedSubmissionCode, setSelectedSubmissionCode] = useState(null);

  // Fetch problem details
  useEffect(() => {
    let isMounted = true;
    async function loadProblem() {
      try {
        setLoading(true);
        setError(null);
        const data = await getCodingProblemDetail(slug);
        if (isMounted) {
          setProblem(data);
          // Set initial code for default language
          const initialCode = data?.starter_code?.[language] || '';
          setCode(initialCode);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.response?.data?.error || 'Failed to load problem statement.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProblem();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Handle language switch
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    if (problem?.starter_code?.[newLang]) {
      setCode(problem.starter_code[newLang]);
    }
  };

  // Reset to starter code
  const handleResetCode = () => {
    if (window.confirm('Reset code editor to the default starter template?')) {
      if (problem?.starter_code?.[language]) {
        setCode(problem.starter_code[language]);
      }
    }
  };

  // Fetch submissions history
  const loadSubmissions = useCallback(async () => {
    try {
      setLoadingSubmissions(true);
      const data = await getProblemSubmissions(slug);
      setSubmissions(data);
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  }, [slug]);

  useEffect(() => {
    if (activeLeftTab === 'submissions') {
      loadSubmissions();
    }
  }, [activeLeftTab, loadSubmissions]);

  // Run Code
  const handleRunCode = async () => {
    try {
      setExecuting(true);
      setExecutionMode('run');
      setExecutionError(null);
      const res = await runCode(slug, {
        language,
        code,
      });
      setExecutionResults(res);
    } catch (err) {
      setExecutionError(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Failed to run code. Please check your connection and try again.'
      );
    } finally {
      setExecuting(false);
    }
  };

  // Submit Code
  const handleSubmitCode = async () => {
    try {
      setExecuting(true);
      setExecutionMode('submit');
      setExecutionError(null);
      const res = await submitCode(slug, {
        language,
        code,
      });
      setExecutionResults(res);

      // Refresh problem status to reflect solve
      if (res.status === 'accepted') {
        setProblem((prev) => ({ ...prev, user_status: 'solved' }));
      }
    } catch (err) {
      setExecutionError(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Failed to submit code. Please try again.'
      );
    } finally {
      setExecuting(false);
    }
  };

  // View submission code modal
  const handleViewSubmission = async (subId) => {
    try {
      const sub = await getSubmissionDetail(subId);
      setSelectedSubmissionCode(sub);
    } catch (err) {
      console.error('Failed to view submission details:', err);
    }
  };

  if (loading) {
    return (
      <div className="workspace-loading-page">
        <div className="coding-spinner" />
        <p>Preparing coding workspace...</p>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="workspace-error-page">
        <AlertCircle size={32} className="text-error" />
        <p>{error || 'Problem not found.'}</p>
        <button
          type="button"
          className="workspace-back-btn"
          onClick={() => navigate('/coding-practice')}
        >
          <ArrowLeft size={16} />
          <span>Back to Problems</span>
        </button>
      </div>
    );
  }

  return (
    <div className="coding-workspace-container" id="coding-workspace">
      {/* Top Navigation Bar */}
      <header className="workspace-header">
        <div className="workspace-header-left">
          <button
            type="button"
            className="workspace-back-btn"
            onClick={() => navigate('/coding-practice')}
          >
            <ArrowLeft size={16} />
            <span>Problems</span>
          </button>
          <div className="workspace-title-box">
            <h1 className="workspace-problem-title">{problem.title}</h1>
            <span className={`diff-pill diff-${problem.difficulty}`}>
              {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
            </span>
            <span className="category-tag">{problem.category}</span>
          </div>
        </div>

        <div className="workspace-header-right">
          {problem.user_status === 'solved' && (
            <div className="solved-badge">
              <CheckCircle2 size={16} />
              <span>Solved</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Workspace Split Layout */}
      <div className="workspace-split-layout">
        {/* Left Pane: Problem Statement & Submissions */}
        <div className="workspace-left-pane">
          <div className="workspace-left-tabs" role="tablist">
            <button
              type="button"
              className={`workspace-tab-btn ${activeLeftTab === 'description' ? 'active' : ''}`}
              onClick={() => setActiveLeftTab('description')}
            >
              <BookOpen size={16} />
              <span>Description</span>
            </button>
            <button
              type="button"
              className={`workspace-tab-btn ${activeLeftTab === 'submissions' ? 'active' : ''}`}
              onClick={() => setActiveLeftTab('submissions')}
            >
              <History size={16} />
              <span>Submissions</span>
            </button>
          </div>

          <div className="workspace-left-content">
            {activeLeftTab === 'description' ? (
              <div className="problem-description-content">
                <div className="problem-text-block">
                  <p className="problem-statement">{problem.description}</p>
                </div>

                {/* Input / Output Formats */}
                {problem.input_format && (
                  <div className="problem-io-block">
                    <h3>Input Format</h3>
                    <p>{problem.input_format}</p>
                  </div>
                )}

                {problem.output_format && (
                  <div className="problem-io-block">
                    <h3>Output Format</h3>
                    <p>{problem.output_format}</p>
                  </div>
                )}

                {/* Constraints */}
                {problem.constraints && (
                  <div className="problem-constraints-block">
                    <h3>Constraints</h3>
                    <pre className="constraints-code-box">{problem.constraints}</pre>
                  </div>
                )}

                {/* Sample Examples */}
                {problem.sample_test_cases?.length > 0 && (
                  <div className="problem-examples-section">
                    <h3>Examples</h3>
                    {problem.sample_test_cases.map((sample, idx) => (
                      <div key={sample.id || idx} className="example-card">
                        <div className="example-header">Example {idx + 1}</div>
                        <div className="example-io">
                          <div className="example-io-row">
                            <span className="io-label">Input:</span>
                            <pre className="io-pre">{sample.input_data}</pre>
                          </div>
                          <div className="example-io-row">
                            <span className="io-label">Output:</span>
                            <pre className="io-pre">{sample.expected_output}</pre>
                          </div>
                          {sample.explanation && (
                            <div className="example-explanation">
                              <span className="io-label">Explanation:</span>
                              <p>{sample.explanation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="problem-submissions-tab">
                {loadingSubmissions ? (
                  <div className="submissions-loading">
                    <div className="coding-spinner" />
                    <p>Loading submission history...</p>
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="submissions-empty">
                    <FileCode size={28} className="text-secondary" />
                    <p>You haven't submitted any solutions for this problem yet.</p>
                  </div>
                ) : (
                  <table className="submissions-table">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Lang</th>
                        <th>Score</th>
                        <th>Time</th>
                        <th>Date</th>
                        <th>Code</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((sub) => (
                        <tr key={sub.id}>
                          <td>
                            <span className={`sub-status-pill status-${sub.status}`}>
                              {sub.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td>
                            <span className="sub-lang-label">
                              {sub.language.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <span className="sub-score-num">{sub.score}%</span>
                          </td>
                          <td>
                            <span className="sub-time-num">
                              {sub.execution_time_ms ? `${sub.execution_time_ms} ms` : '-'}
                            </span>
                          </td>
                          <td>
                            <span className="sub-date">
                              {new Date(sub.created_at).toLocaleDateString()}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="view-sub-btn"
                              onClick={() => handleViewSubmission(sub.id)}
                              title="View code"
                            >
                              <ExternalLink size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Code Editor & Action Controls */}
        <div className="workspace-right-pane">
          {/* Editor Header Toolbar */}
          <div className="editor-toolbar">
            <div className="editor-toolbar-left">
              <label htmlFor="language-select" className="lang-select-label">
                Language:
              </label>
              <select
                id="language-select"
                className="language-selector"
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
              >
                <option value="python">Python 3</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>
            </div>

            <div className="editor-toolbar-right">
              <button
                type="button"
                className="toolbar-btn"
                onClick={handleResetCode}
                title="Reset to starter code"
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Code Editor */}
          <CodeEditor
            value={code}
            onChange={setCode}
            language={language}
            minHeight="380px"
          />

          {/* Action Footer (Run & Submit) */}
          <div className="workspace-actions-footer">
            <div className="keyboard-hint">
              <span>Supports Python 3, Java, and C++ with sandboxed execution.</span>
            </div>

            <div className="actions-btn-group">
              <button
                type="button"
                id="run-code-btn"
                className="action-btn run-btn"
                onClick={handleRunCode}
                disabled={executing}
              >
                <Play size={15} />
                <span>Run Code</span>
              </button>

              <button
                type="button"
                id="submit-code-btn"
                className="action-btn submit-btn"
                onClick={handleSubmitCode}
                disabled={executing}
              >
                <CheckCircle2 size={16} />
                <span>Submit Code</span>
              </button>
            </div>
          </div>

          {/* Test Results Output Panel */}
          <TestResultsPanel
            results={executionResults}
            loading={executing}
            error={executionError}
            activeMode={executionMode}
          />
        </div>
      </div>

      {/* Submission Code View Modal */}
      {selectedSubmissionCode && (
        <div className="submission-modal-overlay" onClick={() => setSelectedSubmissionCode(null)}>
          <div className="submission-modal" onClick={(e) => e.stopPropagation()}>
            <div className="submission-modal-header">
              <h3>
                Submission #{selectedSubmissionCode.id} -{' '}
                <span className={`sub-status-pill status-${selectedSubmissionCode.status}`}>
                  {selectedSubmissionCode.status.replace(/_/g, ' ')}
                </span>
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedSubmissionCode(null)}
              >
                ✕
              </button>
            </div>
            <div className="submission-modal-body">
              <div className="submission-meta-row">
                <span>Language: <strong>{selectedSubmissionCode.language.toUpperCase()}</strong></span>
                <span>Score: <strong>{selectedSubmissionCode.score}%</strong></span>
                <span>Passed: <strong>{selectedSubmissionCode.passed_test_cases}/{selectedSubmissionCode.total_test_cases}</strong></span>
              </div>
              <pre className="submission-code-block">{selectedSubmissionCode.code}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CodingWorkspace;
