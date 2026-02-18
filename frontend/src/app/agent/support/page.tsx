'use client';

import { useState, useEffect, useRef } from 'react';
import { supportService } from '@/services/support.service';
import {
  MessageCircle, Send, Plus, ArrowLeft, CheckCircle,
  ChevronRight, Loader2, Inbox, ArrowUpRight, Filter,
  XCircle, AlertTriangle,
} from 'lucide-react';

interface Message {
  id: string;
  senderType: string;
  senderUsername: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  senderType: string;
  senderUsername: string;
  recipientType: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  _count?: { messages: number };
}

export default function AgentSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [reply, setReply] = useState('');
  const [newTicket, setNewTicket] = useState({ subject: '', message: '', priority: 'NORMAL' });
  const [filter, setFilter] = useState<'all' | 'received' | 'sent'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTickets();
  }, [filter, statusFilter]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedTicket?.messages]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res: any = await supportService.agentGetTickets({
        direction: filter === 'all' ? undefined : filter,
        status: statusFilter || undefined,
      });
      setTickets(res.data?.tickets || []);
    } catch (err) {
      console.error('Failed to load tickets', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTicketDetail = async (id: string) => {
    try {
      const res: any = await supportService.agentGetTicket(id);
      setSelectedTicket(res.data);
    } catch (err) {
      console.error('Failed to load ticket', err);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.subject.trim() || !newTicket.message.trim()) return;

    try {
      setSending(true);
      await supportService.agentCreateTicket(newTicket);
      setNewTicket({ subject: '', message: '', priority: 'NORMAL' });
      setShowNewTicket(false);
      await loadTickets();
    } catch (err) {
      console.error('Failed to create ticket', err);
    } finally {
      setSending(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !selectedTicket) return;

    try {
      setSending(true);
      await supportService.agentReplyTicket(selectedTicket.id, reply);
      setReply('');
      await loadTicketDetail(selectedTicket.id);
    } catch (err) {
      console.error('Failed to send reply', err);
    } finally {
      setSending(false);
    }
  };

  const handleStatusUpdate = async (ticketId: string, status: string) => {
    try {
      await supportService.agentUpdateTicketStatus(ticketId, status);
      await loadTicketDetail(ticketId);
      await loadTickets();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'IN_PROGRESS': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'RESOLVED': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'CLOSED': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT': return <AlertTriangle className="w-3.5 h-3.5 text-red-500" />;
      case 'HIGH': return <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />;
      default: return null;
    }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Chat view
  if (selectedTicket) {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSelectedTicket(null)} className="p-1.5 hover:bg-gray-800 rounded-lg transition text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-white truncate">{selectedTicket.subject}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-gray-400">
                From: <span className="text-brand-orange font-medium">{selectedTicket.senderUsername}</span>
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${getStatusColor(selectedTicket.status)}`}>
                {selectedTicket.status.replace('_', ' ')}
              </span>
            </div>
          </div>
          {/* Status actions */}
          <div className="flex items-center gap-1">
            {selectedTicket.status !== 'RESOLVED' && selectedTicket.status !== 'CLOSED' && (
              <button
                onClick={() => handleStatusUpdate(selectedTicket.id, 'RESOLVED')}
                className="text-[10px] px-2 py-1 bg-green-500/10 text-green-400 rounded-md hover:bg-green-500/20 transition"
              >
                Resolve
              </button>
            )}
            {selectedTicket.status !== 'CLOSED' && (
              <button
                onClick={() => handleStatusUpdate(selectedTicket.id, 'CLOSED')}
                className="text-[10px] px-2 py-1 bg-gray-600/30 text-gray-400 rounded-md hover:bg-gray-600/50 transition"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-950">
          {selectedTicket.messages?.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderType === 'agent' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                msg.senderType === 'agent'
                  ? 'bg-brand-teal text-white rounded-br-md'
                  : msg.senderType === 'master'
                  ? 'bg-amber-900/30 border border-amber-700/30 rounded-bl-md'
                  : 'bg-gray-800 border border-gray-700 rounded-bl-md'
              }`}>
                {msg.senderType !== 'agent' && (
                  <p className={`text-[10px] font-semibold mb-1 ${
                    msg.senderType === 'master' ? 'text-amber-400' : 'text-brand-orange'
                  }`}>
                    {msg.senderType === 'master' ? 'Master Admin' : msg.senderUsername}
                  </p>
                )}
                <p className="text-sm whitespace-pre-wrap text-white">{msg.message}</p>
                <p className="text-[10px] mt-1 text-white/50">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {msg.senderType === 'agent' && msg.read && (
                    <CheckCircle className="w-3 h-3 inline ml-1 text-blue-400" />
                  )}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply */}
        {selectedTicket.status !== 'CLOSED' && (
          <form onSubmit={handleReply} className="bg-gray-900 border-t border-gray-800 p-3">
            <div className="flex items-end gap-2">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type your reply..."
                rows={1}
                className="flex-1 resize-none bg-gray-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal placeholder:text-gray-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleReply(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={sending || !reply.trim()}
                className="p-2.5 bg-brand-teal text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  // New ticket form (agent to master)
  if (showNewTicket) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setShowNewTicket(false)} className="p-1.5 hover:bg-gray-800 rounded-lg transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold">Query to Master Admin</h2>
        </div>

        <form onSubmit={handleCreateTicket} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Subject</label>
            <input
              type="text"
              value={newTicket.subject}
              onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
              placeholder="What do you need help with?"
              required
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-brand-teal focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Priority</label>
            <select
              value={newTicket.priority}
              onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-brand-teal focus:border-transparent outline-none"
            >
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Message</label>
            <textarea
              value={newTicket.message}
              onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
              placeholder="Describe your issue..."
              rows={5}
              required
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-brand-teal focus:border-transparent outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full py-3 bg-brand-teal text-white font-medium rounded-xl hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
            Send to Master Admin
          </button>
        </form>
      </div>
    );
  }

  // Ticket list view
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-brand-teal" />
          Support Tickets
        </h2>
        <button
          onClick={() => setShowNewTicket(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-teal text-white text-sm font-medium rounded-lg hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" />
          Query Master
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {(['all', 'received', 'sent'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs rounded-lg transition ${
              filter === f
                ? 'bg-brand-teal text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {f === 'all' ? 'All' : f === 'received' ? (
              <span className="flex items-center gap-1"><Inbox className="w-3 h-3" /> From Players</span>
            ) : (
              <span className="flex items-center gap-1"><ArrowUpRight className="w-3 h-3" /> To Master</span>
            )}
          </button>
        ))}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-gray-800 text-gray-400 rounded-lg border border-gray-700 outline-none"
        >
          <option value="">All Status</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-brand-teal" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16">
          <MessageCircle className="w-12 h-12 mx-auto text-gray-700 mb-3" />
          <p className="text-gray-400 text-sm">No support tickets found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => loadTicketDetail(ticket.id)}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl p-4 text-left hover:border-gray-600 transition group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {ticket.senderType === 'player' ? (
                      <span className="text-[10px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded-full border border-purple-500/20">
                        From Player
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded-full border border-amber-500/20">
                        To Master
                      </span>
                    )}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                    {getPriorityIcon(ticket.priority)}
                  </div>
                  <h3 className="font-medium text-sm text-white truncate">{ticket.subject}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {ticket.senderType === 'player' ? `from ${ticket.senderUsername}` : `by you`}
                  </p>
                  {ticket.messages?.[0] && (
                    <p className="text-xs text-gray-500 truncate mt-1">{ticket.messages[0].message}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] text-gray-500">{timeAgo(ticket.updatedAt)}</span>
                  {(ticket._count?.messages || 0) > 0 && (
                    <span className="bg-brand-teal text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {ticket._count?.messages}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-600 opacity-0 group-hover:opacity-100 transition" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
