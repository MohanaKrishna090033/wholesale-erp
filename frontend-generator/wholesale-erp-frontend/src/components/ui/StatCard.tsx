import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  isPositiveTrend?: boolean;
  color?: 'blue' | 'emerald' | 'amber' | 'rose';
  isLoading?: boolean;
}

const colorMap = {
  blue: 'from-blue-500/10 to-transparent text-blue-500 border-blue-500/20',
  emerald: 'from-emerald-500/10 to-transparent text-emerald-500 border-emerald-500/20',
  amber: 'from-amber-500/10 to-transparent text-amber-500 border-amber-500/20',
  rose: 'from-rose-500/10 to-transparent text-rose-500 border-rose-500/20',
};

export const StatCard: React.FC<StatCardProps> = ({
  title, value, icon: Icon, trend, isPositiveTrend = true, color = 'blue', isLoading = false
}) => {
  if (isLoading) {
    return <div className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-800/50 animate-pulse border border-slate-200/60 dark:border-slate-800" />;
  }

  return (
    <div className="p-6 rounded-2xl glass-panel relative overflow-hidden transition-all duration-300 hover:shadow-soft hover:-translate-y-0.5 group">
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br ${colorMap[color].split(' ')[0]} blur-xl group-hover:scale-150 transition-transform`} />
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</span>
        <div className={`p-2.5 rounded-xl border ${colorMap[color].split(' ').slice(1).join(' ')} bg-white/50 dark:bg-slate-900/50`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="relative z-10">
        <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</h3>
        {trend && (
          <p className={`text-xs font-semibold mt-1.5 flex items-center gap-1 ${isPositiveTrend ? 'text-emerald-500' : 'text-rose-500'}`}>
            {isPositiveTrend ? '↑' : '↓'} {trend} <span className="text-slate-400 font-normal">vs last month</span>
          </p>
        )}
      </div>
    </div>
  );
};
