/**
 * Resumes API client — communicates with Django interviews resume endpoints.
 * Handles multipart file uploads and CSRF token session authentication.
 */

import apiClient, { ensureCsrfToken } from './client';

/**
 * Upload a resume file (PDF or DOCX).
 * @param {File} file - The uploaded document
 * @param {Function} [onUploadProgress] - Optional progress callback
 */
export async function uploadResume(file, onUploadProgress) {
  await ensureCsrfToken();
  const formData = new FormData();
  formData.append('file', file);

  const res = await apiClient.post('/api/interviews/resumes/upload/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });
  return res.data;
}

/**
 * Get the currently active resume for the current user.
 */
export async function getActiveResume() {
  const res = await apiClient.get('/api/interviews/resumes/active/');
  return res.data.resume;
}

/**
 * List all resumes uploaded by the current user.
 */
export async function listResumes() {
  const res = await apiClient.get('/api/interviews/resumes/');
  return res.data;
}

/**
 * Get detailed information for a single resume.
 */
export async function getResume(resumeId) {
  const res = await apiClient.get(`/api/interviews/resumes/${resumeId}/`);
  return res.data;
}

/**
 * Delete a resume.
 */
export async function deleteResume(resumeId) {
  await ensureCsrfToken();
  const res = await apiClient.delete(`/api/interviews/resumes/${resumeId}/`);
  return res.data;
}
