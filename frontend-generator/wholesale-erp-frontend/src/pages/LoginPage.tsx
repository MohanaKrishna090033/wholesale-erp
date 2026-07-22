import React from 'react';
import { useForm } from 'react-hook-form';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export const LoginPage: React.FC = () => {
  const { user, login } = useAuth();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (values: any) => {
    try {
      const { data } = await api.post('/auth/login', values);
      login(data.data.accessToken, data.data.user);
    } catch {
      toast.error('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md p-8 rounded-2xl bg-slate-800/80 border border-slate-700 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-blue-600 mx-auto flex items-center justify-center text-white font-bold text-xl shadow-glow">
            W
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Sign in to ERP Portal</h1>
          <p className="text-xs text-slate-400">Enter your internal employee credentials to continue</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                required
                type="email"
                defaultValue="admin@wholesale.com"
                {...register('email')}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                required
                type="password"
                defaultValue="Password123!"
                {...register('password')}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-soft transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/50 text-[11px] text-slate-400 space-y-1">
          <p className="font-semibold text-slate-300">Test Role Credentials:</p>
          <p>👑 Admin: <span className="font-mono text-blue-400">admin@wholesale.com</span></p>
          <p>💼 Sales: <span className="font-mono text-blue-400">sales@wholesale.com</span></p>
          <p>📦 Warehouse: <span className="font-mono text-blue-400">warehouse@wholesale.com</span></p>
          <p>📊 Accounts: <span className="font-mono text-blue-400">accounts@wholesale.com</span></p>
          <p className="text-[10px] text-slate-500 pt-1">Password for all roles: <span className="font-mono">Password123!</span></p>
        </div>
      </div>
    </div>
  );
};
