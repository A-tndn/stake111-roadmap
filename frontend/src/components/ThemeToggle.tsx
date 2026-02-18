'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  variant?: 'icon' | 'full';
}

export default function ThemeToggle({ className, variant = 'icon' }: ThemeToggleProps) {
  const { theme, setTheme } = useThemeStore();

  const cycleTheme = () => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(next);
  };

  if (variant === 'full') {
    return (
      <div className={cn('flex items-center gap-1 bg-muted rounded-lg p-1', className)}>
        {[
          { value: 'light' as const, icon: Sun, label: 'Light' },
          { value: 'dark' as const, icon: Moon, label: 'Dark' },
          { value: 'system' as const, icon: Monitor, label: 'System' },
        ].map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all',
              theme === value
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <button
      onClick={cycleTheme}
      className={cn(
        'p-1.5 rounded-lg transition hover:bg-card/10',
        className
      )}
      title={`Theme: ${theme}`}
    >
      {theme === 'dark' ? (
        <Moon className="w-4.5 h-4.5" />
      ) : theme === 'light' ? (
        <Sun className="w-4.5 h-4.5" />
      ) : (
        <Monitor className="w-4.5 h-4.5" />
      )}
    </button>
  );
}
