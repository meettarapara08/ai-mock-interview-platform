/**
 * Interview API client — communicates with the Django interviews REST API.
 * Reuses the existing apiClient with CSRF and session authentication.
 */

import apiClient, { ensureCsrfToken } from './client';

/**
 * Get available interview configuration (types, difficulties, roles).
 */
export async function getInterviewConfig() {
  const res = await apiClient.get('/api/interviews/config/');
  return res.data;
}

/**
 * Get user-specific dashboard analytics.
 */
export async function getDashboardAnalytics() {
  const res = await apiClient.get('/api/interviews/dashboard/');
  return res.data;
}

/**
 * Create a new interview session.
 */
export async function createSession({ interview_type, job_role, difficulty, total_questions, resume_id }) {
  await ensureCsrfToken();
  const payload = {
    interview_type,
    job_role,
    difficulty,
    total_questions,
  };
  if (resume_id) {
    payload.resume_id = resume_id;
  }
  const res = await apiClient.post('/api/interviews/sessions/', payload);
  return res.data;
}

/**
 * List the current user's interview sessions (history).
 */
export async function listSessions(params = {}) {
  const res = await apiClient.get('/api/interviews/sessions/', { params });
  return res.data;
}

/**
 * Get detailed view of a single session.
 */
export async function getSession(sessionId) {
  const res = await apiClient.get(`/api/interviews/sessions/${sessionId}/`);
  return res.data;
}

/**
 * Start an interview session (generate questions, transition to in_progress).
 */
export async function startSession(sessionId) {
  await ensureCsrfToken();
  const res = await apiClient.post(`/api/interviews/sessions/${sessionId}/start/`);
  return res.data;
}

/**
 * Get the current unanswered question in the session.
 */
export async function getCurrentQuestion(sessionId) {
  const res = await apiClient.get(`/api/interviews/sessions/${sessionId}/current-question/`);
  return res.data;
}

/**
 * Submit an answer for the current question.
 */
export async function submitAnswer(sessionId, answerText) {
  await ensureCsrfToken();
  const res = await apiClient.post(`/api/interviews/sessions/${sessionId}/answer/`, {
    answer_text: answerText,
  });
  return res.data;
}

/**
 * Complete an in-progress interview session.
 */
export async function completeSession(sessionId) {
  await ensureCsrfToken();
  const res = await apiClient.post(`/api/interviews/sessions/${sessionId}/complete/`);
  return res.data;
}

/**
 * Get the full report for a session.
 */
export async function getSessionReport(sessionId) {
  const res = await apiClient.get(`/api/interviews/sessions/${sessionId}/report/`);
  return res.data;
}

/**
 * Get comprehensive user progress and analytics across mock interviews and coding.
 */
export async function getUserAnalytics() {
  const res = await apiClient.get('/api/interviews/analytics/');
  return res.data;
}
