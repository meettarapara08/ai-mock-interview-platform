/**
 * Notification API client — connects to Django notifications endpoints.
 * Reuses the existing apiClient with CSRF and session authentication.
 */

import apiClient, { ensureCsrfToken } from './client';

/**
 * Get notifications for the current user.
 * @param {number} limit
 * @returns {Promise<{ notifications: Array, unread_count: number }>}
 */
export async function getNotifications(limit = 30) {
  const res = await apiClient.get('/api/notifications/', {
    params: { limit },
  });
  return res.data;
}

/**
 * Get current unread notification count.
 * @returns {Promise<number>}
 */
export async function getUnreadCount() {
  const res = await apiClient.get('/api/notifications/unread-count/');
  return res.data.unread_count;
}

/**
 * Mark a single notification as read.
 * @param {number} id
 * @returns {Promise<Object>}
 */
export async function markNotificationAsRead(id) {
  await ensureCsrfToken();
  const res = await apiClient.post(`/api/notifications/${id}/read/`);
  return res.data;
}

/**
 * Mark all unread notifications as read.
 * @returns {Promise<Object>}
 */
export async function markAllNotificationsAsRead() {
  await ensureCsrfToken();
  const res = await apiClient.post('/api/notifications/mark-all-read/');
  return res.data;
}
