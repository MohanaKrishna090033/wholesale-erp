import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Product } from '../types';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Package, AlertCircle } from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { register, handleSubmit, reset } = useForm();

  const { data: products, isLoading } = useQuery({
    queryKey: ['inventory-list'],
    queryFn: async () => {
      const { data } = await api.get('/inventory/products?limit=100');
      return data.data as Product[];
    },
  });

  const adjustStockMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post(`/inventory/products/${selectedProduct?.id}/stock`, payload);
      return data;
    },
    onSuccess: () => {
      toast.success('Stock ledger updated successfully');
      queryClient.invalidateQueries({ queryKey: ['inventory-list'] });
      setSelectedProduct(null);
      reset();
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inventory Catalog</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Monitor warehouse stock levels, set reorder points, and execute manual inventory adjustments.</p>
      </div>

      <div className="rounded-2xl glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
                <th className="py-3 px-6">SKU Code</th>
                <th className="py-3 px-6">Product Description</th>
                <th className="py-3 px-6">Category</th>
                <th className="py-3 px-6 text-right">Selling Price</th>
                <th className="py-3 px-6 text-center">Available Stock</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
              {isLoading && (
                <tr><td colSpan={6} className="py-8 text-center text-slate-400 animate-pulse">Loading warehouse catalog...</td></tr>
              )}
              {products?.map((prod) => {
                const isLow = prod.currentStock <= prod.minStockLevel;
                return (
                  <tr key={prod.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-mono text-xs font-bold text-slate-500">{prod.sku}</td>
                    <td className="py-4 px-6 font-bold text-slate-800 dark:text-white">{prod.name}</td>
                    <td className="py-4 px-6">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 font-semibold">{prod.category?.name || 'General'}</span>
                    </td>
                    <td className="py-4 px-6 text-right font-semibold text-slate-800 dark:text-white">₹{Number(prod.sellingPrice).toLocaleString('en-IN')}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${isLow ? 'bg-rose-500/10 text-rose-500 animate-pulse' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {isLow && <AlertCircle className="w-3.5 h-3.5" />}
                        {prod.currentStock} {prod.unit}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setSelectedProduct(prod)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white transition-colors"
                      >
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Package className="w-6 h-6 text-blue-500" />
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">{selectedProduct.name}</h3>
                <p className="text-xs text-slate-400 font-mono">Current Balance: {selectedProduct.currentStock} {selectedProduct.unit}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit((values) => adjustStockMutation.mutate(values))} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-500">Movement Type *</label>
                <select required {...register('type')} className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none font-semibold text-sm">
                  <option value="INWARD">INWARD (Stock Received from Supplier)</option>
                  <option value="OUTWARD">OUTWARD (Manual Removal / Scrap)</option>
                  <option value="ADJUSTMENT">ADJUSTMENT (Override Absolute Balance)</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-500">Quantity *</label>
                <input required type="number" min="1" {...register('quantity')} className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-sm font-bold" />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-500">Reference / Notes</label>
                <input {...register('notes')} placeholder="PO #1042 or Audited correction" className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-sm" />
              </div>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setSelectedProduct(null)} className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold">Cancel</button>
                <button type="submit" disabled={adjustStockMutation.isPending} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-semibold shadow-soft">Commit Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
