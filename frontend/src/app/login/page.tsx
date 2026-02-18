'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import ThemeToggle from '@/components/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'player' | 'agent' | 'master'>('player');

  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.login({
        ...credentials,
        userType: activeTab,
      });
      login(response.data.token, response.data.user);

      if (activeTab === 'master') {
        router.push('/master/dashboard');
      } else if (activeTab === 'agent') {
        router.push('/agent/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-teal-dark to-brand-teal dark:from-background dark:to-background p-4">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle className="text-white/80 dark:text-muted-foreground hover:text-white dark:hover:text-foreground bg-card/10 dark:bg-card rounded-lg" />
      </div>
      <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl overflow-hidden border border-border">
        <div className="p-8 text-center bg-gradient-to-r from-brand-teal-dark to-brand-teal text-white">
          <h1 className="text-3xl font-bold">
            <span className="text-brand-orange">Cric</span>Bet
          </h1>
          <p className="mt-2 text-white/80 text-sm">Login to your account</p>
        </div>

        <div className="p-6">
          <div className="flex rounded-lg bg-muted p-1 mb-6">
            {(['player', 'agent', 'master'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-card shadow text-brand-teal'
                    : 'text-muted-foreground hover:text-foreground/80'
                }`}
              >
                {tab === 'master' ? 'Master' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">Username</label>
              <input
                type="text"
                placeholder={activeTab === 'master' ? 'Master Admin Username' : activeTab === 'agent' ? 'Agent Username' : 'Username'}
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                required
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">Password</label>
              <input
                type="password"
                placeholder="Password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                required
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-brand-teal-dark to-brand-teal text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Logging in...' : `Login as ${activeTab === 'master' ? 'Master Admin' : activeTab === 'agent' ? 'Agent' : 'Player'}`}
            </button>
          </form>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground text-center">
              {activeTab === 'master'
                ? 'Master admin access is restricted. Contact system owner.'
                : activeTab === 'player'
                ? 'Players are created by agents. Contact your agent for credentials.'
                : 'Agent accounts are managed by the platform administrator.'}
            </p>
          </div>

          {/* WhatsApp Contact */}
          <div className="mt-4">
            <a
              href="https://wa.me/15876671349"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] hover:bg-[#20BD5A] text-white font-medium rounded-lg transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Contact us on WhatsApp
            </a>
            <p className="text-[10px] text-muted-foreground text-center mt-1.5">+1 (587) 667-1349</p>
          </div>
        </div>
      </div>
    </div>
  );
}
