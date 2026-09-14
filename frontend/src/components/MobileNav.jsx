import React from 'react';
import { Home, Receipt, Plus, Smartphone, BarChart3 } from 'lucide-react';

export default function MobileNav({ activeTab, setActiveTab, onOpenSmsModal, onOpenAddModal }) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/80 px-4 py-2 shadow-lg">
      <div className="flex items-center justify-around max-w-md mx-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
            activeTab === 'dashboard' ? 'text-black font-semibold' : 'text-gray-400'
          }`}
        >
          <Home className={`w-5 h-5 ${activeTab === 'dashboard' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px]">Home</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
            activeTab === 'history' ? 'text-black font-semibold' : 'text-gray-400'
          }`}
        >
          <Receipt className={`w-5 h-5 ${activeTab === 'history' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px]">Expenses</span>
        </button>

        {/* Floating Center Action for Add Expense */}
        <button
          onClick={onOpenAddModal}
          className="relative -top-4 w-12 h-12 rounded-full bg-[#12141A] text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          aria-label="Add Transaction"
        >
          <Plus className="w-6 h-6 text-[#BEF264]" />
        </button>

        <button
          onClick={onOpenSmsModal}
          className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all text-gray-400 hover:text-black"
        >
          <div className="relative">
            <Smartphone className="w-5 h-5 stroke-2" />
            <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-[#BEF264] rounded-full border-2 border-white"></span>
          </div>
          <span className="text-[10px]">SMS Sync</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
            activeTab === 'analytics' ? 'text-black font-semibold' : 'text-gray-400'
          }`}
        >
          <BarChart3 className={`w-5 h-5 ${activeTab === 'analytics' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px]">Analytics</span>
        </button>
      </div>
    </div>
  );
}
