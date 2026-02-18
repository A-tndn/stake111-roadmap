'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { notificationService } from '@/services/notification.service';
import { cn } from '@/lib/utils';
import {
  Bell, Check, CheckCheck, ChevronRight, Wallet, Trophy, AlertCircle, Info, Megaphone, Filter,
} from 'lucide-react';

const typeIcons: Record<string, any> = {
  BET_SETTLED: Trophy,
  DEPOSIT_APPROVED: Wallet,
  DEPOSIT_REJECTED: AlertCircle,
  WITHDRAWAL_APPROVED: Wallet,
  WITHDRAWAL_REJECTED: AlertCircle,
  MATCH_STARTING: Info,
  SYSTEM: Megaphone,
};

const typeColors: Record<string, string> = {
  BETTING: 'text-green-600 bg-green-50',
  FINANCE: 'text-orange-600 bg-orange-50',
  SYSTEM: 'text-purple-600 bg-purple-50',
};

const CATEGORIES = ['All', 'BETTING', 'FINANCE', 'SYSTEM'];

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('All');
  const [unreadOnly, setUnreadOnly] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, [page, filter, unreadOnly]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res: any = await notificationService.getNotifications({
        page,
        limit: 20,
        unreadOnly,
        category: filter === 'All' ? undefined : filter,
      });
      const data = res?.data || res;
      setNotifications(data?.notifications || []);
      setUnreadCount(data?.unreadCount || 0);
      setTotalPages(data?.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await notificationService.markAsRead(id);
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await notificationService.markAllAsRead();
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleClick = (notif: any) => {
    if (!notif.read) handleMarkAsRead(notif.id);
    if (notif.actionUrl) router.push(notif.actionUrl);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="px-3 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Bell className="w-5 h-5 text-brand-teal" />
            Notifications
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">All your alerts and updates</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1 text-xs text-brand-teal hover:underline"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="px-3 mb-3 flex items-center gap-2 overflow-x-auto">
        <Filter className="w-3.5 h-3.5 text-muted-foreground/70 flex-shrink-0" />
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => { setFilter(cat); setPage(1); }}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition',
              filter === cat ? 'bg-brand-teal text-white' : 'bg-muted text-muted-foreground hover:bg-muted/70'
            )}
          >
            {cat === 'All' ? 'All' : cat.charAt(0) + cat.slice(1).toLowerCase()}
          </button>
        ))}
        <button
          onClick={() => { setUnreadOnly(!unreadOnly); setPage(1); }}
          className={cn(
            'px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition',
            unreadOnly ? 'bg-blue-500 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/70'
          )}
        >
          Unread only
        </button>
      </div>

      {/* Notification list */}
      <div className="px-3 pb-4">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-card rounded-lg border h-16 animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No notifications</p>
            <p className="text-muted-foreground/70 text-xs mt-0.5">
              {unreadOnly ? 'All caught up!' : 'Nothing here yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif: any) => {
              const IconComponent = typeIcons[notif.type] || Bell;
              const colorClass = typeColors[notif.category] || 'text-muted-foreground bg-muted';

              return (
                <button
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={cn(
                    'w-full flex items-start gap-3 p-3 rounded-lg border bg-card hover:shadow-sm transition text-left',
                    !notif.read && 'border-l-4 border-l-blue-500'
                  )}
                >
                  <div className={cn('flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center', colorClass)}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-sm', !notif.read ? 'font-semibold text-foreground' : 'text-foreground/80')}>
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground/70 flex-shrink-0">{formatTime(notif.createdAt)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                    {notif.actionUrl && (
                      <span className="text-[10px] text-brand-teal flex items-center gap-0.5 mt-1">
                        {notif.actionLabel || 'View details'} <ChevronRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  {!notif.read && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif.id); }}
                      className="flex-shrink-0 p-1 hover:bg-muted rounded transition"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5 text-muted-foreground/70" />
                    </button>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs font-medium bg-muted rounded-lg disabled:opacity-50 hover:bg-muted/70 transition"
            >
              Previous
            </button>
            <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs font-medium bg-muted rounded-lg disabled:opacity-50 hover:bg-muted/70 transition"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
