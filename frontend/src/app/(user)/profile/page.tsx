'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { User, Lock, Bell, Shield, Wallet, Calendar, Palette } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [changing, setChanging] = useState(false);

  // Notification preferences (local for now, can be synced to backend later)
  const [notifPrefs, setNotifPrefs] = useState({
    betSettled: true,
    deposits: true,
    withdrawals: true,
    matchStarting: true,
    systemAnnouncements: true,
    soundEnabled: false,
  });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setChanging(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to change password' });
    } finally {
      setChanging(false);
    }
  };

  const togglePref = (key: keyof typeof notifPrefs) => {
    setNotifPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="px-3 py-3">
        <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
          <User className="w-5 h-5 text-brand-teal" />
          Profile
        </h1>
      </div>

      {/* User info card */}
      <div className="px-3 mb-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-brand-teal rounded-full flex items-center justify-center text-white text-xl font-bold">
              {(user?.displayName || user?.username || 'U')[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">{user?.displayName || user?.username}</h2>
              <p className="text-sm text-muted-foreground">@{user?.username}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-muted rounded-lg p-3">
              <div className="flex items-center gap-1 mb-1">
                <Wallet className="w-3 h-3 text-muted-foreground/70" />
                <p className="text-xs text-muted-foreground">Balance</p>
              </div>
              <p className="text-base font-bold text-brand-teal">{formatCurrency(user?.balance || 0)}</p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <div className="flex items-center gap-1 mb-1">
                <Shield className="w-3 h-3 text-muted-foreground/70" />
                <p className="text-xs text-muted-foreground">Role</p>
              </div>
              <p className="text-base font-bold text-foreground capitalize">{user?.role?.toLowerCase().replace('_', ' ')}</p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <div className="flex items-center gap-1 mb-1">
                <Calendar className="w-3 h-3 text-muted-foreground/70" />
                <p className="text-xs text-muted-foreground">Account</p>
              </div>
              <p className="text-sm font-bold text-foreground capitalize">
                {user?.type?.replace('_', ' ') || 'Player'}
              </p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <div className="flex items-center gap-1 mb-1">
                <User className="w-3 h-3 text-muted-foreground/70" />
                <p className="text-xs text-muted-foreground">Status</p>
              </div>
              <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Settings */}
      <div className="px-3 mb-4">
        <div className="bg-card rounded-lg border p-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4 text-brand-teal" />
            Appearance
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Theme</p>
              <p className="text-xs text-muted-foreground">Choose your preferred color scheme</p>
            </div>
            <ThemeToggle variant="full" />
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="px-3 mb-4">
        <div className="bg-card rounded-lg border p-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-brand-teal" />
            Notification Preferences
          </h3>
          <div className="space-y-3">
            {[
              { key: 'betSettled' as const, label: 'Bet Settled', description: 'Get notified when your bets are settled' },
              { key: 'deposits' as const, label: 'Deposit Updates', description: 'Deposit approval/rejection alerts' },
              { key: 'withdrawals' as const, label: 'Withdrawal Updates', description: 'Withdrawal processing alerts' },
              { key: 'matchStarting' as const, label: 'Match Starting', description: 'Alerts when matches go live' },
              { key: 'systemAnnouncements' as const, label: 'System Announcements', description: 'Platform announcements and updates' },
              { key: 'soundEnabled' as const, label: 'Sound Alerts', description: 'Play sound for new notifications' },
            ].map((pref) => (
              <div key={pref.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{pref.label}</p>
                  <p className="text-xs text-muted-foreground">{pref.description}</p>
                </div>
                <button
                  onClick={() => togglePref(pref.key)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    notifPrefs[pref.key] ? 'bg-brand-teal' : 'bg-muted-foreground/30'
                  )}
                >
                  <span className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-card transition-transform',
                    notifPrefs[pref.key] ? 'translate-x-6' : 'translate-x-1'
                  )} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="px-3 pb-4">
        <div className="bg-card rounded-lg border p-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
            <Lock className="w-4 h-4" />
            Change Password
          </h3>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-brand-teal outline-none"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-brand-teal outline-none"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-brand-teal outline-none"
            />

            {message.text && (
              <p className={cn('text-sm', message.type === 'error' ? 'text-red-600' : 'text-green-600')}>
                {message.text}
              </p>
            )}

            <button
              type="submit"
              disabled={changing}
              className="w-full bg-brand-teal text-white py-2.5 rounded-lg text-sm font-bold hover:opacity-90 transition disabled:opacity-50"
            >
              {changing ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
