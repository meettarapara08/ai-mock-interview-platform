import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  X,
  Plus,
  Edit2,
  Trash2,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  getAdminQuestions,
  createAdminQuestion,
  updateAdminQuestion,
  deleteAdminQuestion,
} from '../../api/admin';
import './AdminQuestions.css';

const INTERVIEW_TYPE_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  { value: 'technical', label: 'Technical' },
  { value: 'behavioral', label: 'Behavioral' },
  { value: 'hr', label: 'HR' },
  { value: 'managerial', label: 'Managerial' },
  { value: 'resume', label: 'Resume-Based' },
];

const DIFFICULTY_OPTIONS = [
  { value: 'all', label: 'All Difficulties' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

const INITIAL_FORM = {
  interview_type: 'technical',
  difficulty: 'medium',
  job_role: 'General',
  category: '',
  question_text: '',
};

export function AdminQuestions() {
  // Query state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [interviewType, setInterviewType] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Data state
  const [questionsData, setQuestionsData] = useState({ count: 0, results: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states: Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [currentQuestionId, setCurrentQuestionId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [questionToDelete, setQuestionToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Fetch questions
  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAdminQuestions({
        page,
        pageSize,
        search: debouncedSearch,
        interviewType,
        difficulty,
      });
      setQuestionsData(data);
    } catch (err) {
      console.error('Failed to load questions:', err);
      setError(err?.response?.data?.detail || 'Unable to retrieve question bank items.');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedSearch, interviewType, difficulty]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setModalMode('create');
    setCurrentQuestionId(null);
    setFormData(INITIAL_FORM);
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (q) => {
    setModalMode('edit');
    setCurrentQuestionId(q.id);
    setFormData({
      interview_type: q.interview_type,
      difficulty: q.difficulty,
      job_role: q.job_role || 'General',
      category: q.category || '',
      question_text: q.question_text || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData(INITIAL_FORM);
    setFormErrors({});
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.question_text || formData.question_text.trim().length < 5) {
      errors.question_text = 'Question text must be at least 5 characters long.';
    }
    if (!formData.interview_type) {
      errors.interview_type = 'Please select an interview category.';
    }
    if (!formData.difficulty) {
      errors.difficulty = 'Please select a difficulty level.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Create / Edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setActionAlert(null);
    try {
      const payload = {
        interview_type: formData.interview_type,
        difficulty: formData.difficulty,
        job_role: formData.job_role.trim() || 'General',
        category: formData.category.trim(),
        question_text: formData.question_text.trim(),
      };

      if (modalMode === 'create') {
        const res = await createAdminQuestion(payload);
        setActionAlert({ type: 'success', text: res.message || 'Question created successfully.' });
      } else {
        const res = await updateAdminQuestion(currentQuestionId, payload);
        setActionAlert({ type: 'success', text: res.message || 'Question updated successfully.' });
      }

      handleCloseModal();
      fetchQuestions();
    } catch (err) {
      console.error('Save question error:', err);
      const serverErrors = err?.response?.data;
      if (typeof serverErrors === 'object' && serverErrors !== null) {
        setFormErrors(serverErrors);
      } else {
        setActionAlert({ type: 'error', text: 'Failed to save question. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm and delete question
  const handleDeleteConfirm = async () => {
    if (!questionToDelete) return;
    setIsDeleting(true);
    setActionAlert(null);
    try {
      const res = await deleteAdminQuestion(questionToDelete.id);
      setActionAlert({ type: 'success', text: res.message || 'Question removed successfully.' });
      setQuestionToDelete(null);
      fetchQuestions();
    } catch (err) {
      console.error('Delete question error:', err);
      setActionAlert({
        type: 'error',
        text: err?.response?.data?.detail || 'Failed to delete question.',
      });
      setQuestionToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = Math.ceil((questionsData?.count || 0) / pageSize) || 1;

  const getTypeColorClass = (type) => {
    const map = {
      technical: 'tag-indigo',
      behavioral: 'tag-cyan',
      hr: 'tag-amber',
      managerial: 'tag-purple',
      resume: 'tag-green',
    };
    return map[type] || 'tag-secondary';
  };

  const getDifficultyColorClass = (diff) => {
    const map = {
      easy: 'diff-easy',
      medium: 'diff-medium',
      hard: 'diff-hard',
    };
    return map[diff] || 'diff-medium';
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="admin-questions-page">
      {/* Top Header */}
      <div className="admin-questions-header">
        <div>
          <h1 className="admin-questions-title">Question Bank Management</h1>
          <p className="admin-questions-desc">
            Manage pre-defined and fallback interview questions used when evaluating candidates or offline modes.
          </p>
        </div>

        <div className="header-actions-wrap">
          <div className="question-count-badge">
            <span className="count-number">{questionsData?.count ?? 0}</span>
            <span className="count-label">Total Questions</span>
          </div>
          <button
            type="button"
            className="btn-add-question"
            onClick={handleOpenCreate}
          >
            <Plus size={16} />
            <span>Add Question</span>
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionAlert && (
        <div className={`action-alert-banner alert-${actionAlert.type}`}>
          {actionAlert.type === 'success' ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{actionAlert.text}</span>
          <button
            type="button"
            className="alert-close-btn"
            onClick={() => setActionAlert(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="questions-controls-card">
        {/* Search */}
        <div className="questions-search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="questions-search-input"
            placeholder="Search questions by text keyword, role, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="questions-filters-row">
          <div className="filter-group">
            <span className="filter-label">Interview Category:</span>
            <select
              className="filter-select"
              value={interviewType}
              onChange={(e) => {
                setInterviewType(e.target.value);
                setPage(1);
              }}
            >
              {INTERVIEW_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <span className="filter-label">Difficulty:</span>
            <select
              className="filter-select"
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

          <div className="filter-group" style={{ marginLeft: 'auto' }}>
            <span className="filter-label">Per page:</span>
            <select
              className="filter-select"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Questions List Card */}
      <div className="questions-content-card">
        {isLoading ? (
          <div className="questions-loading-state">
            <div className="admin-loading-spinner" />
            <span>Loading question bank...</span>
          </div>
        ) : error ? (
          <div className="questions-error-state">
            <AlertCircle size={32} />
            <p>{error}</p>
            <button
              type="button"
              className="questions-retry-btn"
              onClick={fetchQuestions}
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        ) : questionsData.results.length === 0 ? (
          <div className="questions-empty-state">
            <HelpCircle size={36} className="empty-icon" />
            <h3>No Questions Found</h3>
            <p>No questions matched your search criteria. Try clearing filters or add a new question.</p>
            <button
              type="button"
              className="btn-add-question"
              style={{ marginTop: '12px' }}
              onClick={handleOpenCreate}
            >
              <Plus size={16} />
              <span>Add Your First Question</span>
            </button>
          </div>
        ) : (
          <div className="questions-list">
            {questionsData.results.map((q) => (
              <div key={q.id} className="question-card-item">
                <div className="question-item-header">
                  <div className="question-tags-row">
                    <span className={`type-tag ${getTypeColorClass(q.interview_type)}`}>
                      {q.interview_type_display || q.interview_type}
                    </span>
                    <span className={`diff-pill ${getDifficultyColorClass(q.difficulty)}`}>
                      {q.difficulty_display || q.difficulty}
                    </span>
                    <span className="role-tag">
                      <Briefcase size={12} />
                      <span>{q.job_role || 'General'}</span>
                    </span>
                    {q.category && (
                      <span className="category-tag">
                        <Layers size={12} />
                        <span>{q.category}</span>
                      </span>
                    )}
                  </div>

                  <div className="question-item-actions">
                    <button
                      type="button"
                      className="btn-item-action btn-edit"
                      onClick={() => handleOpenEdit(q)}
                      title="Edit question details"
                    >
                      <Edit2 size={14} />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      className="btn-item-action btn-delete"
                      onClick={() => setQuestionToDelete(q)}
                      title="Delete question from bank"
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                <div className="question-item-text">
                  {q.question_text}
                </div>

                <div className="question-item-footer">
                  <span className="question-date">Added {formatDate(q.created_at)}</span>
                  <span className="question-id-sub">Question #{q.id}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        {!isLoading && !error && questionsData.results.length > 0 && (
          <div className="admin-pagination-bar">
            <span className="pagination-info">
              Showing page {page} of {totalPages} ({questionsData.count} total questions)
            </span>

            <div className="pagination-buttons">
              <button
                type="button"
                className="pagination-btn"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>
              <button
                type="button"
                className="pagination-btn"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Question Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div className="question-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <Sparkles size={20} className="modal-icon" />
                <h2 className="modal-title">
                  {modalMode === 'create' ? 'Add New Interview Question' : `Edit Question #${currentQuestionId}`}
                </h2>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={handleCloseModal}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form-body">
              {/* Type and Difficulty Selects */}
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="q-type">
                    Interview Category <span className="req-star">*</span>
                  </label>
                  <select
                    id="q-type"
                    className="form-select"
                    value={formData.interview_type}
                    onChange={(e) => setFormData({ ...formData, interview_type: e.target.value })}
                  >
                    <option value="technical">Technical</option>
                    <option value="behavioral">Behavioral</option>
                    <option value="hr">HR</option>
                    <option value="managerial">Managerial</option>
                    <option value="resume">Resume-Based</option>
                  </select>
                  {formErrors.interview_type && (
                    <span className="field-error">{formErrors.interview_type}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="q-diff">
                    Difficulty Level <span className="req-star">*</span>
                  </label>
                  <select
                    id="q-diff"
                    className="form-select"
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                  {formErrors.difficulty && (
                    <span className="field-error">{formErrors.difficulty}</span>
                  )}
                </div>
              </div>

              {/* Role and Category Inputs */}
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="q-role">
                    Target Job Role
                  </label>
                  <input
                    id="q-role"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Software Engineer, Frontend Developer, General"
                    value={formData.job_role}
                    onChange={(e) => setFormData({ ...formData, job_role: e.target.value })}
                  />
                  <span className="input-hint">Default is "General" if applicable to all roles</span>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="q-category">
                    Topic / Sub-Category
                  </label>
                  <input
                    id="q-category"
                    type="text"
                    className="form-input"
                    placeholder="e.g. System Design, Databases, Leadership"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
              </div>

              {/* Question Text */}
              <div className="form-group">
                <div className="label-with-count">
                  <label className="form-label" htmlFor="q-text">
                    Question Statement <span className="req-star">*</span>
                  </label>
                  <span className="char-count">
                    {formData.question_text.length} characters
                  </span>
                </div>
                <textarea
                  id="q-text"
                  className="form-textarea"
                  rows={4}
                  placeholder="Enter the complete question prompt that candidates will be asked..."
                  value={formData.question_text}
                  onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                />
                {formErrors.question_text && (
                  <span className="field-error">{formErrors.question_text}</span>
                )}
              </div>

              {/* Modal Actions */}
              <div className="modal-actions-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? 'Saving...'
                    : (modalMode === 'create' ? 'Create Question' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {questionToDelete && (
        <div className="modal-backdrop" onClick={() => !isDeleting && setQuestionToDelete(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon-danger">
              <Trash2 size={26} />
            </div>
            <h3 className="confirm-title">Delete Question #{questionToDelete.id}?</h3>
            <p className="confirm-desc">
              Are you sure you want to permanently delete this question from the bank?
              <br />
              <em>"{questionToDelete.question_text.slice(0, 100)}..."</em>
            </p>

            <div className="confirm-actions">
              <button
                type="button"
                className="btn-confirm-cancel"
                onClick={() => setQuestionToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-confirm-delete"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Question'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminQuestions;
