import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Notification } from '../types';
import toast from 'react-hot-toast';
import { Bell, CheckCircle2 } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications-list'],
    queryFn: async () => {
      const res = await api.get('/notifications?limit=50');
      return res.data;
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.patch('/notifications/read-all');
    },
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notification Center</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">System alerts, inventory warnings, and operational dispatches.</p>
        </div>
        <button
          onClick={() => markAllReadMutation.mutate()}
          disabled={markAllReadMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Mark all read
        </button>
      </div>

      <div className="rounded-2xl glass-panel divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
        {isLoading && <p className="p-8 text-center text-slate-400 animate-pulse text-sm">Loading notifications...</p>}
        {data?.data?.length === 0 && (
          <div className="p-12 text-center space-y-2">
            <Bell className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
            <p className="text-sm font-medium text-slate-500">No notifications in your inbox.</p>
          </div>
        )}
        {data?.data?.map((notif: Notification) => (
          <div
            key={notif.id}
            onClick={() => !notif.isRead && markReadMutation.mutate(notif.id)}
            className={`p-5 flex items-start gap-4 transition-colors cursor-pointer ${notif.isRead ? 'bg-transparent opacity-60' : 'bg-blue-500/5 hover:bg-blue-500/10'}`}
          >
            <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${notif.isRead ? 'bg-slate-400' : 'bg-blue-500 shadow-glow'}`} />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 dark:text-white text-sm">{notif.title}</h4>
                <span className="text-[10px] text-slate-400">{new Date(notif.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{notif.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
