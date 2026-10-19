import apiClient from './client';

/**
 * Fetch list of coding problems with optional filters (difficulty, category, search).
 */
export async function getCodingProblems(params = {}) {
  const response = await apiClient.get('/api/coding/problems/', { params });
  return response.data;
}

/**
 * Fetch detailed problem statement and sample test cases by slug.
 */
export async function getCodingProblemDetail(slug) {
  const response = await apiClient.get(`/api/coding/problems/${slug}/`);
  return response.data;
}

/**
 * Run user code against sample test cases or custom input.
 */
export async function runCode(slug, { language, code, customInput = '' }) {
  const response = await apiClient.post(`/api/coding/problems/${slug}/run/`, {
    language,
    code,
    custom_input: customInput,
  });
  return response.data;
}

/**
 * Submit user code against full test suite (sample + hidden) for evaluation.
 */
export async function submitCode(slug, { language, code }) {
  const response = await apiClient.post(`/api/coding/problems/${slug}/submit/`, {
    language,
    code,
  });
  return response.data;
}

/**
 * Fetch current user's submission history for a specific problem.
 */
export async function getProblemSubmissions(slug) {
  const response = await apiClient.get(`/api/coding/problems/${slug}/submissions/`);
  return response.data;
}

/**
 * Fetch full details of a single submission.
 */
export async function getSubmissionDetail(id) {
  const response = await apiClient.get(`/api/coding/submissions/${id}/`);
  return response.data;
}
