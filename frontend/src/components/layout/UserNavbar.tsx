'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/lib/utils';
import {
  Menu, User, LogOut, ChevronDown,
  Wallet, Gift,
} from 'lucide-react';
import NotificationBell from '@/components/notifications/NotificationBell';
import ThemeToggle from '@/components/ThemeToggle';

interface UserNavbarProps {
  onMenuToggle: () => void;
}

export default function UserNavbar({ onMenuToggle }: UserNavbarProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [showProfile, setShowProfile] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="bg-brand-teal-dark text-white px-3 py-2 sticky top-0 z-50 shadow-md">
      <div className="flex items-center justify-between">
        {/* Left: Menu + Logo */}
        <div className="flex items-center gap-2">
          <button onClick={onMenuToggle} className="p-1.5 hover:bg-card/10 rounded-lg transition">
            <Menu className="w-5 h-5" />
          </button>
          <h1
            className="text-lg font-bold tracking-tight cursor-pointer"
            onClick={() => router.push('/dashboard')}
          >
            <span className="text-brand-orange">Cric</span>Bet
          </h1>
        </div>

        {/* Right: Balance + Theme + Notifications + Profile */}
        <div className="flex items-center gap-1.5">
          {/* Balance */}
          {user?.balance !== undefined && (
            <div className="flex items-center gap-1.5 bg-card/10 backdrop-blur-sm px-2.5 py-1 rounded-lg">
              <Wallet className="w-3.5 h-3.5 text-brand-orange" />
              <div className="text-xs">
                <span className="text-white/70">Coins</span>
                <p className="font-semibold text-sm leading-tight">
                  {formatCurrency(user.balance)}
                </p>
              </div>
            </div>
          )}

          {/* Theme toggle */}
          <ThemeToggle className="text-white/80 hover:text-white" />

          {/* Notifications */}
          <NotificationBell />

          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-1 p-1.5 hover:bg-card/10 rounded-lg transition"
            >
              <div className="w-7 h-7 bg-brand-orange rounded-full flex items-center justify-center text-xs font-bold">
                {(user?.displayName || user?.username || 'U')[0].toUpperCase()}
              </div>
              <ChevronDown className="w-3.5 h-3.5 hidden sm:block" />
            </button>

            {showProfile && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
                <div className="absolute right-0 top-full mt-1 w-48 bg-card text-card-foreground rounded-lg shadow-xl border border-border z-50 overflow-hidden">
                  <div className="px-3 py-2 border-b border-border bg-muted">
                    <p className="font-medium text-sm truncate">{user?.displayName || user?.username}</p>
                    <p className="text-xs text-muted-foreground">{user?.username}</p>
                  </div>
                  <button
                    onClick={() => { router.push('/profile'); setShowProfile(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition"
                  >
                    <User className="w-4 h-4" /> Profile
                  </button>
                  <button
                    onClick={() => { router.push('/rules'); setShowProfile(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition"
                  >
                    <Gift className="w-4 h-4" /> Rules
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
