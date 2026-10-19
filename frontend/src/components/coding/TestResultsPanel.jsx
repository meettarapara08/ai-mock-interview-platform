import React, { useState } from 'react';
import { CheckCircle2, XCircle, Clock, AlertTriangle, Terminal, Code2 } from 'lucide-react';
import './TestResultsPanel.css';

export function TestResultsPanel({
  results = null,
  loading = false,
  error = null,
  activeMode = 'run', // 'run' or 'submit'
}) {
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);

  if (loading) {
    return (
      <div className="test-results-container loading-state">
        <div className="test-results-spinner" aria-hidden="true" />
        <p className="test-results-loading-text">
          {activeMode === 'submit' ? 'Evaluating all test cases...' : 'Executing code against sample cases...'}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="test-results-container error-state">
        <div className="test-results-error-header">
          <AlertTriangle size={18} className="text-error" />
          <span>Execution Service Error</span>
        </div>
        <p className="test-results-error-msg">{error}</p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="test-results-container empty-state">
        <Terminal size={24} className="test-results-empty-icon" />
        <p>Run your code to see sample test results, or submit for evaluation.</p>
      </div>
    );
  }

  const { test_results = [], passed = 0, total = 0, all_passed = false, status = '' } = results;
  const currentCase = test_results[selectedCaseIdx] || test_results[0];

  // Helper status color and text
  const getStatusBadge = () => {
    if (activeMode === 'submit') {
      if (status === 'accepted' || all_passed) {
        return <span className="status-badge badge-success">Accepted (100%)</span>;
      }
      if (status === 'compilation_error') {
        return <span className="status-badge badge-error">Compilation Error</span>;
      }
      if (status === 'time_limit_exceeded') {
        return <span className="status-badge badge-warning">Time Limit Exceeded</span>;
      }
      if (status === 'runtime_error') {
        return <span className="status-badge badge-error">Runtime Error</span>;
      }
      return <span className="status-badge badge-error">Wrong Answer ({passed}/{total} Passed)</span>;
    }

    // Run mode
    if (all_passed) {
      return <span className="status-badge badge-success">All Sample Cases Passed</span>;
    }
    return <span className="status-badge badge-error">{passed}/{total} Sample Cases Passed</span>;
  };

  return (
    <div className="test-results-container">
      {/* Header Summary */}
      <div className="test-results-summary-bar">
        <div className="test-results-title-group">
          <Code2 size={18} />
          <span className="test-results-title">Execution Results</span>
          {getStatusBadge()}
        </div>

        {currentCase?.execution_time_ms !== undefined && (
          <div className="test-results-metric">
            <Clock size={14} />
            <span>{currentCase.execution_time_ms} ms</span>
          </div>
        )}
      </div>

      {/* Case Tabs */}
      {test_results.length > 0 && (
        <div className="test-cases-tabs">
          {test_results.map((c, idx) => (
            <button
              key={idx}
              type="button"
              className={`test-case-tab-btn ${selectedCaseIdx === idx ? 'active' : ''}`}
              onClick={() => setSelectedCaseIdx(idx)}
            >
              {c.passed ? (
                <CheckCircle2 size={14} className="icon-pass" />
              ) : (
                <XCircle size={14} className="icon-fail" />
              )}
              <span>Case {idx + 1}</span>
            </button>
          ))}
        </div>
      )}

      {/* Selected Case Detail */}
      {currentCase && (
        <div className="test-case-detail-content">
          {/* Compilation / Runtime Error Notice */}
          {currentCase.stderr && (
            <div className="test-case-block test-case-stderr-block">
              <label>Standard Error / Output</label>
              <pre className="test-case-code-box error-box">{currentCase.stderr}</pre>
            </div>
          )}

          <div className="test-case-block">
            <label>Input</label>
            <pre className="test-case-code-box">{currentCase.input || '<No input>'}</pre>
          </div>

          <div className="test-case-grid">
            <div className="test-case-block">
              <label>Expected Output</label>
              <pre className="test-case-code-box">{currentCase.expected || '<No expected output>'}</pre>
            </div>
            <div className="test-case-block">
              <label>Your Output</label>
              <pre className={`test-case-code-box ${currentCase.passed ? 'output-match' : 'output-mismatch'}`}>
                {currentCase.actual || '<No output>'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TestResultsPanel;
