import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  X,
  Plus,
  Edit2,
  Trash2,
  Code2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Terminal,
} from 'lucide-react';
import {
  getAdminCodingProblems,
  getAdminCodingProblemDetail,
  createAdminCodingProblem,
  updateAdminCodingProblem,
  deleteAdminCodingProblem,
  createAdminTestCase,
  updateAdminTestCase,
  deleteAdminTestCase,
} from '../../api/admin';
import './AdminCoding.css';

const DIFFICULTY_OPTIONS = [
  { value: 'all', label: 'All Difficulties' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

const INITIAL_STARTER_CODE = {
  python: 'def solution():\n    # Write your solution here\n    pass\n',
  java: 'class Solution {\n    public static void main(String[] args) {\n        // Write solution here\n    }\n}\n',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write solution here\n    return 0;\n}\n',
};

const INITIAL_PROBLEM_FORM = {
  title: '',
  slug: '',
  difficulty: 'easy',
  category: 'Arrays',
  order: 0,
  description: '',
  input_format: '',
  output_format: '',
  constraints: '',
  starter_code: INITIAL_STARTER_CODE,
};

const INITIAL_TEST_CASE_FORM = {
  input_data: '',
  expected_output: '',
  is_sample: true,
  explanation: '',
  order: 1,
};

export function AdminCoding() {
  // Query state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Data state
  const [problemsData, setProblemsData] = useState({ count: 0, results: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal: Create / Edit Problem
  const [isProblemModalOpen, setIsProblemModalOpen] = useState(false);
  const [problemModalMode, setProblemModalMode] = useState('create'); // 'create' | 'edit'
  const [currentProblemId, setCurrentProblemId] = useState(null);
  const [problemForm, setProblemForm] = useState(INITIAL_PROBLEM_FORM);
  const [activeCodeTab, setActiveCodeTab] = useState('python'); // 'python' | 'java' | 'cpp'
  const [problemFormErrors, setProblemFormErrors] = useState({});
  const [isSubmittingProblem, setIsSubmittingProblem] = useState(false);

  // Modal: Manage Test Cases
  const [isTestCaseModalOpen, setIsTestCaseModalOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [testCasesList, setTestCasesList] = useState([]);
  const [isLoadingTestCases, setIsLoadingTestCases] = useState(false);
  const [testCaseForm, setTestCaseForm] = useState(INITIAL_TEST_CASE_FORM);
  const [isSubmittingTestCase, setIsSubmittingTestCase] = useState(false);
  const [editingTestCaseId, setEditingTestCaseId] = useState(null);
  const [editTestCaseForm, setEditTestCaseForm] = useState(null);

  // Modal: Delete Problem
  const [problemToDelete, setProblemToDelete] = useState(null);
  const [isDeletingProblem, setIsDeletingProblem] = useState(false);

  // Toast / Action notification
  const [actionAlert, setActionAlert] = useState(null);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch problems list
  const fetchProblems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAdminCodingProblems({
        page,
        pageSize,
        search: debouncedSearch,
        difficulty,
        category,
      });
      setProblemsData(data);
    } catch (err) {
      console.error('Failed to load coding problems:', err);
      setError(err?.response?.data?.detail || 'Unable to retrieve coding problems.');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedSearch, difficulty, category]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  // Auto-dismiss alerts
  useEffect(() => {
    if (!actionAlert) return;
    const timer = setTimeout(() => {
      setActionAlert(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [actionAlert]);

  // Open Create Problem Modal
  const handleOpenCreateProblem = () => {
    setProblemModalMode('create');
    setCurrentProblemId(null);
    setProblemForm(INITIAL_PROBLEM_FORM);
    setActiveCodeTab('python');
    setProblemFormErrors({});
    setIsProblemModalOpen(true);
  };

  // Open Edit Problem Modal
  const handleOpenEditProblem = async (problem) => {
    try {
      // Fetch full problem detail with starter_code & full description
      const fullProblem = await getAdminCodingProblemDetail(problem.id);
      setProblemModalMode('edit');
      setCurrentProblemId(problem.id);
      setProblemForm({
        title: fullProblem.title || '',
        slug: fullProblem.slug || '',
        difficulty: fullProblem.difficulty || 'easy',
        category: fullProblem.category || 'Arrays',
        order: fullProblem.order || 0,
        description: fullProblem.description || '',
        input_format: fullProblem.input_format || '',
        output_format: fullProblem.output_format || '',
        constraints: fullProblem.constraints || '',
        starter_code: {
          python: fullProblem.starter_code?.python || INITIAL_STARTER_CODE.python,
          java: fullProblem.starter_code?.java || INITIAL_STARTER_CODE.java,
          cpp: fullProblem.starter_code?.cpp || INITIAL_STARTER_CODE.cpp,
        },
      });
      setActiveCodeTab('python');
      setProblemFormErrors({});
      setIsProblemModalOpen(true);
    } catch (err) {
      console.error('Failed to load problem detail for edit:', err);
      setActionAlert({
        type: 'error',
        message: 'Failed to load coding problem details.',
      });
    }
  };

  // Submit Problem Form (Create or Edit)
  const handleSubmitProblemForm = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!problemForm.title.trim()) {
      errors.title = 'Problem title is required.';
    }
    if (!problemForm.category.trim()) {
      errors.category = 'Category is required.';
    }
    if (!problemForm.description.trim()) {
      errors.description = 'Problem statement description is required.';
    }

    if (Object.keys(errors).length > 0) {
      setProblemFormErrors(errors);
      return;
    }

    setIsSubmittingProblem(true);
    setProblemFormErrors({});

    try {
      const payload = {
        title: problemForm.title.trim(),
        difficulty: problemForm.difficulty,
        category: problemForm.category.trim(),
        order: Number(problemForm.order) || 0,
        description: problemForm.description.trim(),
        input_format: problemForm.input_format.trim(),
        output_format: problemForm.output_format.trim(),
        constraints: problemForm.constraints.trim(),
        starter_code: problemForm.starter_code,
      };

      if (problemForm.slug.trim()) {
        payload.slug = problemForm.slug.trim();
      }

      if (problemModalMode === 'create') {
        await createAdminCodingProblem(payload);
        setActionAlert({
          type: 'success',
          message: `Coding problem '${payload.title}' created successfully.`,
        });
      } else {
        await updateAdminCodingProblem(currentProblemId, payload);
        setActionAlert({
          type: 'success',
          message: `Coding problem '${payload.title}' updated successfully.`,
        });
      }

      setIsProblemModalOpen(false);
      fetchProblems();
    } catch (err) {
      console.error('Failed to save coding problem:', err);
      const apiErrors = err?.response?.data || {};
      if (typeof apiErrors === 'object') {
        const mappedErrors = {};
        Object.entries(apiErrors).forEach(([k, v]) => {
          mappedErrors[k] = Array.isArray(v) ? v[0] : String(v);
        });
        setProblemFormErrors(mappedErrors);
      } else {
        setProblemFormErrors({ general: 'Failed to save coding problem. Please check your connection.' });
      }
    } finally {
      setIsSubmittingProblem(false);
    }
  };

  // Open Manage Test Cases Modal
  const handleOpenTestCases = async (problem) => {
    setSelectedProblem(problem);
    setIsTestCaseModalOpen(true);
    setIsLoadingTestCases(true);
    setEditingTestCaseId(null);
    setEditTestCaseForm(null);

    try {
      const fullProblem = await getAdminCodingProblemDetail(problem.id);
      setTestCasesList(fullProblem.test_cases || []);
      setTestCaseForm({
        ...INITIAL_TEST_CASE_FORM,
        order: (fullProblem.test_cases?.length || 0) + 1,
      });
    } catch (err) {
      console.error('Failed to load test cases:', err);
      setActionAlert({
        type: 'error',
        message: 'Failed to retrieve test cases for this problem.',
      });
    } finally {
      setIsLoadingTestCases(false);
    }
  };

  // Refresh Test Cases for currently opened problem
  const refreshTestCases = async (problemId) => {
    try {
      const fullProblem = await getAdminCodingProblemDetail(problemId);
      setTestCasesList(fullProblem.test_cases || []);
      setTestCaseForm((prev) => ({
        ...prev,
        input_data: '',
        expected_output: '',
        explanation: '',
        order: (fullProblem.test_cases?.length || 0) + 1,
      }));
      // Also update counts in the background list
      fetchProblems();
    } catch (err) {
      console.error('Failed to refresh test cases:', err);
    }
  };

  // Add new test case
  const handleAddTestCase = async (e) => {
    e.preventDefault();
    if (!testCaseForm.expected_output.trim()) {
      alert('Expected output cannot be empty.');
      return;
    }

    setIsSubmittingTestCase(true);
    try {
      await createAdminTestCase(selectedProblem.id, {
        input_data: testCaseForm.input_data,
        expected_output: testCaseForm.expected_output,
        is_sample: testCaseForm.is_sample,
        explanation: testCaseForm.explanation.trim(),
        order: Number(testCaseForm.order) || 1,
      });

      setActionAlert({
        type: 'success',
        message: 'Test case added successfully.',
      });
      await refreshTestCases(selectedProblem.id);
    } catch (err) {
      console.error('Failed to add test case:', err);
      alert(err?.response?.data?.detail || 'Failed to add test case.');
    } finally {
      setIsSubmittingTestCase(false);
    }
  };

  // Start editing a test case inline
  const handleStartEditTestCase = (tc) => {
    setEditingTestCaseId(tc.id);
    setEditTestCaseForm({
      input_data: tc.input_data || '',
      expected_output: tc.expected_output || '',
      is_sample: tc.is_sample,
      explanation: tc.explanation || '',
      order: tc.order || 1,
    });
  };

  // Save updated test case
  const handleSaveEditTestCase = async (testCaseId) => {
    try {
      await updateAdminTestCase(testCaseId, editTestCaseForm);
      setEditingTestCaseId(null);
      setEditTestCaseForm(null);
      setActionAlert({
        type: 'success',
        message: 'Test case updated successfully.',
      });
      await refreshTestCases(selectedProblem.id);
    } catch (err) {
      console.error('Failed to update test case:', err);
      alert('Failed to update test case.');
    }
  };

  // Delete test case
  const handleDeleteTestCase = async (testCaseId) => {
    if (!window.confirm('Are you sure you want to delete this test case?')) return;
    try {
      await deleteAdminTestCase(testCaseId);
      setActionAlert({
        type: 'success',
        message: 'Test case deleted.',
      });
      await refreshTestCases(selectedProblem.id);
    } catch (err) {
      console.error('Failed to delete test case:', err);
      alert('Failed to delete test case.');
    }
  };

  // Delete Problem
  const handleConfirmDeleteProblem = async () => {
    if (!problemToDelete) return;
    setIsDeletingProblem(true);
    try {
      await deleteAdminCodingProblem(problemToDelete.id);
      setActionAlert({
        type: 'success',
        message: `Coding problem '${problemToDelete.title}' deleted successfully.`,
      });
      setProblemToDelete(null);
      fetchProblems();
    } catch (err) {
      console.error('Failed to delete problem:', err);
      setActionAlert({
        type: 'error',
        message: err?.response?.data?.detail || 'Unable to delete coding problem.',
      });
    } finally {
      setIsDeletingProblem(false);
    }
  };

  const totalPages = Math.ceil(problemsData.count / pageSize) || 1;

  return (
    <div className="admin-coding-page">
      {/* Header */}
      <div className="admin-coding-header">
        <div>
          <h1 className="admin-coding-title">Coding Problem Management</h1>
          <p className="admin-coding-desc">
            Author and configure algorithms, starter code templates, sample cases, and hidden judge test cases.
          </p>
        </div>

        <div className="header-actions-wrap">
          <div className="problem-count-badge">
            <span className="count-number">{problemsData.count || 0}</span>
            <span className="count-label">Problems</span>
          </div>

          <button
            type="button"
            className="btn-add-problem"
            onClick={handleOpenCreateProblem}
            id="admin-add-problem-btn"
          >
            <Plus size={16} />
            <span>Add Problem</span>
          </button>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionAlert && (
        <div className={`coding-action-banner banner-${actionAlert.type}`}>
          <div className="banner-content">
            {actionAlert.type === 'success' ? (
              <CheckCircle2 size={18} className="banner-icon-success" />
            ) : (
              <AlertCircle size={18} className="banner-icon-error" />
            )}
            <span>{actionAlert.message}</span>
          </div>
          <button
            type="button"
            className="btn-dismiss-banner"
            onClick={() => setActionAlert(null)}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Controls Card */}
      <div className="coding-controls-card">
        <div className="coding-search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="coding-search-input"
            placeholder="Search problems by title, slug, category, or problem statement..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="admin-coding-search-input"
          />
          {search && (
            <button
              type="button"
              className="btn-clear-search"
              onClick={() => setSearch('')}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="coding-filters-row">
          <div className="filter-group">
            <label className="filter-label" htmlFor="coding-diff-filter">Difficulty</label>
            <select
              id="coding-diff-filter"
              className="coding-filter-select"
              value={difficulty}
              onChange={(e) => {
                setDifficulty(e.target.value);
                setPage(1);
              }}
            >
              {DIFFICULTY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-actions-right">
            <button
              type="button"
              className="btn-refresh-coding"
              onClick={fetchProblems}
              disabled={isLoading}
              title="Refresh list"
            >
              <RefreshCw size={15} className={isLoading ? 'spin-icon' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="coding-error-card">
          <AlertCircle size={20} className="error-icon" />
          <span>{error}</span>
          <button type="button" className="btn-retry" onClick={fetchProblems}>
            Retry
          </button>
        </div>
      )}

      {/* Main Problems Table */}
      {isLoading ? (
        <div className="coding-loading-table">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="problem-skeleton-row">
              <div className="skeleton-line skeleton-col-title" />
              <div className="skeleton-line skeleton-col-pill" />
              <div className="skeleton-line skeleton-col-cat" />
              <div className="skeleton-line skeleton-col-tc" />
              <div className="skeleton-line skeleton-col-actions" />
            </div>
          ))}
        </div>
      ) : problemsData.results.length === 0 ? (
        <div className="coding-empty-card">
          <Code2 size={42} className="empty-icon" />
          <h3>No Coding Problems Found</h3>
          <p>
            {debouncedSearch || difficulty !== 'all' || category !== 'all'
              ? 'No coding problems match your search criteria. Try clearing your filters.'
              : 'No algorithm challenges exist yet. Click "Add Problem" to create the first coding challenge.'}
          </p>
          {(debouncedSearch || difficulty !== 'all' || category !== 'all') ? (
            <button
              type="button"
              className="btn-reset-filters"
              onClick={() => {
                setSearch('');
                setDifficulty('all');
                setCategory('all');
                setPage(1);
              }}
            >
              Clear Filters
            </button>
          ) : (
            <button
              type="button"
              className="btn-add-first-problem"
              onClick={handleOpenCreateProblem}
            >
              <Plus size={16} />
              <span>Add First Problem</span>
            </button>
          )}
        </div>
      ) : (
        <div className="coding-table-container">
          <table className="coding-problems-table">
            <thead>
              <tr>
                <th className="th-order">#</th>
                <th className="th-title">Title & Slug</th>
                <th className="th-difficulty">Difficulty</th>
                <th className="th-category">Category</th>
                <th className="th-cases">Test Cases</th>
                <th className="th-subs">Submissions</th>
                <th className="th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {problemsData.results.map((prob) => (
                <tr key={prob.id} className="problem-table-row">
                  <td className="td-order">{prob.order || prob.id}</td>
                  <td className="td-title">
                    <div className="prob-title-cell">
                      <span className="prob-title-text">{prob.title}</span>
                      <span className="prob-slug-text">/{prob.slug}</span>
                    </div>
                  </td>
                  <td className="td-difficulty">
                    <span className={`diff-badge diff-${prob.difficulty}`}>
                      {prob.difficulty_display || prob.difficulty}
                    </span>
                  </td>
                  <td className="td-category">
                    <span className="category-pill">{prob.category}</span>
                  </td>
                  <td className="td-cases">
                    <button
                      type="button"
                      className="btn-cases-badge"
                      onClick={() => handleOpenTestCases(prob)}
                      title="Manage Test Cases"
                    >
                      <Terminal size={13} />
                      <span>{prob.test_cases_count ?? 0} Cases</span>
                    </button>
                  </td>
                  <td className="td-subs">
                    <span className="subs-count-text">{prob.submissions_count ?? 0}</span>
                  </td>
                  <td className="td-actions">
                    <div className="row-action-btns">
                      <button
                        type="button"
                        className="btn-row-action btn-manage-tc"
                        onClick={() => handleOpenTestCases(prob)}
                        title="Manage Test Cases"
                      >
                        <Terminal size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn-row-action btn-edit-prob"
                        onClick={() => handleOpenEditProblem(prob)}
                        title="Edit Problem"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn-row-action btn-del-prob"
                        onClick={() => setProblemToDelete(prob)}
                        title="Delete Problem"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {!isLoading && problemsData.results.length > 0 && (
        <div className="coding-pagination-bar">
          <div className="pagination-info">
            Showing{' '}
            <strong>
              {(page - 1) * pageSize + 1} -{' '}
              {Math.min(page * pageSize, problemsData.count)}
            </strong>{' '}
            of <strong>{problemsData.count}</strong> coding problems
          </div>

          <div className="pagination-controls">
            <button
              type="button"
              className="btn-page"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              title="Previous Page"
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>

            <span className="page-indicator">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </span>

            <button
              type="button"
              className="btn-page"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              title="Next Page"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit Problem Modal */}
      {isProblemModalOpen && (
        <div className="coding-modal-backdrop" onClick={() => !isSubmittingProblem && setIsProblemModalOpen(false)}>
          <div
            className="coding-modal-container large-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="coding-modal-header">
              <div className="modal-title-wrap">
                <Code2 size={22} className="modal-icon-accent" />
                <h2 className="modal-title">
                  {problemModalMode === 'create' ? 'Create Coding Problem' : 'Edit Coding Problem'}
                </h2>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => !isSubmittingProblem && setIsProblemModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitProblemForm} className="coding-modal-form">
              {problemFormErrors.general && (
                <div className="form-error-banner">
                  <AlertCircle size={16} />
                  <span>{problemFormErrors.general}</span>
                </div>
              )}

              {/* Title & Slug Row */}
              <div className="form-grid-2">
                <div className="form-field-group">
                  <label className="form-label" htmlFor="problem-title-input">
                    Problem Title <span className="required-star">*</span>
                  </label>
                  <input
                    id="problem-title-input"
                    type="text"
                    className={`form-input ${problemFormErrors.title ? 'input-error' : ''}`}
                    placeholder="e.g. Two Sum, Valid Parentheses"
                    value={problemForm.title}
                    onChange={(e) => setProblemForm({ ...problemForm, title: e.target.value })}
                    disabled={isSubmittingProblem}
                    autoFocus
                  />
                  {problemFormErrors.title && (
                    <span className="field-error-text">{problemFormErrors.title}</span>
                  )}
                </div>

                <div className="form-field-group">
                  <label className="form-label" htmlFor="problem-slug-input">
                    URL Slug (Optional, auto-generated)
                  </label>
                  <input
                    id="problem-slug-input"
                    type="text"
                    className="form-input"
                    placeholder="e.g. two-sum, valid-parentheses"
                    value={problemForm.slug}
                    onChange={(e) => setProblemForm({ ...problemForm, slug: e.target.value })}
                    disabled={isSubmittingProblem}
                  />
                </div>
              </div>

              {/* Difficulty, Category, Order Row */}
              <div className="form-grid-3">
                <div className="form-field-group">
                  <label className="form-label" htmlFor="problem-diff-select">Difficulty</label>
                  <select
                    id="problem-diff-select"
                    className="form-input"
                    value={problemForm.difficulty}
                    onChange={(e) => setProblemForm({ ...problemForm, difficulty: e.target.value })}
                    disabled={isSubmittingProblem}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div className="form-field-group">
                  <label className="form-label" htmlFor="problem-cat-input">
                    Category <span className="required-star">*</span>
                  </label>
                  <input
                    id="problem-cat-input"
                    type="text"
                    className={`form-input ${problemFormErrors.category ? 'input-error' : ''}`}
                    placeholder="e.g. Arrays, Strings, Trees"
                    value={problemForm.category}
                    onChange={(e) => setProblemForm({ ...problemForm, category: e.target.value })}
                    disabled={isSubmittingProblem}
                  />
                  {problemFormErrors.category && (
                    <span className="field-error-text">{problemFormErrors.category}</span>
                  )}
                </div>

                <div className="form-field-group">
                  <label className="form-label" htmlFor="problem-order-input">Display Order</label>
                  <input
                    id="problem-order-input"
                    type="number"
                    min="0"
                    className="form-input"
                    value={problemForm.order}
                    onChange={(e) => setProblemForm({ ...problemForm, order: e.target.value })}
                    disabled={isSubmittingProblem}
                  />
                </div>
              </div>

              {/* Problem Statement Description */}
              <div className="form-field-group">
                <label className="form-label" htmlFor="problem-desc-textarea">
                  Problem Statement Description <span className="required-star">*</span>
                </label>
                <textarea
                  id="problem-desc-textarea"
                  rows={4}
                  className={`form-textarea ${problemFormErrors.description ? 'input-error' : ''}`}
                  placeholder="Detailed problem statement, context, and requirements..."
                  value={problemForm.description}
                  onChange={(e) => setProblemForm({ ...problemForm, description: e.target.value })}
                  disabled={isSubmittingProblem}
                />
                {problemFormErrors.description && (
                  <span className="field-error-text">{problemFormErrors.description}</span>
                )}
              </div>

              {/* Input Format, Output Format, Constraints */}
              <div className="form-grid-3">
                <div className="form-field-group">
                  <label className="form-label" htmlFor="problem-input-fmt">Input Format</label>
                  <textarea
                    id="problem-input-fmt"
                    rows={2}
                    className="form-textarea"
                    placeholder="First line contains N..."
                    value={problemForm.input_format}
                    onChange={(e) => setProblemForm({ ...problemForm, input_format: e.target.value })}
                    disabled={isSubmittingProblem}
                  />
                </div>

                <div className="form-field-group">
                  <label className="form-label" htmlFor="problem-output-fmt">Output Format</label>
                  <textarea
                    id="problem-output-fmt"
                    rows={2}
                    className="form-textarea"
                    placeholder="Print the target index..."
                    value={problemForm.output_format}
                    onChange={(e) => setProblemForm({ ...problemForm, output_format: e.target.value })}
                    disabled={isSubmittingProblem}
                  />
                </div>

                <div className="form-field-group">
                  <label className="form-label" htmlFor="problem-constraints">Constraints</label>
                  <textarea
                    id="problem-constraints"
                    rows={2}
                    className="form-textarea"
                    placeholder="1 <= N <= 10^5..."
                    value={problemForm.constraints}
                    onChange={(e) => setProblemForm({ ...problemForm, constraints: e.target.value })}
                    disabled={isSubmittingProblem}
                  />
                </div>
              </div>

              {/* Starter Code Editor Tabs */}
              <div className="starter-code-section">
                <div className="code-tabs-header">
                  <span className="code-tabs-title">Starter Code Templates</span>
                  <div className="code-tabs-nav">
                    <button
                      type="button"
                      className={`code-tab-btn ${activeCodeTab === 'python' ? 'active-tab' : ''}`}
                      onClick={() => setActiveCodeTab('python')}
                    >
                      Python 3
                    </button>
                    <button
                      type="button"
                      className={`code-tab-btn ${activeCodeTab === 'java' ? 'active-tab' : ''}`}
                      onClick={() => setActiveCodeTab('java')}
                    >
                      Java
                    </button>
                    <button
                      type="button"
                      className={`code-tab-btn ${activeCodeTab === 'cpp' ? 'active-tab' : ''}`}
                      onClick={() => setActiveCodeTab('cpp')}
                    >
                      C++
                    </button>
                  </div>
                </div>

                <div className="code-editor-wrapper">
                  <textarea
                    className="code-textarea"
                    rows={6}
                    spellCheck="false"
                    value={problemForm.starter_code[activeCodeTab] || ''}
                    onChange={(e) =>
                      setProblemForm({
                        ...problemForm,
                        starter_code: {
                          ...problemForm.starter_code,
                          [activeCodeTab]: e.target.value,
                        },
                      })
                    }
                    disabled={isSubmittingProblem}
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="modal-actions-bar">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsProblemModalOpen(false)}
                  disabled={isSubmittingProblem}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit"
                  disabled={isSubmittingProblem}
                >
                  {isSubmittingProblem
                    ? 'Saving...'
                    : problemModalMode === 'create'
                    ? 'Create Coding Problem'
                    : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Test Cases Modal */}
      {isTestCaseModalOpen && selectedProblem && (
        <div className="coding-modal-backdrop" onClick={() => setIsTestCaseModalOpen(false)}>
          <div
            className="coding-modal-container test-cases-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="coding-modal-header">
              <div className="modal-title-wrap">
                <Terminal size={20} className="modal-icon-accent" />
                <div>
                  <h2 className="modal-title">
                    Manage Test Cases: <em>{selectedProblem.title}</em>
                  </h2>
                  <span className={`diff-badge diff-${selectedProblem.difficulty}`}>
                    {selectedProblem.difficulty}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setIsTestCaseModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="test-cases-modal-body">
              {/* Existing Test Cases List */}
              <div className="existing-cases-section">
                <h3 className="section-subtitle">
                  Existing Test Cases ({testCasesList.length})
                </h3>

                {isLoadingTestCases ? (
                  <div className="cases-loading">Loading test cases...</div>
                ) : testCasesList.length === 0 ? (
                  <div className="no-cases-card">
                    <p>No test cases exist for this problem yet. Add a sample and hidden test case below.</p>
                  </div>
                ) : (
                  <div className="cases-list-cards">
                    {testCasesList.map((tc, idx) => (
                      <div key={tc.id} className="test-case-card">
                        {editingTestCaseId === tc.id ? (
                          /* Inline Edit Mode */
                          <div className="tc-edit-form">
                            <div className="tc-edit-row">
                              <label className="tc-sample-checkbox">
                                <input
                                  type="checkbox"
                                  checked={editTestCaseForm.is_sample}
                                  onChange={(e) =>
                                    setEditTestCaseForm({
                                      ...editTestCaseForm,
                                      is_sample: e.target.checked,
                                    })
                                  }
                                />
                                <span>Sample Case (Public)</span>
                              </label>

                              <div className="tc-order-input-wrap">
                                <label>Order:</label>
                                <input
                                  type="number"
                                  className="form-input tc-order-input"
                                  value={editTestCaseForm.order}
                                  onChange={(e) =>
                                    setEditTestCaseForm({
                                      ...editTestCaseForm,
                                      order: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            </div>

                            <div className="tc-io-grid">
                              <div>
                                <label className="form-label">Input Data:</label>
                                <textarea
                                  rows={2}
                                  className="code-textarea"
                                  value={editTestCaseForm.input_data}
                                  onChange={(e) =>
                                    setEditTestCaseForm({
                                      ...editTestCaseForm,
                                      input_data: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <label className="form-label">Expected Output:</label>
                                <textarea
                                  rows={2}
                                  className="code-textarea"
                                  value={editTestCaseForm.expected_output}
                                  onChange={(e) =>
                                    setEditTestCaseForm({
                                      ...editTestCaseForm,
                                      expected_output: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            </div>

                            <div className="tc-edit-actions">
                              <button
                                type="button"
                                className="btn-modal-cancel"
                                onClick={() => setEditingTestCaseId(null)}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                className="btn-modal-submit"
                                onClick={() => handleSaveEditTestCase(tc.id)}
                              >
                                Save Case
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* View Mode */
                          <>
                            <div className="tc-header">
                              <div className="tc-badge-wrap">
                                <span className="tc-number">Case #{tc.order || idx + 1}</span>
                                {tc.is_sample ? (
                                  <span className="sample-badge">
                                    <Eye size={12} /> Sample Case
                                  </span>
                                ) : (
                                  <span className="hidden-badge">
                                    <EyeOff size={12} /> Hidden Case
                                  </span>
                                )}
                              </div>

                              <div className="tc-actions">
                                <button
                                  type="button"
                                  className="btn-action-icon"
                                  onClick={() => handleStartEditTestCase(tc)}
                                  title="Edit Test Case"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  type="button"
                                  className="btn-action-icon btn-delete"
                                  onClick={() => handleDeleteTestCase(tc.id)}
                                  title="Delete Test Case"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>

                            <div className="tc-io-preview">
                              <div className="io-box">
                                <span className="io-label">Input:</span>
                                <pre className="io-content">{tc.input_data || '<empty>'}</pre>
                              </div>
                              <div className="io-box">
                                <span className="io-label">Expected Output:</span>
                                <pre className="io-content">{tc.expected_output}</pre>
                              </div>
                            </div>

                            {tc.explanation && (
                              <p className="tc-explanation">
                                <strong>Explanation:</strong> {tc.explanation}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Test Case Form */}
              <div className="add-case-section">
                <h3 className="section-subtitle">Add New Test Case</h3>
                <form onSubmit={handleAddTestCase} className="new-case-form">
                  <div className="form-grid-2">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={testCaseForm.is_sample}
                        onChange={(e) =>
                          setTestCaseForm({ ...testCaseForm, is_sample: e.target.checked })
                        }
                        disabled={isSubmittingTestCase}
                      />
                      <span>Sample Test Case (Visible to candidate in problem description & Run Code)</span>
                    </label>

                    <div className="form-field-group">
                      <label className="form-label" htmlFor="new-tc-order">Order</label>
                      <input
                        id="new-tc-order"
                        type="number"
                        min="1"
                        className="form-input"
                        value={testCaseForm.order}
                        onChange={(e) =>
                          setTestCaseForm({ ...testCaseForm, order: e.target.value })
                        }
                        disabled={isSubmittingTestCase}
                      />
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-field-group">
                      <label className="form-label" htmlFor="new-tc-input">
                        Standard Input Data (stdin)
                      </label>
                      <textarea
                        id="new-tc-input"
                        rows={3}
                        className="code-textarea"
                        placeholder="e.g. 5&#10;1 2 3 4 5"
                        value={testCaseForm.input_data}
                        onChange={(e) =>
                          setTestCaseForm({ ...testCaseForm, input_data: e.target.value })
                        }
                        disabled={isSubmittingTestCase}
                      />
                    </div>

                    <div className="form-field-group">
                      <label className="form-label" htmlFor="new-tc-output">
                        Expected Output (stdout) <span className="required-star">*</span>
                      </label>
                      <textarea
                        id="new-tc-output"
                        rows={3}
                        className="code-textarea"
                        placeholder="e.g. 15"
                        value={testCaseForm.expected_output}
                        onChange={(e) =>
                          setTestCaseForm({ ...testCaseForm, expected_output: e.target.value })
                        }
                        disabled={isSubmittingTestCase}
                      />
                    </div>
                  </div>

                  <div className="form-field-group">
                    <label className="form-label" htmlFor="new-tc-expl">
                      Sample Case Explanation (Optional)
                    </label>
                    <input
                      id="new-tc-expl"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Explanation: 1+2+3+4+5 = 15"
                      value={testCaseForm.explanation}
                      onChange={(e) =>
                        setTestCaseForm({ ...testCaseForm, explanation: e.target.value })
                      }
                      disabled={isSubmittingTestCase}
                    />
                  </div>

                  <div className="add-case-btn-wrap">
                    <button
                      type="submit"
                      className="btn-modal-submit"
                      disabled={isSubmittingTestCase}
                    >
                      <Plus size={15} />
                      <span>{isSubmittingTestCase ? 'Adding...' : 'Add Test Case'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="test-cases-modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setIsTestCaseModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Problem Confirmation Modal */}
      {problemToDelete && (
        <div className="coding-modal-backdrop" onClick={() => !isDeletingProblem && setProblemToDelete(null)}>
          <div
            className="delete-dialog-container"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
          >
            <div className="delete-dialog-header">
              <div className="delete-icon-circle">
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="delete-dialog-title">Delete Coding Problem</h3>
                <p className="delete-dialog-desc">
                  Are you sure you want to permanently delete{' '}
                  <strong>&ldquo;{problemToDelete.title}&rdquo;</strong>?
                </p>
              </div>
            </div>

            <div className="delete-warning-box">
              <AlertCircle size={16} />
              <span>
                All associated test cases and user submissions for this problem will also be removed.
              </span>
            </div>

            <div className="delete-dialog-actions">
              <button
                type="button"
                className="btn-dialog-cancel"
                onClick={() => setProblemToDelete(null)}
                disabled={isDeletingProblem}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-dialog-delete"
                onClick={handleConfirmDeleteProblem}
                disabled={isDeletingProblem}
              >
                {isDeletingProblem ? 'Deleting...' : 'Yes, Delete Problem'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCoding;
