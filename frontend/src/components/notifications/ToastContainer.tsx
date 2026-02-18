'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotificationStore } from '@/store/notificationStore';
import { cn } from '@/lib/utils';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

const toastStyles: Record<string, { bg: string; border: string; icon: any; iconColor: string }> = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-300',
    icon: CheckCircle,
    iconColor: 'text-green-500',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-300',
    icon: XCircle,
    iconColor: 'text-red-500',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-300',
    icon: AlertTriangle,
    iconColor: 'text-yellow-500',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    icon: Info,
    iconColor: 'text-blue-500',
  },
};

function ToastItem({ id, type, title, message, duration = 5000, actionUrl }: {
  id: string;
  type: string;
  title: string;
  message: string;
  duration?: number;
  actionUrl?: string;
}) {
  const router = useRouter();
  const { removeToast } = useNotificationStore();
  const style = toastStyles[type] || toastStyles.info;
  const Icon = style.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(id);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, removeToast]);

  const handleClick = () => {
    if (actionUrl) {
      router.push(actionUrl);
    }
    removeToast(id);
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-xl border shadow-lg backdrop-blur-sm max-w-sm w-full animate-slide-in-right',
        style.bg, style.border,
        actionUrl && 'cursor-pointer'
      )}
      onClick={actionUrl ? handleClick : undefined}
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', style.iconColor)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{message}</p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); removeToast(id); }}
        className="flex-shrink-0 p-0.5 hover:bg-black/5 rounded transition"
      >
        <X className="w-3.5 h-3.5 text-muted-foreground" />
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/5 rounded-b-xl overflow-hidden">
        <div
          className={cn('h-full', style.iconColor.replace('text-', 'bg-'))}
          style={{
            animation: `shrink ${duration}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts } = useNotificationStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
          actionUrl={toast.actionUrl}
        />
      ))}

      <style jsx global>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
          position: relative;
        }
      `}</style>
    </div>
  );
}
