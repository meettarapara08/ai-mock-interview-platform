import apiClient from './client';

/**
 * Fetch aggregated dashboard statistics, category breakdowns, 14-day trends,
 * and recent platform activity for the Admin Panel.
 * Requires is_staff=True.
 */
export async function getAdminDashboardStats() {
  const response = await apiClient.get('/api/admin/dashboard/');
  return response.data;
}

/**
 * Fetch paginated, searchable, filterable list of users.
 */
export async function getAdminUsers({
  page = 1,
  pageSize = 10,
  search = '',
  status = 'all',
  role = 'all',
  ordering = '-date_joined',
} = {}) {
  const params = new URLSearchParams();
  if (page) params.set('page', page);
  if (pageSize) params.set('page_size', pageSize);
  if (search) params.set('search', search);
  if (status && status !== 'all') params.set('status', status);
  if (role && role !== 'all') params.set('role', role);
  if (ordering) params.set('ordering', ordering);

  const response = await apiClient.get(`/api/admin/users/?${params.toString()}`);
  return response.data;
}

/**
 * Fetch full profile and activity details for a specific user.
 */
export async function getAdminUserDetail(userId) {
  const response = await apiClient.get(`/api/admin/users/${userId}/`);
  return response.data;
}

/**
 * Toggle active/deactivated status for a candidate account.
 */
export async function toggleUserStatus(userId) {
  const response = await apiClient.post(`/api/admin/users/${userId}/toggle-status/`);
  return response.data;
}

/**
 * Fetch paginated, searchable, filterable list of question bank entries.
 */
export async function getAdminQuestions({
  page = 1,
  pageSize = 10,
  search = '',
  interviewType = 'all',
  difficulty = 'all',
  jobRole = '',
} = {}) {
  const params = new URLSearchParams();
  if (page) params.set('page', page);
  if (pageSize) params.set('page_size', pageSize);
  if (search) params.set('search', search);
  if (interviewType && interviewType !== 'all') params.set('interview_type', interviewType);
  if (difficulty && difficulty !== 'all') params.set('difficulty', difficulty);
  if (jobRole && jobRole !== 'all') params.set('job_role', jobRole);

  const response = await apiClient.get(`/api/admin/questions/?${params.toString()}`);
  return response.data;
}

/**
 * Create a new question bank entry.
 */
export async function createAdminQuestion(questionData) {
  const response = await apiClient.post('/api/admin/questions/', questionData);
  return response.data;
}

/**
 * Update an existing question bank entry.
 */
export async function updateAdminQuestion(questionId, questionData) {
  const response = await apiClient.patch(`/api/admin/questions/${questionId}/`, questionData);
  return response.data;
}

/**
 * Delete a question bank entry.
 */
export async function deleteAdminQuestion(questionId) {
  const response = await apiClient.delete(`/api/admin/questions/${questionId}/`);
  return response.data;
}

/**
 * Fetch paginated, searchable, filterable list of job roles.
 */
export async function getAdminJobRoles({
  page = 1,
  pageSize = 10,
  search = '',
  category = 'all',
  isActive = 'all',
} = {}) {
  const params = new URLSearchParams();
  if (page) params.set('page', page);
  if (pageSize) params.set('page_size', pageSize);
  if (search) params.set('search', search);
  if (category && category !== 'all') params.set('category', category);
  if (isActive && isActive !== 'all') params.set('is_active', isActive);

  const response = await apiClient.get(`/api/admin/roles/?${params.toString()}`);
  return response.data;
}

/**
 * Create a new job role.
 */
export async function createAdminJobRole(roleData) {
  const response = await apiClient.post('/api/admin/roles/', roleData);
  return response.data;
}

/**
 * Retrieve single job role detail.
 */
export async function getAdminJobRoleDetail(roleId) {
  const response = await apiClient.get(`/api/admin/roles/${roleId}/`);
  return response.data;
}

/**
 * Update an existing job role.
 */
export async function updateAdminJobRole(roleId, roleData) {
  const response = await apiClient.patch(`/api/admin/roles/${roleId}/`, roleData);
  return response.data;
}

/**
 * Delete a job role.
 */
export async function deleteAdminJobRole(roleId) {
  const response = await apiClient.delete(`/api/admin/roles/${roleId}/`);
  return response.data;
}

/**
 * Fetch paginated, searchable, filterable list of coding problems.
 */
export async function getAdminCodingProblems({
  page = 1,
  pageSize = 10,
  search = '',
  difficulty = 'all',
  category = 'all',
} = {}) {
  const params = new URLSearchParams();
  if (page) params.set('page', page);
  if (pageSize) params.set('page_size', pageSize);
  if (search) params.set('search', search);
  if (difficulty && difficulty !== 'all') params.set('difficulty', difficulty);
  if (category && category !== 'all') params.set('category', category);

  const response = await apiClient.get(`/api/admin/coding/problems/?${params.toString()}`);
  return response.data;
}

/**
 * Retrieve single coding problem detail including test cases.
 */
export async function getAdminCodingProblemDetail(problemId) {
  const response = await apiClient.get(`/api/admin/coding/problems/${problemId}/`);
  return response.data;
}

/**
 * Create a new coding problem.
 */
export async function createAdminCodingProblem(problemData) {
  const response = await apiClient.post('/api/admin/coding/problems/', problemData);
  return response.data;
}

/**
 * Update an existing coding problem.
 */
export async function updateAdminCodingProblem(problemId, problemData) {
  const response = await apiClient.patch(`/api/admin/coding/problems/${problemId}/`, problemData);
  return response.data;
}

/**
 * Delete a coding problem.
 */
export async function deleteAdminCodingProblem(problemId) {
  const response = await apiClient.delete(`/api/admin/coding/problems/${problemId}/`);
  return response.data;
}

/**
 * Add a test case to a coding problem.
 */
export async function createAdminTestCase(problemId, testCaseData) {
  const response = await apiClient.post(`/api/admin/coding/problems/${problemId}/test-cases/`, testCaseData);
  return response.data;
}

/**
 * Update a test case.
 */
export async function updateAdminTestCase(testCaseId, testCaseData) {
  const response = await apiClient.patch(`/api/admin/coding/test-cases/${testCaseId}/`, testCaseData);
  return response.data;
}

/**
 * Delete a test case.
 */
export async function deleteAdminTestCase(testCaseId) {
  const response = await apiClient.delete(`/api/admin/coding/test-cases/${testCaseId}/`);
  return response.data;
}

export default {
  getAdminDashboardStats,
  getAdminUsers,
  getAdminUserDetail,
  toggleUserStatus,
  getAdminQuestions,
  createAdminQuestion,
  updateAdminQuestion,
  deleteAdminQuestion,
  getAdminJobRoles,
  createAdminJobRole,
  getAdminJobRoleDetail,
  updateAdminJobRole,
  deleteAdminJobRole,
  getAdminCodingProblems,
  getAdminCodingProblemDetail,
  createAdminCodingProblem,
  updateAdminCodingProblem,
  deleteAdminCodingProblem,
  createAdminTestCase,
  updateAdminTestCase,
  deleteAdminTestCase,
};
