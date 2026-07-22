import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { StatCard } from '../components/ui/StatCard';
import { IndianRupee, Users, ShoppingCart, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user, hasRole } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/stats');
      return data.data.stats;
    },
  });

  const { data: salesChart, isLoading: chartLoading } = useQuery({
    queryKey: ['dashboard-chart'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/sales-chart?days=30');
      return data.data;
    },
    enabled: hasRole(['ADMIN', 'ACCOUNTS']),
  });

  const { data: lowStock } = useQuery({
    queryKey: ['dashboard-low-stock'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/low-stock-alerts');
      return data.data;
    },
    enabled: hasRole(['ADMIN', 'WAREHOUSE']),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Operational Overview</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Real-time metrics and alerts for your role ({user?.role}).</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {hasRole(['ADMIN', 'ACCOUNTS']) && (
          <StatCard
            title="Total Revenue"
            value={`₹${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`}
            icon={IndianRupee}
            color="emerald"
            trend="12.4%"
            isLoading={statsLoading}
          />
        )}
        {hasRole(['ADMIN', 'SALES', 'ACCOUNTS']) && (
          <StatCard
            title="Active Customers"
            value={stats?.totalCustomers || 0}
            icon={Users}
            color="blue"
            trend="4.1%"
            isLoading={statsLoading}
          />
        )}
        {hasRole(['ADMIN', 'SALES', 'WAREHOUSE']) && (
          <StatCard
            title="Today's Orders"
            value={stats?.todaysSalesCount || 0}
            icon={ShoppingCart}
            color="amber"
            isLoading={statsLoading}
          />
        )}
        {hasRole(['ADMIN', 'WAREHOUSE']) && (
          <StatCard
            title="Low Stock Alerts"
            value={stats?.lowStockCount || 0}
            icon={AlertTriangle}
            color="rose"
            isPositiveTrend={false}
            trend="Needs attention"
            isLoading={statsLoading}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {hasRole(['ADMIN', 'ACCOUNTS']) && (
          <div className="lg:col-span-2 p-6 rounded-2xl glass-panel space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Revenue Trend (Last 30 Days)</h3>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500">Live Feed</span>
            </div>
            
            <div className="h-72 w-full">
              {chartLoading ? (
                <div className="h-full w-full rounded-xl bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesChart || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
                      formatter={(val: any) => [`₹${Number(val || 0).toLocaleString('en-IN')}`, 'Revenue']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {hasRole(['ADMIN', 'WAREHOUSE']) && (
          <div className="p-6 rounded-2xl glass-panel flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Stock Warnings</h3>
                <Link to="/inventory" className="text-xs text-blue-500 font-semibold hover:underline">View All</Link>
              </div>
              
              <div className="space-y-3">
                {!lowStock || lowStock.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4 text-center">All inventory levels are healthy.</p>
                ) : (
                  lowStock.slice(0, 5).map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{item.name}</p>
                        <p className="text-xs text-slate-400 font-mono">SKU: {item.sku}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-rose-500">{item.currentStock} {item.unit}</span>
                        <p className="text-[10px] text-slate-400">Min: {item.minStockLevel}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Link 
              to="/challans" 
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm text-center shadow-soft hover:opacity-95 transition-opacity"
            >
              Manage Sales Challans
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
