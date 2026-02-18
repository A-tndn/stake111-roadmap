'use client';

import { useState, useEffect, useRef } from 'react';
import { supportService } from '@/services/support.service';
import {
  MessageCircle, Send, Plus, ArrowLeft, Clock, CheckCircle,
  AlertCircle, ChevronRight, Loader2,
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
  senderUsername: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  _count?: { messages: number };
}

export default function PlayerSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [reply, setReply] = useState('');
  const [newTicket, setNewTicket] = useState({ subject: '', message: '', priority: 'NORMAL' });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedTicket?.messages]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res: any = await supportService.playerGetTickets();
      setTickets(res.data?.tickets || []);
    } catch (err) {
      console.error('Failed to load tickets', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTicketDetail = async (id: string) => {
    try {
      const res: any = await supportService.playerGetTicket(id);
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
      await supportService.playerCreateTicket(newTicket);
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
      await supportService.playerReplyTicket(selectedTicket.id, reply);
      setReply('');
      await loadTicketDetail(selectedTicket.id);
    } catch (err) {
      console.error('Failed to send reply', err);
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'IN_PROGRESS': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'RESOLVED': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'CLOSED': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-red-500';
      case 'HIGH': return 'text-orange-500';
      case 'NORMAL': return 'text-blue-400';
      case 'LOW': return 'text-gray-400';
      default: return 'text-gray-400';
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

  // Chat view for a selected ticket
  if (selectedTicket) {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* Chat header */}
        <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSelectedTicket(null)} className="p-1.5 hover:bg-muted rounded-lg transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{selectedTicket.subject}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${getStatusColor(selectedTicket.status)}`}>
                {selectedTicket.status.replace('_', ' ')}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {timeAgo(selectedTicket.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
          {selectedTicket.messages?.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderType === 'player' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                msg.senderType === 'player'
                  ? 'bg-brand-teal text-white rounded-br-md'
                  : 'bg-card border border-border rounded-bl-md'
              }`}>
                {msg.senderType !== 'player' && (
                  <p className="text-[10px] font-semibold text-brand-orange mb-1">
                    {msg.senderUsername}
                  </p>
                )}
                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                <p className={`text-[10px] mt-1 ${
                  msg.senderType === 'player' ? 'text-white/60' : 'text-muted-foreground'
                }`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {msg.senderType === 'player' && msg.read && (
                    <CheckCircle className="w-3 h-3 inline ml-1" />
                  )}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply input */}
        {selectedTicket.status !== 'CLOSED' && (
          <form onSubmit={handleReply} className="bg-card border-t border-border p-3">
            <div className="flex items-end gap-2">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type your message..."
                rows={1}
                className="flex-1 resize-none bg-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
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

  // New ticket form
  if (showNewTicket) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setShowNewTicket(false)} className="p-1.5 hover:bg-muted rounded-lg transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold">New Support Query</h2>
        </div>

        <form onSubmit={handleCreateTicket} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <input
              type="text"
              value={newTicket.subject}
              onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
              placeholder="What do you need help with?"
              required
              className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select
              value={newTicket.priority}
              onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
              className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            >
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea
              value={newTicket.message}
              onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
              placeholder="Describe your issue in detail..."
              rows={5}
              required
              className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full py-3 bg-brand-teal text-white font-medium rounded-xl hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send to Agent
          </button>
        </form>
      </div>
    );
  }

  // Ticket list
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-brand-teal" />
          Support
        </h2>
        <button
          onClick={() => setShowNewTicket(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-teal text-white text-sm font-medium rounded-xl hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" />
          New Query
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-brand-teal" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16">
          <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">No support queries yet</p>
          <p className="text-muted-foreground/60 text-xs mt-1">Tap &quot;New Query&quot; to contact your agent</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => loadTicketDetail(ticket.id)}
              className="w-full bg-card border border-border rounded-xl p-4 text-left hover:border-primary/30 transition group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                    <span className={`text-[10px] font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <h3 className="font-medium text-sm truncate">{ticket.subject}</h3>
                  {ticket.messages?.[0] && (
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {ticket.messages[0].message}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] text-muted-foreground">{timeAgo(ticket.updatedAt)}</span>
                  {(ticket._count?.messages || 0) > 0 && (
                    <span className="bg-brand-teal text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {ticket._count?.messages}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* WhatsApp CTA */}
      <div className="mt-6 p-4 bg-card border border-border rounded-xl">
        <p className="text-xs text-muted-foreground text-center mb-2">Need urgent help?</p>
        <a
          href="https://wa.me/15876671349"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#25D366] text-white text-sm font-medium rounded-lg hover:bg-[#20BD5A] transition"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          WhatsApp Support
        </a>
      </div>
    </div>
  );
}
