'use client';

import { cn } from '@/lib/utils';

export default function InplayIndicator({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <span className="w-2 h-2 bg-inplay rounded-full animate-pulse-dot" />
      <span className="text-[10px] font-bold text-inplay uppercase tracking-wider">
        INPLAY
      </span>
    </span>
  );
}
