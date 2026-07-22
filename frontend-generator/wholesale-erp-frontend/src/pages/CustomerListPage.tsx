import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Customer } from '../types';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Search, Plus, Phone, Mail, ShieldAlert } from 'lucide-react';

export const CustomerListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: async () => {
      const res = await api.get(`/customers?search=${search}&limit=20`);
      return res.data;
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post('/customers', payload);
      return data.data;
    },
    onSuccess: () => {
      toast.success('Customer account created successfully');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsModalOpen(false);
      reset();
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Customer Accounts</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage B2B wholesale buyers, credit limits, and contact ledgers.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm shadow-soft hover:bg-blue-700 transition-colors shrink-0 self-start"
        >
          <Plus className="w-4 h-4" /> Add Customer Account
        </button>
      </div>

      <div className="p-4 rounded-2xl glass-panel flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Code, Name, Phone, or GST..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-800 dark:text-white placeholder-slate-400"
          />
        </div>
      </div>

      <div className="rounded-2xl glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
                <th className="py-3 px-6">Customer Code</th>
                <th className="py-3 px-6">Company Name</th>
                <th className="py-3 px-6">Contact Info</th>
                <th className="py-3 px-6">GSTIN</th>
                <th className="py-3 px-6 text-right">Outstanding Debt</th>
                <th className="py-3 px-6 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
              {isLoading && (
                <tr><td colSpan={6} className="py-8 text-center text-slate-400 animate-pulse">Loading directory...</td></tr>
              )}
              {data?.data?.map((customer: Customer) => (
                <tr key={customer.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                  <td className="py-4 px-6 font-mono text-xs font-bold text-blue-500">{customer.code}</td>
                  <td className="py-4 px-6">
                    <p className="font-bold text-slate-800 dark:text-white">{customer.name}</p>
                    <div className="flex gap-1 mt-1">
                      {customer.tags?.map((t) => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-6 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <Phone className="w-3 h-3 text-slate-400" /> {customer.phone}
                    </div>
                    {customer.email && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Mail className="w-3 h-3" /> {customer.email}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-6 font-mono text-xs text-slate-500">{customer.gstNumber || 'Unregistered'}</td>
                  <td className="py-4 px-6 text-right font-bold text-slate-800 dark:text-white">
                    ₹{Number(customer.outstandingAmount).toLocaleString('en-IN')}
                    {customer.outstandingAmount > customer.creditLimit && (
                      <span title="Exceeded Credit Limit" className="inline-block ml-1 text-rose-500"><ShieldAlert className="w-4 h-4 inline" /></span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${customer.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                      {customer.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 overflow-y-auto space-y-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">New Wholesale Buyer</h2>
            <form onSubmit={handleSubmit((values) => createCustomerMutation.mutate(values))} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-500">Company Name *</label>
                <input required {...register('name')} className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-500">Phone Number *</label>
                  <input required {...register('phone')} className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-sm" />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-500">GSTIN Number</label>
                  <input {...register('gstNumber')} placeholder="36AAAAA0000A1Z5" className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-sm uppercase font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-500">Credit Limit (₹)</label>
                  <input type="number" defaultValue={0} {...register('creditLimit')} className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-sm" />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-500">City</label>
                  <input required {...register('city')} className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-sm" />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-500">Address Line 1 *</label>
                <input required {...register('addressLine1')} className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-500">State *</label>
                  <input required {...register('state')} className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-sm" />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-500">Pincode *</label>
                  <input required {...register('pinCode')} className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-sm" />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold">Cancel</button>
                <button type="submit" disabled={createCustomerMutation.isPending} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-semibold shadow-soft">Save Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
