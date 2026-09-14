import React, { useState } from 'react';
import { 
  Receipt, 
  Trash2, 
  Search, 
  Smartphone, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Filter,
  Eye
} from 'lucide-react';
import { formatINR } from './MetricCards';

export default function TransactionList({ transactions = [], onDelete, onSelectTransaction }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const filtered = transactions.filter((txn) => {
    const matchesSearch = 
      txn.merchant?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.source?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterType === 'ALL') return matchesSearch;
    if (filterType === 'EXPENSE') return matchesSearch && txn.type === 'EXPENSE';
    if (filterType === 'INCOME') return matchesSearch && txn.type === 'INCOME';
    if (filterType === 'PHONEPE') return matchesSearch && txn.source === 'PhonePe';
    return matchesSearch;
  });

  return (
    <div className="bg-white rounded-3xl p-5 lg:p-6 border border-[#E8ECF2] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] mt-6">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="font-bold text-lg text-[#12141A] flex items-center gap-2">
            <Receipt className="w-5 h-5 text-gray-700" />
            Live Transactions &amp; SMS History
          </h3>
          <p className="text-xs text-gray-400 font-medium mt-0.5">
            Real-time feed from PhonePe, UPI &amp; Bank notifications ({filtered.length} items)
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center flex-wrap gap-2">
          {['ALL', 'EXPENSE', 'INCOME', 'PHONEPE'].map((f) => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                filterType === f
                  ? 'bg-[#12141A] text-white shadow-sm'
                  : 'bg-[#F4F5F8] text-gray-500 hover:text-black'
              }`}
            >
              {f === 'PHONEPE' ? 'PhonePe' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by merchant, category, or note..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-[#F4F5F8] border border-transparent focus:border-gray-300 focus:bg-white rounded-2xl text-xs sm:text-sm font-medium outline-none transition-all"
        />
      </div>

      {/* Transaction Table / Items */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-500">No transactions found</p>
          <p className="text-xs text-gray-400 mt-1">Try changing search filters or sync SMS messages.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 overflow-x-auto">
          {filtered.map((txn) => {
            const isExpense = txn.type === 'EXPENSE';
            const formattedDate = new Intl.DateTimeFormat('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
            }).format(new Date(txn.date));

            return (
              <div
                key={txn.id}
                className="flex items-center justify-between py-3.5 px-2 hover:bg-[#F9FAFB] rounded-2xl transition-colors group"
              >
                {/* Left: Icon & Merchant Info */}
                <div className="flex items-center gap-3.5 min-w-0 pr-2">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    isExpense ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {isExpense ? (
                      <ArrowUpRight className="w-5 h-5" />
                    ) : (
                      <ArrowDownLeft className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-[#12141A] truncate max-w-[180px] sm:max-w-[260px]">
                        {txn.merchant}
                      </h4>
                      {txn.source && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          txn.source === 'PhonePe'
                            ? 'bg-purple-100 text-[#5F259F]'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {txn.source}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-medium mt-0.5">
                      <span>{txn.category || 'General'}</span>
                      <span>•</span>
                      <span>{formattedDate}</span>
                      {txn.account && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-[11px]">{txn.account}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Actions */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-sm sm:text-base font-extrabold font-mono text-right ${
                    isExpense ? 'text-[#12141A]' : 'text-emerald-600'
                  }`}>
                    {isExpense ? '-' : '+'} {formatINR(txn.amount)}
                  </span>

                  <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    {txn.rawSms && (
                      <button
                        onClick={() => onSelectTransaction && onSelectTransaction(txn)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
                        title="View Raw SMS text"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onDelete && onDelete(txn.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete Transaction"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
