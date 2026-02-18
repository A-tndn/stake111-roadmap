'use client';

import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/lib/utils';
import { Menu, Wallet } from 'lucide-react';
import NotificationBell from '@/components/notifications/NotificationBell';
import ThemeToggle from '@/components/ThemeToggle';

interface AdminTopbarProps {
  onMenuToggle: () => void;
  title?: string;
}

export default function AdminTopbar({ onMenuToggle, title }: AdminTopbarProps) {
  const { user } = useAuthStore();

  return (
    <header className="bg-card border-b border-border px-4 py-3 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onMenuToggle} className="p-1.5 hover:bg-muted rounded-lg lg:hidden">
            <Menu className="w-5 h-5 text-muted-foreground" />
          </button>
          {title && <h1 className="text-lg font-bold text-foreground">{title}</h1>}
        </div>

        <div className="flex items-center gap-3">
          {user?.balance !== undefined && (
            <div className="flex items-center gap-1.5 bg-green-500/10 text-green-600 dark:text-green-400 px-2.5 py-1 rounded-lg text-sm">
              <Wallet className="w-3.5 h-3.5" />
              <span className="font-semibold">{formatCurrency(user.balance)}</span>
            </div>
          )}

          <ThemeToggle className="text-muted-foreground hover:text-foreground" />
          <NotificationBell isAgent className="text-muted-foreground" />

          <div className="hidden sm:flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-teal rounded-full flex items-center justify-center text-white text-sm font-bold">
              {(user?.displayName || user?.username || 'A')[0].toUpperCase()}
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{user?.displayName || user?.username}</p>
              <p className="text-[10px] text-muted-foreground capitalize">{user?.role?.toLowerCase().replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
