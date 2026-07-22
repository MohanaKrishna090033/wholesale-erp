import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { ActivityLog } from '../types';
import { Activity } from 'lucide-react';

export const ActivityLogsPage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: async () => {
      const res = await api.get('/activity?limit=50');
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Audit Timeline</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Immutable chronological record of user sessions, stock updates, and challan confirmations.</p>
      </div>

      <div className="p-6 rounded-2xl glass-panel">
        {isLoading && <p className="text-sm text-slate-400 animate-pulse">Loading system ledger...</p>}
        
        <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {data?.data?.map((log: ActivityLog) => (
            <div key={log.id} className="relative flex items-start gap-4 pl-8 group">
              <div className="absolute left-1.5 top-1 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-white dark:ring-slate-900 flex items-center justify-center">
                <Activity className="w-2.5 h-2.5 text-white" />
              </div>
              <div className="flex-1 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-blue-500 uppercase font-mono">{log.action}</span>
                  <span className="text-slate-400">{new Date(log.createdAt).toLocaleString('en-IN')}</span>
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{log.entityLabel || log.entityType}</p>
                {log.user && (
                  <p className="text-xs text-slate-400 mt-2">Executed by: <span className="text-slate-300 font-semibold">{log.user.name}</span> ({log.user.role})</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
