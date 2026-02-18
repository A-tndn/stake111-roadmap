'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  X, Home, Activity, Trophy, Gamepad2, User, BookOpen, Bell,
  FileText, ArrowDownCircle, ArrowUpCircle, ScrollText, LogOut, MessageCircle,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/inplay', label: 'In-Play', icon: Activity },
  { href: '/matches', label: 'Matches', icon: Trophy },
  { href: '/casino', label: 'Casino', icon: Gamepad2 },
  { href: '/bets', label: 'My Bets', icon: ScrollText },
  { href: '/account', label: 'Account Statement', icon: FileText },
  { href: '/ledger', label: 'Ledger', icon: BookOpen },
  { href: '/deposit', label: 'Deposit', icon: ArrowDownCircle },
  { href: '/withdraw', label: 'Withdraw', icon: ArrowUpCircle },
  { href: '/support', label: 'Support', icon: MessageCircle },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/rules', label: 'Rules', icon: ScrollText },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const handleNav = (href: string) => {
    router.push(href);
    onClose();
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <div
        className={cn(
          'fixed top-0 left-0 h-full w-72 bg-card z-50 shadow-2xl transform transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="bg-brand-teal-dark text-white p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">
              <span className="text-brand-orange">Cric</span>Bet
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-card/10 rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
          </div>
          {user && (
            <div className="bg-card/10 rounded-lg p-3">
              <p className="font-medium text-sm">{user.displayName || user.username}</p>
              <p className="text-xs text-white/70">@{user.username}</p>
              {user.balance !== undefined && (
                <p className="mt-1 text-brand-orange font-bold">
                  {formatCurrency(user.balance)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Menu items */}
        <div className="overflow-y-auto h-[calc(100%-200px)]">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => handleNav(item.href)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-sm border-b border-border transition',
                  isActive
                    ? 'bg-primary/5 text-primary font-medium border-l-4 border-l-primary'
                    : 'text-foreground/70 hover:bg-muted'
                )}
              >
                <Icon className="w-4.5 h-4.5" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
}
