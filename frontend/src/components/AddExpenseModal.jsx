import React, { useState } from 'react';
import { X, PlusCircle, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import confetti from 'canvas-confetti';

const CATEGORIES = [
  'Food & Dining',
  'Shopping & Retail',
  'Transportation',
  'Bills & Utilities',
  'Entertainment',
  'Health & Medical',
  'Saving & Investment',
  'Salary & Income',
  'Other Payment',
];

const SOURCES = ['PhonePe', 'Google Pay', 'Paytm', 'Cash', 'Credit Card', 'Bank Transfer'];

export default function AddExpenseModal({ isOpen, onClose, onAddTransaction }) {
  const [type, setType] = useState('EXPENSE');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState('Food & Dining');
  const [source, setSource] = useState('PhonePe');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0 || !merchant.trim()) return;

    const newTxn = {
      id: 'manual_' + Date.now(),
      type,
      amount: numAmount,
      merchant: merchant.trim(),
      category,
      source,
      date: new Date().toISOString(),
      rawSms: null,
    };

    onAddTransaction(newTxn);
    confetti({ particleCount: 70, spread: 50 });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#12141A] flex items-center justify-center text-[#BEF264]">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#12141A]">Add Transaction</h3>
              <p className="text-xs text-gray-400 font-medium">Record a manual expense or income</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2 bg-[#F4F5F8] p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                type === 'EXPENSE'
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Expense</span>
            </button>
            <button
              type="button"
              onClick={() => setType('INCOME')}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                type === 'INCOME'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Income</span>
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1">Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                ₹
              </span>
              <input
                type="number"
                step="any"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 bg-[#F4F5F8] border border-gray-200 focus:border-black focus:bg-white rounded-2xl text-sm font-bold outline-none transition-all"
              />
            </div>
          </div>

          {/* Merchant / Payee */}
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1">
              {type === 'EXPENSE' ? 'Merchant / Recipient' : 'Payer / Source'}
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Swiggy, Apple Store, Client Invoice"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#F4F5F8] border border-gray-200 focus:border-black focus:bg-white rounded-2xl text-xs font-medium outline-none transition-all"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#F4F5F8] border border-gray-200 focus:border-black focus:bg-white rounded-2xl text-xs font-medium outline-none transition-all"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method / Source */}
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1">Payment Method</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#F4F5F8] border border-gray-200 focus:border-black focus:bg-white rounded-2xl text-xs font-medium outline-none transition-all"
            >
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-black"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-[#12141A] hover:bg-black text-white text-xs font-bold shadow-md transition-all active:scale-95"
            >
              Save Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
