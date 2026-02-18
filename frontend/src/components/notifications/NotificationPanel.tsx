'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotificationStore } from '@/store/notificationStore';
import { notificationService } from '@/services/notification.service';
import { cn } from '@/lib/utils';
import {
  Bell, Check, CheckCheck, X, ChevronRight,
  Wallet, Trophy, AlertCircle, Info, Megaphone,
} from 'lucide-react';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isAgent?: boolean;
}

const typeIcons: Record<string, any> = {
  BET_SETTLED: Trophy,
  DEPOSIT_APPROVED: Wallet,
  DEPOSIT_REJECTED: AlertCircle,
  WITHDRAWAL_APPROVED: Wallet,
  WITHDRAWAL_REJECTED: AlertCircle,
  MATCH_STARTING: Info,
  DEPOSIT_REQUEST: Wallet,
  WITHDRAWAL_REQUEST: Wallet,
  SYSTEM: Megaphone,
};

const typeColors: Record<string, string> = {
  BET_SETTLED: 'text-green-600 bg-green-50',
  DEPOSIT_APPROVED: 'text-green-600 bg-green-50',
  DEPOSIT_REJECTED: 'text-red-600 bg-red-50',
  WITHDRAWAL_APPROVED: 'text-green-600 bg-green-50',
  WITHDRAWAL_REJECTED: 'text-red-600 bg-red-50',
  MATCH_STARTING: 'text-blue-600 bg-blue-50',
  DEPOSIT_REQUEST: 'text-orange-600 bg-orange-50',
  WITHDRAWAL_REQUEST: 'text-orange-600 bg-orange-50',
  SYSTEM: 'text-purple-600 bg-purple-50',
};

export default function NotificationPanel({ isOpen, onClose, isAgent = false }: NotificationPanelProps) {
  const router = useRouter();
  const { notifications, unreadCount, setNotifications, markAsRead, markAllAsRead, setUnreadCount } = useNotificationStore();
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, filter]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res: any = isAgent
        ? await notificationService.getAgentNotifications({ limit: 30, unreadOnly: filter === 'unread' })
        : await notificationService.getNotifications({ limit: 30, unreadOnly: filter === 'unread' });

      const data = res?.data || res;
      const notifs = (data?.notifications || []).map((n: any) => ({
        id: n.id,
        type: n.priority === 'HIGH' ? 'warning' : n.type?.includes('REJECTED') ? 'error' : 'info',
        title: n.title,
        message: n.message,
        timestamp: n.createdAt,
        read: n.read,
        category: n.category,
        priority: n.priority,
        actionUrl: n.actionUrl,
        actionLabel: n.actionLabel,
        persistent: true,
      }));
      setNotifications(notifs, data?.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    markAsRead(id);
    try {
      await notificationService.markAsRead(id);
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    markAllAsRead();
    try {
      if (isAgent) {
        await notificationService.markAllAgentAsRead();
      } else {
        await notificationService.markAllAsRead();
      }
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleNotificationClick = (notif: any) => {
    if (!notif.read) {
      handleMarkAsRead(notif.id);
    }
    if (notif.actionUrl) {
      router.push(notif.actionUrl);
      onClose();
    }
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

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50" onClick={onClose} />

      {/* Panel */}
      <div className="absolute right-0 top-full mt-1 w-80 sm:w-96 bg-card rounded-xl shadow-2xl border z-50 overflow-hidden max-h-[70vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-brand-teal" />
            <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="p-1 hover:bg-muted/70 rounded text-muted-foreground hover:text-foreground transition"
                title="Mark all as read"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}
            <button onClick={onClose} className="p-1 hover:bg-muted/70 rounded text-muted-foreground transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'flex-1 py-2 text-xs font-medium transition',
              filter === 'all' ? 'text-brand-teal border-b-2 border-brand-teal' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={cn(
              'flex-1 py-2 text-xs font-medium transition',
              filter === 'unread' ? 'text-brand-teal border-b-2 border-brand-teal' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </button>
        </div>

        {/* Notification list */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="py-8 text-center">
              <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No notifications</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {filter === 'unread' ? 'All caught up!' : 'Nothing here yet'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const IconComponent = typeIcons[notif.category || 'SYSTEM'] || Bell;
              const colorClass = typeColors[notif.category || 'SYSTEM'] || 'text-muted-foreground bg-muted';

              return (
                <button
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={cn(
                    'w-full flex items-start gap-3 px-4 py-3 hover:bg-muted transition text-left border-b last:border-b-0',
                    !notif.read && 'bg-blue-50/40'
                  )}
                >
                  {/* Icon */}
                  <div className={cn('flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center', colorClass)}>
                    <IconComponent className="w-4 h-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-sm truncate', !notif.read ? 'font-semibold text-foreground' : 'text-foreground')}>
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground">{formatTime(notif.timestamp)}</span>
                      {notif.actionUrl && (
                        <span className="text-[10px] text-brand-teal flex items-center gap-0.5">
                          {notif.actionLabel || 'View'} <ChevronRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mark as read button */}
                  {!notif.read && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif.id); }}
                      className="flex-shrink-0 p-1 hover:bg-muted/70 rounded transition"
                      title="Mark as read"
                    >
                      <Check className="w-3 h-3 text-muted-foreground" />
                    </button>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
