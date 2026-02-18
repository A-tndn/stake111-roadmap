'use client';

import { cn } from '@/lib/utils';

interface OddsBoxProps {
  odds: number | null | undefined;
  isBack: boolean;
  label?: string;
  onClick?: () => void;
  disabled?: boolean;
  locked?: boolean;
  size?: 'sm' | 'md';
}

export default function OddsBox({
  odds,
  isBack,
  label,
  onClick,
  disabled = false,
  locked = false,
  size = 'md',
}: OddsBoxProps) {
  const isClickable = !disabled && !locked && odds != null && odds > 0;

  return (
    <button
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable}
      className={cn(
        'flex flex-col items-center justify-center rounded transition-all border',
        size === 'sm' ? 'min-w-[55px] py-1 px-1.5' : 'min-w-[65px] py-1.5 px-2',
        isBack
          ? 'bg-back hover:bg-back-dark border-back-dark/20 text-foreground'
          : 'bg-lay hover:bg-lay-dark border-lay-dark/20 text-foreground',
        !isClickable && 'opacity-50 cursor-not-allowed',
        isClickable && 'cursor-pointer active:scale-95 hover:shadow-md',
      )}
    >
      {label && (
        <span className="text-[9px] font-medium text-muted-foreground leading-none">{label}</span>
      )}
      <span className={cn('font-bold', size === 'sm' ? 'text-sm' : 'text-base')}>
        {locked ? '🔒' : odds != null && odds > 0 ? odds.toFixed(2) : '-'}
      </span>
    </button>
  );
}
