'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, GitBranch, Landmark, Settings,
  FileText, BookOpen, Activity, Trophy, ArrowDownCircle,
  ArrowUpCircle, Shield, LogOut, ChevronRight, X, Crown,
} from 'lucide-react';

interface MasterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuSections = [
  {
    title: 'Overview',
    items: [
      { href: '/master/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Admin Management',
    items: [
      { href: '/master/admins', label: 'All Admins/Agents', icon: Users },
      { href: '/master/admins/create', label: 'Create Admin', icon: Shield },
      { href: '/master/admins/hierarchy', label: 'Hierarchy Tree', icon: GitBranch },
    ],
  },
  {
    title: 'Matches',
    items: [
      { href: '/master/matches', label: 'All Matches', icon: Activity },
      { href: '/master/matches/completed', label: 'Completed', icon: Trophy },
    ],
  },
  {
    title: 'Financial',
    items: [
      { href: '/master/settlements', label: 'Settlements', icon: Landmark },
      { href: '/master/transactions', label: 'All Transactions', icon: BookOpen },
      { href: '/master/deposits', label: 'Deposits', icon: ArrowDownCircle },
      { href: '/master/withdrawals', label: 'Withdrawals', icon: ArrowUpCircle },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { href: '/master/reports', label: 'Reports', icon: FileText },
      { href: '/master/audit-logs', label: 'Audit Logs', icon: Shield },
    ],
  },
  {
    title: 'System',
    items: [
      { href: '/master/settings', label: 'Platform Settings', icon: Settings },
      { href: '/master/settings/commission', label: 'Commission', icon: Landmark },
      { href: '/master/settings/betting-limits', label: 'Betting Limits', icon: Activity },
    ],
  },
];

export default function MasterSidebar({ isOpen, onClose }: MasterSidebarProps) {
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
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full bg-gray-950 text-white z-50 transition-transform duration-300 flex flex-col',
          'w-64',
          'lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Crown className="w-5 h-5 text-brand-gold" />
              <span className="text-brand-gold">Cric</span>Bet
              <span className="text-[10px] bg-brand-gold/20 text-brand-gold px-1.5 py-0.5 rounded-full font-semibold">MASTER</span>
            </h1>
            <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded lg:hidden">
              <X className="w-5 h-5" />
            </button>
          </div>
          {user && (
            <div className="mt-3 bg-gray-900 rounded-lg p-2.5 border border-gray-800">
              <p className="text-sm font-medium truncate">{user.displayName || user.username}</p>
              <span className="text-[10px] text-brand-gold font-semibold uppercase tracking-wider">Master Admin</span>
            </div>
          )}
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto py-2">
          {menuSections.map((section) => (
            <div key={section.title} className="mb-1">
              <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </p>
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;
                return (
                  <button
                    key={item.href}
                    onClick={() => handleNav(item.href)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2 text-sm transition',
                      isActive
                        ? 'bg-brand-gold/10 text-brand-gold border-r-2 border-brand-gold'
                        : 'text-muted-foreground hover:bg-gray-900 hover:text-white'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {isActive && <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground hover:text-red-400 hover:bg-gray-900 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
