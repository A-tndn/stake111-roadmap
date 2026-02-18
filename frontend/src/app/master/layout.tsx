'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/hooks/useSocket';
import MasterSidebar from '@/components/master/MasterSidebar';
import MasterTopbar from '@/components/master/MasterTopbar';
import ToastContainer from '@/components/notifications/ToastContainer';

export default function MasterLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useSocket();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user?.type !== 'master_admin') {
        router.push('/dashboard');
      }
    }
  }, [mounted, isAuthenticated, user?.type, router]);

  if (!mounted || !isAuthenticated || user?.type !== 'master_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-brand-gold text-lg font-medium">Loading Master Panel...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <MasterSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <MasterTopbar onMenuToggle={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
