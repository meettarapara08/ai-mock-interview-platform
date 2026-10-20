import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  X,
  Plus,
  Edit2,
  Trash2,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import {
  getAdminJobRoles,
  createAdminJobRole,
  updateAdminJobRole,
  deleteAdminJobRole,
} from '../../api/admin';
import './AdminRoles.css';

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  { value: 'Engineering', label: 'Engineering' },
  { value: 'Data & AI', label: 'Data & AI' },
  { value: 'Cloud & DevOps', label: 'Cloud & DevOps' },
  { value: 'Product & Design', label: 'Product & Design' },
  { value: 'Quality Assurance', label: 'Quality Assurance' },
  { value: 'Security', label: 'Security' },
  { value: 'Management', label: 'Management' },
];

const SUGGESTED_SKILLS = [
  'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Django',
  'Java', 'C++', 'SQL', 'PostgreSQL', 'Docker', 'Kubernetes',
  'AWS', 'Git', 'System Design', 'Algorithms', 'Data Structures',
  'Machine Learning', 'PyTorch', 'REST APIs', 'GraphQL', 'CI/CD'
];

const INITIAL_FORM = {
  title: '',
  category: 'Engineering',
  description: '',
  skills: [],
  is_active: true,
};

export function AdminRoles() {
  // Query state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'true' | 'false'
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);

  // Data state
  const [rolesData, setRolesData] = useState({ count: 0, results: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states: Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [currentRoleId, setCurrentRoleId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [skillInput, setSkillInput] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [roleToDelete, setRoleToDelete] = useState(null);
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

  // Fetch roles
  const fetchRoles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAdminJobRoles({
        page,
        pageSize,
        search: debouncedSearch,
        category,
        isActive: statusFilter,
      });
      setRolesData(data);
    } catch (err) {
      console.error('Failed to load job roles:', err);
      setError(err?.response?.data?.detail || 'Unable to retrieve job roles.');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedSearch, category, statusFilter]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Alert dismiss timer
  useEffect(() => {
    if (!actionAlert) return;
    const timer = setTimeout(() => {
      setActionAlert(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [actionAlert]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setModalMode('create');
    setCurrentRoleId(null);
    setFormData(INITIAL_FORM);
    setSkillInput('');
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (role) => {
    setModalMode('edit');
    setCurrentRoleId(role.id);
    setFormData({
      title: role.title || '',
      category: role.category || 'Engineering',
      description: role.description || '',
      skills: Array.isArray(role.skills) ? [...role.skills] : [],
      is_active: role.is_active !== undefined ? role.is_active : true,
    });
    setSkillInput('');
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Quick toggle active state
  const handleToggleActive = async (role) => {
    try {
      const updated = await updateAdminJobRole(role.id, {
        is_active: !role.is_active,
      });
      setActionAlert({
        type: 'success',
        message: `Job role '${role.title}' marked as ${updated.role?.is_active ? 'active' : 'inactive'}.`,
      });
      fetchRoles();
    } catch (err) {
      console.error('Failed to toggle status:', err);
      setActionAlert({
        type: 'error',
        message: 'Failed to update job role status.',
      });
    }
  };

  // Add skill to form
  const handleAddSkill = (skillToAdd) => {
    const trimmed = (skillToAdd || skillInput).trim();
    if (!trimmed) return;
    if (formData.skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setSkillInput('');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      skills: [...prev.skills, trimmed],
    }));
    setSkillInput('');
  };

  const handleRemoveSkill = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  // Form submit
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = 'Job role title is required.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    try {
      const payload = {
        title: formData.title.trim(),
        category: formData.category.trim() || 'Engineering',
        description: formData.description.trim(),
        skills: formData.skills,
        is_active: formData.is_active,
      };

      if (modalMode === 'create') {
        await createAdminJobRole(payload);
        setActionAlert({
          type: 'success',
          message: `Job role '${payload.title}' created successfully and linked to interview setup.`,
        });
      } else {
        await updateAdminJobRole(currentRoleId, payload);
        setActionAlert({
          type: 'success',
          message: `Job role '${payload.title}' updated successfully.`,
        });
      }

      setIsModalOpen(false);
      fetchRoles();
    } catch (err) {
      console.error('Failed to save job role:', err);
      const apiErrors = err?.response?.data || {};
      if (typeof apiErrors === 'object') {
        const mappedErrors = {};
        Object.entries(apiErrors).forEach(([k, v]) => {
          mappedErrors[k] = Array.isArray(v) ? v[0] : String(v);
        });
        setFormErrors(mappedErrors);
      } else {
        setFormErrors({ general: 'Failed to save job role. Please check your connection.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Action
  const handleConfirmDelete = async () => {
    if (!roleToDelete) return;
    setIsDeleting(true);
    try {
      await deleteAdminJobRole(roleToDelete.id);
      setActionAlert({
        type: 'success',
        message: `Job role '${roleToDelete.title}' has been deleted.`,
      });
      setRoleToDelete(null);
      fetchRoles();
    } catch (err) {
      console.error('Failed to delete job role:', err);
      setActionAlert({
        type: 'error',
        message: err?.response?.data?.detail || 'Unable to delete job role.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = Math.ceil(rolesData.count / pageSize) || 1;

  return (
    <div className="admin-roles-page">
      {/* Header */}
      <div className="admin-roles-header">
        <div>
          <h1 className="admin-roles-title">Job Roles & Skills Management</h1>
          <p className="admin-roles-desc">
            Configure industry job roles and associate recommended technical and behavioral skills for mock interviews.
          </p>
        </div>

        <div className="header-actions-wrap">
          <div className="role-count-badge">
            <span className="count-number">{rolesData.count || 0}</span>
            <span className="count-label">Roles</span>
          </div>

          <button
            type="button"
            className="btn-add-role"
            onClick={handleOpenCreate}
            id="admin-add-role-btn"
          >
            <Plus size={16} />
            <span>Add Job Role</span>
          </button>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionAlert && (
        <div className={`roles-action-banner banner-${actionAlert.type}`}>
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

      {/* Search and Filters Card */}
      <div className="roles-controls-card">
        <div className="roles-search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="roles-search-input"
            placeholder="Search by role title, category, description, or skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="admin-roles-search-input"
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

        <div className="roles-filters-row">
          <div className="filter-group">
            <label className="filter-label" htmlFor="role-category-filter">Category</label>
            <select
              id="role-category-filter"
              className="roles-filter-select"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label" htmlFor="role-status-filter">Status</label>
            <select
              id="role-status-filter"
              className="roles-filter-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Statuses</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>

          <div className="filter-actions-right">
            <button
              type="button"
              className="btn-refresh-roles"
              onClick={fetchRoles}
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
        <div className="roles-error-card">
          <AlertCircle size={20} className="error-icon" />
          <span>{error}</span>
          <button type="button" className="btn-retry" onClick={fetchRoles}>
            Retry
          </button>
        </div>
      )}

      {/* Main Grid View */}
      {isLoading ? (
        <div className="roles-loading-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="role-skeleton-card">
              <div className="skeleton-line skeleton-title" />
              <div className="skeleton-line skeleton-pill" />
              <div className="skeleton-line skeleton-desc" />
              <div className="skeleton-chips">
                <div className="skeleton-chip" />
                <div className="skeleton-chip" />
                <div className="skeleton-chip" />
              </div>
            </div>
          ))}
        </div>
      ) : rolesData.results.length === 0 ? (
        <div className="roles-empty-card">
          <Briefcase size={40} className="empty-icon" />
          <h3>No Job Roles Found</h3>
          <p>
            {debouncedSearch || category !== 'all' || statusFilter !== 'all'
              ? 'No job roles matched your filter criteria. Try clearing some filters.'
              : 'No job roles configured yet. Click "Add Job Role" to create the first one.'}
          </p>
          {(debouncedSearch || category !== 'all' || statusFilter !== 'all') ? (
            <button
              type="button"
              className="btn-reset-filters"
              onClick={() => {
                setSearch('');
                setCategory('all');
                setStatusFilter('all');
                setPage(1);
              }}
            >
              Clear Filters
            </button>
          ) : (
            <button
              type="button"
              className="btn-add-first-role"
              onClick={handleOpenCreate}
            >
              <Plus size={16} />
              <span>Add First Job Role</span>
            </button>
          )}
        </div>
      ) : (
        <div className="roles-grid">
          {rolesData.results.map((role) => (
            <div
              key={role.id}
              className={`role-card ${role.is_active ? 'role-active' : 'role-inactive'}`}
            >
              <div className="role-card-header">
                <div className="role-card-title-wrap">
                  <h3 className="role-title" title={role.title}>{role.title}</h3>
                  <span className="role-category-pill">{role.category || 'Engineering'}</span>
                </div>

                <button
                  type="button"
                  className={`status-toggle-btn ${role.is_active ? 'status-active' : 'status-inactive'}`}
                  onClick={() => handleToggleActive(role)}
                  title={role.is_active ? 'Active in Interview Setup (Click to deactivate)' : 'Inactive (Click to activate)'}
                >
                  {role.is_active ? (
                    <>
                      <ToggleRight size={18} />
                      <span>Active</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft size={18} />
                      <span>Inactive</span>
                    </>
                  )}
                </button>
              </div>

              {role.description ? (
                <p className="role-description">{role.description}</p>
              ) : (
                <p className="role-description placeholder-desc">No detailed description provided.</p>
              )}

              <div className="role-skills-section">
                <div className="skills-header">
                  <span className="skills-label">
                    <Sparkles size={13} />
                    <span>Associated Skills ({Array.isArray(role.skills) ? role.skills.length : 0})</span>
                  </span>
                </div>

                <div className="skills-tags-wrap">
                  {Array.isArray(role.skills) && role.skills.length > 0 ? (
                    <>
                      {role.skills.slice(0, 6).map((skill, idx) => (
                        <span key={idx} className="skill-chip">
                          {skill}
                        </span>
                      ))}
                      {role.skills.length > 6 && (
                        <span className="skill-chip more-chip">
                          +{role.skills.length - 6} more
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="no-skills-text">No skill tags configured</span>
                  )}
                </div>
              </div>

              <div className="role-card-footer">
                <span className="role-slug-code" title={`Slug: ${role.slug}`}>
                  slug: {role.slug}
                </span>

                <div className="role-actions">
                  <button
                    type="button"
                    className="btn-action-icon btn-edit"
                    onClick={() => handleOpenEdit(role)}
                    title="Edit Job Role"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    type="button"
                    className="btn-action-icon btn-delete"
                    onClick={() => setRoleToDelete(role)}
                    title="Delete Job Role"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      {!isLoading && rolesData.results.length > 0 && (
        <div className="roles-pagination-bar">
          <div className="pagination-info">
            Showing{' '}
            <strong>
              {(page - 1) * pageSize + 1} -{' '}
              {Math.min(page * pageSize, rolesData.count)}
            </strong>{' '}
            of <strong>{rolesData.count}</strong> job roles
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

      {/* Create / Edit Job Role Modal */}
      {isModalOpen && (
        <div className="roles-modal-backdrop" onClick={() => !isSubmitting && setIsModalOpen(false)}>
          <div
            className="roles-modal-container"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="roles-modal-header">
              <div className="modal-title-wrap">
                <Briefcase size={20} className="modal-icon-accent" />
                <h2 className="modal-title">
                  {modalMode === 'create' ? 'Add New Job Role' : 'Edit Job Role'}
                </h2>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => !isSubmitting && setIsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="roles-modal-form">
              {formErrors.general && (
                <div className="form-error-banner">
                  <AlertCircle size={16} />
                  <span>{formErrors.general}</span>
                </div>
              )}

              {/* Title Input */}
              <div className="form-field-group">
                <label className="form-label" htmlFor="role-title-input">
                  Job Role Title <span className="required-star">*</span>
                </label>
                <input
                  id="role-title-input"
                  type="text"
                  className={`form-input ${formErrors.title ? 'input-error' : ''}`}
                  placeholder="e.g. AI/ML Engineer, Cloud Security Specialist"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  disabled={isSubmitting}
                  autoFocus
                />
                {formErrors.title && <span className="field-error-text">{formErrors.title}</span>}
              </div>

              {/* Category Select */}
              <div className="form-field-group">
                <label className="form-label" htmlFor="role-category-input">Category</label>
                <select
                  id="role-category-input"
                  className="form-input"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  disabled={isSubmitting}
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Data & AI">Data & AI</option>
                  <option value="Cloud & DevOps">Cloud & DevOps</option>
                  <option value="Product & Design">Product & Design</option>
                  <option value="Quality Assurance">Quality Assurance</option>
                  <option value="Security">Security</option>
                  <option value="Management">Management</option>
                </select>
              </div>

              {/* Description Textarea */}
              <div className="form-field-group">
                <label className="form-label" htmlFor="role-desc-input">
                  Role Description & Scope (Optional)
                </label>
                <textarea
                  id="role-desc-input"
                  rows={3}
                  className="form-textarea"
                  placeholder="Brief summary of duties, typical tech stack, or expectations..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              {/* Skills Tag Input */}
              <div className="form-field-group">
                <label className="form-label" htmlFor="role-skill-input">
                  Required & Recommended Skills
                </label>
                <div className="skill-input-container">
                  <input
                    id="role-skill-input"
                    type="text"
                    className="skill-text-input"
                    placeholder="Type skill and press Enter or comma..."
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleSkillKeyDown}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="btn-add-skill-tag"
                    onClick={() => handleAddSkill()}
                    disabled={!skillInput.trim() || isSubmitting}
                  >
                    Add
                  </button>
                </div>

                {/* Selected Skills Chips */}
                <div className="modal-skills-chips">
                  {formData.skills.map((skill, idx) => (
                    <span key={idx} className="modal-skill-pill">
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(idx)}
                        disabled={isSubmitting}
                        className="btn-remove-pill"
                        title="Remove skill"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {formData.skills.length === 0 && (
                    <span className="no-skills-hint">No skills added yet. Use quick-add suggestions below:</span>
                  )}
                </div>

                {/* Popular Skill Suggestions */}
                <div className="skills-suggestions-box">
                  <span className="suggestions-label">Quick Suggestions:</span>
                  <div className="suggestions-pills">
                    {SUGGESTED_SKILLS.filter(
                      (s) => !formData.skills.some((curr) => curr.toLowerCase() === s.toLowerCase())
                    )
                      .slice(0, 10)
                      .map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="btn-suggestion-pill"
                          onClick={() => handleAddSkill(s)}
                          disabled={isSubmitting}
                        >
                          +{s}
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              {/* Active Toggle Checkbox */}
              <div className="form-field-checkbox">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    disabled={isSubmitting}
                  />
                  <span>Active & Visible in Candidate Interview Setup</span>
                </label>
                <p className="checkbox-hint">
                  When enabled, this job role immediately appears in the user-facing interview setup dropdown.
                </p>
              </div>

              {/* Form Buttons */}
              <div className="modal-actions-bar">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : modalMode === 'create' ? 'Create Job Role' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {roleToDelete && (
        <div className="roles-modal-backdrop" onClick={() => !isDeleting && setRoleToDelete(null)}>
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
                <h3 className="delete-dialog-title">Delete Job Role</h3>
                <p className="delete-dialog-desc">
                  Are you sure you want to permanently delete the job role{' '}
                  <strong>&ldquo;{roleToDelete.title}&rdquo;</strong>?
                </p>
              </div>
            </div>

            <div className="delete-warning-box">
              <AlertCircle size={16} />
              <span>
                Candidates will no longer be able to select this role for new mock interviews.
              </span>
            </div>

            <div className="delete-dialog-actions">
              <button
                type="button"
                className="btn-dialog-cancel"
                onClick={() => setRoleToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-dialog-delete"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminRoles;
