'use client';

import { useAuthStore } from '@/store/authStore';
import { Menu, Crown } from 'lucide-react';
import NotificationBell from '@/components/notifications/NotificationBell';
import ThemeToggle from '@/components/ThemeToggle';

interface MasterTopbarProps {
  onMenuToggle: () => void;
}

export default function MasterTopbar({ onMenuToggle }: MasterTopbarProps) {
  const { user } = useAuthStore();

  return (
    <header className="bg-card border-b border-border px-4 py-3 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onMenuToggle} className="p-1.5 hover:bg-muted rounded-lg lg:hidden">
            <Menu className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <Crown className="w-4 h-4 text-brand-gold" />
            <span>Master Control Panel</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle className="text-muted-foreground hover:text-foreground" />
          <NotificationBell isAgent className="text-muted-foreground" />

          <div className="hidden sm:flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-gold to-yellow-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {(user?.displayName || user?.username || 'M')[0].toUpperCase()}
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{user?.displayName || user?.username}</p>
              <p className="text-[10px] text-brand-gold font-semibold">Master Admin</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
