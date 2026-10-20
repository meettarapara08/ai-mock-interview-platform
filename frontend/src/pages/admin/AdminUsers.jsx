import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  X,
  UserCheck,
  UserX,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Briefcase,
  Terminal,
} from 'lucide-react';
import { getAdminUsers, getAdminUserDetail, toggleUserStatus } from '../../api/admin';
import { useAuth } from '../../context/AuthContext';
import './AdminUsers.css';

export function AdminUsers() {
  const { user: currentAdmin } = useAuth();

  // Query states
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Data states
  const [usersData, setUsersData] = useState({ count: 0, results: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Detail Modal state
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState(null);

  // Confirm Modal state
  const [confirmUser, setConfirmUser] = useState(null);
  const [isToggling, setIsToggling] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch users list
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAdminUsers({
        page,
        pageSize,
        search: debouncedSearch,
        status: statusFilter,
        role: roleFilter,
      });
      setUsersData(data);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError(err?.response?.data?.detail || 'Failed to fetch candidate directory.');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedSearch, statusFilter, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Fetch detail modal
  const handleOpenDetail = async (userId) => {
    setSelectedUserId(userId);
    setUserDetail(null);
    setIsLoadingDetail(true);
    setDetailError(null);
    try {
      const detail = await getAdminUserDetail(userId);
      setUserDetail(detail);
    } catch (err) {
      console.error('Failed to fetch user details:', err);
      setDetailError(err?.response?.data?.detail || 'Failed to load user profile information.');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedUserId(null);
    setUserDetail(null);
  };

  // Toggle user active status
  const handleToggleConfirm = async () => {
    if (!confirmUser) return;
    setIsToggling(true);
    setActionMessage(null);
    try {
      const res = await toggleUserStatus(confirmUser.id);
      setActionMessage({ type: 'success', text: res.message });
      setConfirmUser(null);
      fetchUsers();
      if (selectedUserId === confirmUser.id) {
        handleOpenDetail(confirmUser.id);
      }
    } catch (err) {
      console.error('Toggle status error:', err);
      setActionMessage({
        type: 'error',
        text: err?.response?.data?.detail || 'Failed to update user account status.',
      });
      setConfirmUser(null);
    } finally {
      setIsToggling(false);
    }
  };

  const totalPages = Math.ceil((usersData?.count || 0) / pageSize) || 1;

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
    <div className="admin-users-page">
      {/* Page Title & Stats */}
      <div className="admin-users-header">
        <div>
          <h1 className="admin-users-title">Candidate & User Management</h1>
          <p className="admin-users-desc">
            Review registered candidates, inspect profile information, and manage user access statuses.
          </p>
        </div>

        <div className="admin-users-header-badge">
          <span className="badge-total">{usersData?.count ?? 0}</span>
          <span className="badge-label">Total Users</span>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div className={`action-alert-banner alert-${actionMessage.type}`}>
          {actionMessage.type === 'success' ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{actionMessage.text}</span>
          <button
            type="button"
            className="alert-close-btn"
            onClick={() => setActionMessage(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Controls Bar: Search & Filters */}
      <div className="admin-users-controls-card">
        {/* Search Input */}
        <div className="users-search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="users-search-input"
            placeholder="Search by candidate name, username, email, or role..."
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

        {/* Filter Pills */}
        <div className="users-filters-row">
          <div className="filter-group">
            <span className="filter-group-label">Status:</span>
            <div className="filter-pills">
              <button
                type="button"
                className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => { setStatusFilter('all'); setPage(1); }}
              >
                All
              </button>
              <button
                type="button"
                className={`filter-btn ${statusFilter === 'active' ? 'active' : ''}`}
                onClick={() => { setStatusFilter('active'); setPage(1); }}
              >
                Active
              </button>
              <button
                type="button"
                className={`filter-btn ${statusFilter === 'inactive' ? 'active' : ''}`}
                onClick={() => { setStatusFilter('inactive'); setPage(1); }}
              >
                Deactivated
              </button>
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-group-label">Role:</span>
            <div className="filter-pills">
              <button
                type="button"
                className={`filter-btn ${roleFilter === 'all' ? 'active' : ''}`}
                onClick={() => { setRoleFilter('all'); setPage(1); }}
              >
                All
              </button>
              <button
                type="button"
                className={`filter-btn ${roleFilter === 'candidate' ? 'active' : ''}`}
                onClick={() => { setRoleFilter('candidate'); setPage(1); }}
              >
                Candidates
              </button>
              <button
                type="button"
                className={`filter-btn ${roleFilter === 'staff' ? 'active' : ''}`}
                onClick={() => { setRoleFilter('staff'); setPage(1); }}
              >
                Staff
              </button>
            </div>
          </div>

          <div className="filter-group" style={{ marginLeft: 'auto' }}>
            <span className="filter-group-label">Per page:</span>
            <select
              className="users-per-page-select"
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

      {/* Main Users Table */}
      <div className="admin-users-table-card">
        {isLoading ? (
          <div className="users-loading-state">
            <div className="admin-loading-spinner" />
            <span>Retrieving candidate directory...</span>
          </div>
        ) : error ? (
          <div className="users-error-state">
            <AlertCircle size={32} className="error-icon" />
            <p>{error}</p>
            <button
              type="button"
              className="users-retry-btn"
              onClick={fetchUsers}
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        ) : usersData.results.length === 0 ? (
          <div className="users-empty-state">
            <UserX size={36} className="empty-icon" />
            <h3>No Candidates Found</h3>
            <p>No user accounts matched the current search or filter criteria.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>User / Candidate</th>
                  <th>Target Role & Exp</th>
                  <th>Activity</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersData.results.map((u) => {
                  const initials = (u.first_name?.[0] || u.username?.[0] || 'U').toUpperCase();
                  const fullName = u.first_name
                    ? `${u.first_name} ${u.last_name || ''}`.trim()
                    : u.username;
                  const isCurrentAdmin = currentAdmin?.id === u.id;

                  return (
                    <tr key={u.id}>
                      {/* User Cell */}
                      <td>
                        <div className="user-primary-cell">
                          <div className="user-avatar-circle">
                            {initials}
                          </div>
                          <div className="user-text-info">
                            <div className="user-name-row">
                              <span className="user-full-name">{fullName}</span>
                              {u.is_superuser && (
                                <span className="role-tag superuser-tag">Superuser</span>
                              )}
                              {!u.is_superuser && u.is_staff && (
                                <span className="role-tag staff-tag">Staff</span>
                              )}
                            </div>
                            <span className="user-meta-sub">
                              @{u.username} • {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Target Role & Exp */}
                      <td>
                        <div className="role-exp-cell">
                          <span className="target-role-badge">
                            {u.target_role || 'Software Engineer'}
                          </span>
                          <span className="exp-level-sub">
                            {u.experience_level?.toUpperCase() || 'ENTRY'}
                          </span>
                        </div>
                      </td>

                      {/* Activity */}
                      <td>
                        <div className="activity-cell">
                          <span className="activity-stat" title="Total completed or in-progress interviews">
                            <Briefcase size={14} />
                            <span>{u.interviews_count} interviews</span>
                          </span>
                          <span className="activity-stat" title="Total code submissions">
                            <Terminal size={14} />
                            <span>{u.submissions_count} code subs</span>
                          </span>
                        </div>
                      </td>

                      {/* Joined Date */}
                      <td className="date-cell">
                        {formatDate(u.date_joined)}
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`status-pill ${u.is_active ? 'badge-success' : 'badge-danger'}`}>
                          {u.is_active ? 'Active' : 'Deactivated'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="row-actions-group">
                          <button
                            type="button"
                            className="btn-action btn-view"
                            onClick={() => handleOpenDetail(u.id)}
                            title="Inspect candidate profile and recent activity"
                          >
                            <Eye size={15} />
                            <span>Inspect</span>
                          </button>

                          <button
                            type="button"
                            className={`btn-action ${u.is_active ? 'btn-deactivate' : 'btn-activate'}`}
                            onClick={() => setConfirmUser(u)}
                            disabled={isCurrentAdmin}
                            title={isCurrentAdmin ? "You cannot deactivate yourself" : (u.is_active ? "Deactivate user account" : "Activate user account")}
                          >
                            {u.is_active ? <UserX size={15} /> : <UserCheck size={15} />}
                            <span>{u.is_active ? 'Deactivate' : 'Activate'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {!isLoading && !error && usersData.results.length > 0 && (
          <div className="admin-pagination-bar">
            <span className="pagination-info">
              Showing page {page} of {totalPages} ({usersData.count} total candidates)
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

      {/* Candidate Profile Detail Modal */}
      {selectedUserId && (
        <div className="modal-backdrop" onClick={handleCloseDetail}>
          <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="detail-modal-header">
              <div className="modal-header-user">
                <div className="modal-avatar">
                  {(userDetail?.first_name?.[0] || userDetail?.username?.[0] || 'U').toUpperCase()}
                </div>
                <div>
                  <h2 className="modal-user-name">
                    {userDetail?.first_name ? `${userDetail.first_name} ${userDetail.last_name || ''}` : userDetail?.username}
                  </h2>
                  <span className="modal-user-sub">
                    @{userDetail?.username} • {userDetail?.email}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={handleCloseDetail}
              >
                <X size={20} />
              </button>
            </div>

            <div className="detail-modal-body">
              {isLoadingDetail ? (
                <div className="modal-loading">
                  <div className="admin-loading-spinner" />
                  <span>Loading profile data...</span>
                </div>
              ) : detailError ? (
                <div className="modal-error">
                  <AlertCircle size={24} />
                  <span>{detailError}</span>
                </div>
              ) : userDetail ? (
                <div className="modal-content-grid">
                  {/* Account overview section */}
                  <div className="modal-card">
                    <h3 className="modal-card-title">Profile & Credentials</h3>
                    <div className="profile-attributes-grid">
                      <div className="attr-item">
                        <span className="attr-label">Target Role</span>
                        <span className="attr-value">{userDetail.profile?.target_role || 'Not specified'}</span>
                      </div>
                      <div className="attr-item">
                        <span className="attr-label">Experience Level</span>
                        <span className="attr-value capitalize">{userDetail.profile?.experience_level || 'Entry'}</span>
                      </div>
                      <div className="attr-item">
                        <span className="attr-label">Education</span>
                        <span className="attr-value">{userDetail.profile?.education || 'Not specified'}</span>
                      </div>
                      <div className="attr-item">
                        <span className="attr-label">Phone</span>
                        <span className="attr-value">{userDetail.profile?.phone || 'Not specified'}</span>
                      </div>
                      <div className="attr-item">
                        <span className="attr-label">Account Status</span>
                        <span className={`status-pill ${userDetail.is_active ? 'badge-success' : 'badge-danger'}`}>
                          {userDetail.is_active ? 'Active' : 'Deactivated'}
                        </span>
                      </div>
                      <div className="attr-item">
                        <span className="attr-label">Account Type</span>
                        <span className="attr-value">
                          {userDetail.is_superuser ? 'Superuser' : userDetail.is_staff ? 'Staff Admin' : 'Candidate'}
                        </span>
                      </div>
                    </div>

                    {userDetail.profile?.bio && (
                      <div className="profile-bio-box">
                        <span className="attr-label">Candidate Bio</span>
                        <p className="bio-text">{userDetail.profile.bio}</p>
                      </div>
                    )}

                    {userDetail.profile?.skills && (
                      <div className="profile-skills-box">
                        <span className="attr-label">Declared Skills</span>
                        <div className="skills-chips-row">
                          {userDetail.profile.skills.split(',').map((s, idx) => (
                            <span key={idx} className="skill-chip">
                              {s.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Recent Activity Section */}
                  <div className="modal-card">
                    <h3 className="modal-card-title">
                      Recent Activity ({userDetail.interviews_count} Interviews • {userDetail.submissions_count} Submissions)
                    </h3>

                    {/* Recent Interviews */}
                    <div className="modal-activity-group">
                      <h4 className="group-heading">Latest Interviews</h4>
                      {userDetail.recent_interviews?.length > 0 ? (
                        <div className="activity-list">
                          {userDetail.recent_interviews.map((sess) => (
                            <div key={sess.id} className="activity-item-card">
                              <div className="item-main">
                                <span className="item-title">
                                  {sess.interview_type_display} Interview — {sess.job_role}
                                </span>
                                <span className="item-sub">
                                  Difficulty: {sess.difficulty} • {formatDate(sess.created_at)}
                                </span>
                              </div>
                              <div className="item-status">
                                <span className={`status-pill ${sess.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                                  {sess.status_display}
                                </span>
                                {sess.overall_score !== null && (
                                  <span className="score-val">{sess.overall_score}%</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="empty-subtext">No interview sessions practiced yet.</span>
                      )}
                    </div>

                    {/* Recent Coding Submissions */}
                    <div className="modal-activity-group" style={{ marginTop: '16px' }}>
                      <h4 className="group-heading">Latest Code Submissions</h4>
                      {userDetail.recent_submissions?.length > 0 ? (
                        <div className="activity-list">
                          {userDetail.recent_submissions.map((sub) => (
                            <div key={sub.id} className="activity-item-card">
                              <div className="item-main">
                                <span className="item-title">{sub.problem_title}</span>
                                <span className="item-sub">
                                  Language: {sub.language_display} • {formatDate(sub.created_at)}
                                </span>
                              </div>
                              <div className="item-status">
                                <span className={`status-pill ${sub.status === 'accepted' ? 'badge-success' : 'badge-danger'}`}>
                                  {sub.status_display}
                                </span>
                                <span className="score-val">{sub.score}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="empty-subtext">No coding problems attempted yet.</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="detail-modal-footer">
              <button
                type="button"
                className="btn-modal-close"
                onClick={handleCloseDetail}
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Deactivation / Activation */}
      {confirmUser && (
        <div className="modal-backdrop" onClick={() => !isToggling && setConfirmUser(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className={`confirm-icon-wrap ${confirmUser.is_active ? 'icon-danger' : 'icon-success'}`}>
              {confirmUser.is_active ? <UserX size={28} /> : <UserCheck size={28} />}
            </div>
            <h3 className="confirm-title">
              {confirmUser.is_active ? 'Deactivate Candidate Account?' : 'Activate Candidate Account?'}
            </h3>
            <p className="confirm-desc">
              {confirmUser.is_active ? (
                <>
                  Are you sure you want to deactivate <strong>{confirmUser.username}</strong>?
                  The user will be immediately blocked from signing in or generating new interview sessions.
                </>
              ) : (
                <>
                  Are you sure you want to activate <strong>{confirmUser.username}</strong>?
                  The user will regain immediate access to practice interviews and submit code.
                </>
              )}
            </p>

            <div className="confirm-actions">
              <button
                type="button"
                className="btn-confirm-cancel"
                onClick={() => setConfirmUser(null)}
                disabled={isToggling}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`btn-confirm-action ${confirmUser.is_active ? 'btn-danger' : 'btn-success'}`}
                onClick={handleToggleConfirm}
                disabled={isToggling}
              >
                {isToggling ? 'Processing...' : (confirmUser.is_active ? 'Yes, Deactivate' : 'Yes, Activate')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
