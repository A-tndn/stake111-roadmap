import { api } from '@/lib/api';

export const supportService = {
  // ============================================
  // PLAYER ENDPOINTS
  // ============================================
  playerCreateTicket: (data: { subject: string; message: string; priority?: string }) =>
    api.post('/support/player/tickets', data),

  playerGetTickets: (params?: { page?: number; limit?: number; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.status) searchParams.set('status', params.status);
    return api.get(`/support/player/tickets?${searchParams.toString()}`);
  },

  playerGetTicket: (id: string) => api.get(`/support/player/tickets/${id}`),

  playerReplyTicket: (id: string, message: string) =>
    api.post(`/support/player/tickets/${id}/reply`, { message }),

  playerUnreadCount: () => api.get('/support/player/unread-count'),

  // ============================================
  // AGENT ENDPOINTS
  // ============================================
  agentCreateTicket: (data: { subject: string; message: string; priority?: string }) =>
    api.post('/support/agent/tickets', data),

  agentGetTickets: (params?: { page?: number; limit?: number; status?: string; direction?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.status) searchParams.set('status', params.status);
    if (params?.direction) searchParams.set('direction', params.direction);
    return api.get(`/support/agent/tickets?${searchParams.toString()}`);
  },

  agentGetTicket: (id: string) => api.get(`/support/agent/tickets/${id}`),

  agentReplyTicket: (id: string, message: string) =>
    api.post(`/support/agent/tickets/${id}/reply`, { message }),

  agentUpdateTicketStatus: (id: string, status: string) =>
    api.put(`/support/agent/tickets/${id}/status`, { status }),

  agentUnreadCount: () => api.get('/support/agent/unread-count'),

  // ============================================
  // MASTER ADMIN ENDPOINTS
  // ============================================
  masterGetTickets: (params?: { page?: number; limit?: number; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.status) searchParams.set('status', params.status);
    return api.get(`/support/master/tickets?${searchParams.toString()}`);
  },

  masterGetTicket: (id: string) => api.get(`/support/master/tickets/${id}`),

  masterReplyTicket: (id: string, message: string) =>
    api.post(`/support/master/tickets/${id}/reply`, { message }),

  masterUpdateTicketStatus: (id: string, status: string) =>
    api.put(`/support/master/tickets/${id}/status`, { status }),

  masterUnreadCount: () => api.get('/support/master/unread-count'),
};
