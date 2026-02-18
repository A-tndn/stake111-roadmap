import { api } from '@/lib/api';

export const notificationService = {
  // Get user notifications (paginated)
  getNotifications: (params?: { page?: number; limit?: number; unreadOnly?: boolean; category?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.unreadOnly) searchParams.set('unreadOnly', 'true');
    if (params?.category) searchParams.set('category', params.category);
    return api.get(`/notifications?${searchParams.toString()}`);
  },

  // Get unread count
  getUnreadCount: () => api.get('/notifications/unread-count'),

  // Mark single notification as read
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),

  // Mark all as read
  markAllAsRead: () => api.put('/notifications/read-all'),

  // Agent notifications
  getAgentNotifications: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.unreadOnly) searchParams.set('unreadOnly', 'true');
    return api.get(`/notifications/agent?${searchParams.toString()}`);
  },

  getAgentUnreadCount: () => api.get('/notifications/agent/unread-count'),

  markAllAgentAsRead: () => api.put('/notifications/agent/read-all'),

  // Admin broadcast
  broadcastNotification: (data: {
    userIds: string[];
    title: string;
    message: string;
    type?: string;
    category?: string;
    priority?: string;
  }) => api.post('/notifications/broadcast', data),
};
