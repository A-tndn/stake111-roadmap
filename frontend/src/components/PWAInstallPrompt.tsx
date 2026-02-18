'use client';

import { useState, useEffect } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { Download, X } from 'lucide-react';

export default function PWAInstallPrompt() {
  const { isInstallable, install } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Don't show if user dismissed before
    const wasDismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    // Show after 30 seconds
    const timer = setTimeout(() => {
      if (isInstallable) setShow(true);
    }, 30000);

    return () => clearTimeout(timer);
  }, [isInstallable]);

  if (!isInstallable || dismissed || !show) return null;

  const handleDismiss = () => {
    setDismissed(true);
    setShow(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  const handleInstall = async () => {
    await install();
    setShow(false);
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-card border border-border rounded-xl shadow-2xl p-4 z-50 animate-slide-up">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 hover:bg-muted rounded-lg transition"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-brand-teal rounded-xl flex items-center justify-center flex-shrink-0">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm text-foreground">Install CricBet</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add to your home screen for quick access and offline support
          </p>
          <button
            onClick={handleInstall}
            className="mt-2 px-4 py-1.5 bg-brand-teal text-white text-xs font-medium rounded-lg hover:bg-brand-teal-dark transition"
          >
            Install App
          </button>
        </div>
      </div>
    </div>
  );
}
