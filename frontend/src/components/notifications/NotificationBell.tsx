'use client';

import { useState, useEffect } from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import { notificationService } from '@/services/notification.service';
import { Bell } from 'lucide-react';
import NotificationPanel from './NotificationPanel';

interface NotificationBellProps {
  isAgent?: boolean;
  className?: string;
}

export default function NotificationBell({ isAgent = false, className }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount, setUnreadCount } = useNotificationStore();

  // Fetch unread count on mount and periodically
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res: any = isAgent
          ? await notificationService.getAgentUnreadCount()
          : await notificationService.getUnreadCount();
        const count = res?.data?.count ?? res?.count ?? 0;
        setUnreadCount(count);
      } catch (err) {
        // Silently fail — server might not support notifications yet
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [isAgent, setUnreadCount]);

  return (
    <div className={`relative ${className || ''}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1.5 hover:bg-card/10 rounded-lg transition"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        isAgent={isAgent}
      />
    </div>
  );
}
