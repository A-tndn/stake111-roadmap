'use client';

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'teal' | 'orange' | 'green' | 'red' | 'blue' | 'purple';
  subtitle?: string;
}

const colorMap = {
  teal: 'bg-brand-teal/10 text-brand-teal',
  orange: 'bg-brand-orange/10 text-brand-orange',
  green: 'bg-green-50 text-green-600',
  red: 'bg-red-50 text-red-600',
  blue: 'bg-blue-50 text-blue-600',
  purple: 'bg-purple-50 text-purple-600',
};

const valueColorMap = {
  teal: 'text-brand-teal',
  orange: 'text-brand-orange',
  green: 'text-green-600',
  red: 'text-red-600',
  blue: 'text-blue-600',
  purple: 'text-purple-600',
};

export default function StatsCard({ title, value, icon: Icon, color = 'teal', subtitle }: StatsCardProps) {
  return (
    <div className="bg-card rounded-xl p-4 shadow-sm border hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium">{title}</p>
          <p className={cn('text-2xl font-bold mt-1', valueColorMap[color])}>{value}</p>
          {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <div className={cn('p-2 rounded-lg', colorMap[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
