import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Customer, Product } from '../types';
import toast from 'react-hot-toast';
import { Trash2, ShieldCheck } from 'lucide-react';

interface ChallanFormValues {
  customerId: string;
  discountPercent: number;
  taxPercent: number;
  notes: string;
  items: Array<{
    productId: string;
    productName: string;
    productSku: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    availableStock: number;
  }>;
}

export const ChallanBuilderPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [productSearch, setProductSearch] = useState('');

  const { register, control, handleSubmit, watch } = useForm<ChallanFormValues>({
    defaultValues: {
      discountPercent: 0,
      taxPercent: 18,
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const { data: customers } = useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => {
      const { data } = await api.get('/customers?limit=100&isActive=true');
      return data.data as Customer[];
    },
  });

  const { data: products } = useQuery({
    queryKey: ['products-search', productSearch],
    queryFn: async () => {
      const { data } = await api.get(`/inventory/products?search=${productSearch}&limit=10&isActive=true`);
      return data.data as Product[];
    },
    enabled: productSearch.length > 1,
  });

  const itemsWatch = watch('items');
  const discountPercentWatch = watch('discountPercent') || 0;
  const taxPercentWatch = watch('taxPercent') || 18;

  const subtotal = itemsWatch.reduce((sum, item) => {
    const lineSub = (item.unitPrice || 0) * (item.quantity || 0);
    const lineDisc = (lineSub * (item.discount || 0)) / 100;
    return sum + (lineSub - lineDisc);
  }, 0);

  const discountAmount = (subtotal * discountPercentWatch) / 100;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * taxPercentWatch) / 100;
  const grandTotal = taxableAmount + taxAmount;

  const addProductToCart = (prod: Product) => {
    if (fields.some(f => f.productId === prod.id)) {
      toast.error('Product is already in the challan list');
      return;
    }
    append({
      productId: prod.id,
      productName: prod.name,
      productSku: prod.sku,
      unit: prod.unit,
      quantity: 1,
      unitPrice: Number(prod.sellingPrice),
      discount: 0,
      availableStock: prod.currentStock,
    });
    setProductSearch('');
  };

  const createChallanMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post('/challans', payload);
      return data.data;
    },
    onSuccess: (newChallan) => {
      toast.success(`Draft Challan ${newChallan.challanNumber} created!`);
      queryClient.invalidateQueries({ queryKey: ['challans-list'] });
    },
  });

  const onSubmit = (data: ChallanFormValues) => {
    if (data.items.length === 0) {
      toast.error('Please add at least one product line item.');
      return;
    }

    for (const item of data.items) {
      if (item.quantity > item.availableStock) {
        toast.error(`Stock Underflow: ${item.productName} only has ${item.availableStock} ${item.unit} available.`);
        return;
      }
    }

    const payload = {
      customerId: data.customerId,
      discountPercent: Number(data.discountPercent),
      taxPercent: Number(data.taxPercent),
      notes: data.notes,
      items: data.items.map(i => ({
        productId: i.productId,
        quantity: Number(i.quantity),
        discount: Number(i.discount),
      })),
    };

    createChallanMutation.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create Sales Challan</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Draft sales invoice with live inventory check and tax validation.</p>
        </div>
        <button
          type="submit"
          disabled={createChallanMutation.isPending}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm shadow-soft hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <ShieldCheck className="w-4 h-4" />
          {createChallanMutation.isPending ? 'Saving Draft...' : 'Save Draft Challan'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl glass-panel space-y-4 md:col-span-1">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">1. Select Buyer</h3>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Customer Account *</label>
            <select
              {...register('customerId', { required: true })}
              className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-sm font-medium text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Customer...</option>
              {customers?.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Global Discount (%)</label>
            <input
              type="number" step="0.1" max="100"
              {...register('discountPercent')}
              className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-sm text-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">GST Tax Slab (%)</label>
            <select
              {...register('taxPercent')}
              className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-sm font-medium text-slate-800 dark:text-white"
            >
              <option value="5">5% GST</option>
              <option value="12">12% GST</option>
              <option value="18">18% GST (Standard)</option>
              <option value="28">28% GST</option>
            </select>
          </div>
        </div>

        <div className="p-6 rounded-2xl glass-panel space-y-6 md:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">2. Line Items</h3>
            <div className="relative w-64">
              <input
                type="text"
                placeholder="Type to search SKU/Name..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full p-2 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border-none text-slate-800 dark:text-white placeholder-slate-400"
              />
              {products && products.length > 0 && (
                <div className="absolute left-0 right-0 top-10 z-50 rounded-xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden max-h-60 overflow-y-auto">
                  {products.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => addProductToCart(p)}
                      className="p-3 hover:bg-blue-500/10 cursor-pointer flex items-center justify-between text-xs border-b border-slate-100 dark:border-slate-700/50 last:border-none"
                    >
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white">{p.name}</p>
                        <p className="text-slate-400">SKU: {p.sku} | Stock: {p.currentStock} {p.unit}</p>
                      </div>
                      <span className="font-semibold text-blue-500">₹{p.sellingPrice}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase text-slate-400">
                  <th className="pb-2">Product</th>
                  <th className="pb-2 w-20">Qty</th>
                  <th className="pb-2 w-24">Price (₹)</th>
                  <th className="pb-2 w-20">Disc %</th>
                  <th className="pb-2 text-right">Total (₹)</th>
                  <th className="pb-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                {fields.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                      No products added. Search above to add items to this challan.
                    </td>
                  </tr>
                )}
                {fields.map((field, idx) => {
                  const qty = itemsWatch[idx]?.quantity || 0;
                  const price = itemsWatch[idx]?.unitPrice || 0;
                  const disc = itemsWatch[idx]?.discount || 0;
                  const lineTotal = (price * qty) * (1 - disc / 100);
                  const isStockWarning = qty > field.availableStock;

                  return (
                    <tr key={field.id} className="group">
                      <td className="py-3 pr-2">
                        <p className="font-semibold text-slate-800 dark:text-white text-xs">{field.productName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-400 font-mono">{field.productSku}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${isStockWarning ? 'bg-rose-500/10 text-rose-500 animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                            Stock: {field.availableStock} {field.unit}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-2">
                        <input
                          type="number" min="1"
                          {...register(`items.${idx}.quantity` as const)}
                          className={`w-full p-1.5 rounded-lg text-xs font-bold text-center border-none ${isStockWarning ? 'bg-rose-500/20 text-rose-500 ring-1 ring-rose-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white'}`}
                        />
                      </td>
                      <td className="py-3 pr-2">
                        <input
                          type="number" readOnly
                          {...register(`items.${idx}.unitPrice` as const)}
                          className="w-full p-1.5 rounded-lg text-xs bg-transparent border-none text-slate-500 cursor-not-allowed"
                        />
                      </td>
                      <td className="py-3 pr-2">
                        <input
                          type="number" min="0" max="100"
                          {...register(`items.${idx}.discount` as const)}
                          className="w-full p-1.5 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 border-none text-center text-slate-800 dark:text-white"
                        />
                      </td>
                      <td className="py-3 text-right font-bold text-slate-800 dark:text-white text-xs">
                        ₹{lineTotal.toFixed(2)}
                      </td>
                      <td className="py-3 text-right">
                        <button type="button" onClick={() => remove(idx)} className="text-slate-400 hover:text-rose-500 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-800 dark:text-white">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Global Discount ({discountPercentWatch}%):</span>
              <span className="font-semibold text-rose-500">-₹{discountAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Estimated GST ({taxPercentWatch}%):</span>
              <span className="font-semibold text-slate-800 dark:text-white">₹{taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-800 pt-2">
              <span>Grand Total:</span>
              <span className="text-blue-500">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
