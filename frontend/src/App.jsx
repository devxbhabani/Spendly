import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Header from './components/Header';
import MetricCards from './components/MetricCards';
import SpendingChart from './components/SpendingChart';
import CalendarCard from './components/CalendarCard';
import CategoryDonut from './components/CategoryDonut';
import TransactionList from './components/TransactionList';
import SmsSyncModal from './components/SmsSyncModal';
import AddExpenseModal from './components/AddExpenseModal';
import { 
  fetchTransactions, 
  fetchAnalytics, 
  createTransaction, 
  batchCreateTransactions, 
  deleteTransaction, 
  clearAllTransactions 
} from './services/api';
import { parseTransactionSMS } from './services/parser';
import { isNative, readDeviceSms, requestSmsPermission } from './services/smsService';
import { Database, CheckCircle2, AlertCircle, Smartphone, ArrowRight, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('spendly_userName') || 'Bhabani';
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dbStatus, setDbStatus] = useState('connecting');
  const [selectedRawSms, setSelectedRawSms] = useState(null);

  // Quick SMS Input Bar state
  const [quickSms, setQuickSms] = useState('');
  const [quickParseResult, setQuickParseResult] = useState(null);

  const handleUpdateUserName = (newName) => {
    const trimmed = (newName || '').trim();
    if (trimmed) {
      setUserName(trimmed);
      localStorage.setItem('spendly_userName', trimmed);
    }
  };

  // Load real data from Express + MongoDB Atlas backend
  const loadData = async () => {
    try {
      setIsSyncing(true);
      const [txns, stats] = await Promise.all([
        fetchTransactions(),
        fetchAnalytics(),
      ]);
      setTransactions(txns);
      setAnalytics(stats);
      setDbStatus('connected');
    } catch (err) {
      console.error('Error fetching backend data:', err);
      setDbStatus('error');
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsSyncing(false), 300);
    }
  };

  // Automatic Native Android SMS sync on mount & periodic polling
  useEffect(() => {
    loadData();

    if (isNative) {
      const autoSyncAndroid = async () => {
        try {
          const granted = await requestSmsPermission();
          if (granted) {
            const deviceTxns = await readDeviceSms();
            if (deviceTxns && deviceTxns.length > 0) {
              await batchCreateTransactions(deviceTxns);
              await loadData();
            }
          }
        } catch (e) {
          console.warn('Auto native SMS sync failed:', e);
        }
      };

      autoSyncAndroid();
      const interval = setInterval(autoSyncAndroid, 45000);
      return () => clearInterval(interval);
    }
  }, []);

  // Quick SMS Parser listener
  const handleQuickSmsChange = (text) => {
    setQuickSms(text);
    if (text.trim().length > 15) {
      const parsed = parseTransactionSMS(text);
      setQuickParseResult(parsed);
    } else {
      setQuickParseResult(null);
    }
  };

  const handleQuickSmsSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!quickParseResult) return;

    try {
      await createTransaction(quickParseResult);
      confetti({ particleCount: 70, spread: 60 });
      setQuickSms('');
      setQuickParseResult(null);
      await loadData();
    } catch (err) {
      alert('Failed to save SMS transaction: ' + err.message);
    }
  };

  // Handlers communicating directly with MongoDB Atlas
  const handleAddTransaction = async (newTxn) => {
    try {
      await createTransaction(newTxn);
      await loadData();
    } catch (err) {
      alert('Failed to save to database: ' + err.message);
    }
  };

  const handleImportBatch = async (batch) => {
    try {
      await batchCreateTransactions(batch);
      await loadData();
    } catch (err) {
      alert('Failed to batch import to database: ' + err.message);
    }
  };

  const handleDeleteTransaction = async (id) => {
    try {
      await deleteTransaction(id);
      await loadData();
    } catch (err) {
      alert('Failed to delete transaction: ' + err.message);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to delete all transactions from your MongoDB database?')) {
      try {
        await clearAllTransactions();
        await loadData();
      } catch (err) {
        alert('Failed to clear database: ' + err.message);
      }
    }
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      alert('No transactions to export.');
      return;
    }
    const headers = ['ID', 'Type', 'Amount', 'Merchant', 'Category', 'Source', 'Date', 'Account'];
    const rows = transactions.map(t => [
      t.id,
      t.type,
      t.amount,
      `"${(t.merchant || '').replace(/"/g, '""')}"`,
      `"${(t.category || '').replace(/"/g, '""')}"`,
      t.source || '',
      t.date,
      t.account || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `expense_tracker_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Extract pure counts
  const expenseCount = transactions.filter((t) => t.type === 'EXPENSE').length;
  const incomeCount = transactions.filter((t) => t.type === 'INCOME').length;
  const phonePeCount = transactions.filter((t) => t.type === 'EXPENSE' && (t.source === 'PhonePe' || /phonepe/i.test(t.rawSms || ''))).length;

  return (
    <div className="flex min-h-screen bg-[#F4F5F8] text-[#12141A]">
      {/* Desktop Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onOpenSmsModal={() => setIsSmsModalOpen(true)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {/* Header */}
          <Header 
            userName={userName}
            onUpdateUserName={handleUpdateUserName}
            onExport={handleExportCSV}
            onRefresh={loadData}
            onOpenSmsModal={() => setIsSmsModalOpen(true)}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            isSyncing={isSyncing}
          />

          {/* Database Status Banner */}
          <div className="mb-4 flex items-center justify-between px-4 py-2.5 rounded-2xl bg-white border border-[#E8ECF2] shadow-sm text-xs font-semibold">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <span className="text-gray-600">Database Engine:</span>
              <span className="text-black font-bold">MongoDB Atlas</span>
            </div>

            <div className="flex items-center gap-1.5">
              {dbStatus === 'connected' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-emerald-700 font-bold">Connected (Real DB)</span>
                </>
              ) : dbStatus === 'connecting' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <span className="text-amber-700">Connecting...</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-red-600">Connection Error</span>
                </>
              )}
            </div>
          </div>

          {/* Quick SMS Auto-Tracker Input Bar */}
          <div className="mb-6 bg-white rounded-3xl p-4 sm:p-5 border border-[#E8ECF2] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#BEF264] flex items-center justify-center text-black">
                  <Smartphone className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-gray-800">
                  Instant SMS Tracker (UCO Bank, PhonePe, UPI &amp; Bank Alerts)
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleQuickSmsChange("A/c XX4723 Debited with Rs.161.00 on 09-09-2026 by UCO-UPI.Avl Bal Rs.42.39. Report Dispute https://spgrs.ucoonline.bank.in/Home_Page.jsp")}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-xl transition-colors"
              >
                Paste UCO Bank SMS
              </button>
            </div>

            <form onSubmit={handleQuickSmsSubmit} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={quickSms}
                onChange={(e) => handleQuickSmsChange(e.target.value)}
                placeholder="Paste incoming SMS here (e.g. A/c XX4723 Debited with Rs.161.00 on 09-09-2026 by UCO-UPI...)"
                className="flex-1 px-4 py-2.5 bg-[#F4F5F8] border border-gray-200 focus:border-black focus:bg-white rounded-2xl text-xs font-mono outline-none transition-all"
              />
              <button
                type="submit"
                disabled={!quickParseResult}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
                  quickParseResult
                    ? 'bg-[#12141A] hover:bg-black text-white active:scale-95'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <span>{quickParseResult ? `Auto-Track (₹${quickParseResult.amount})` : 'Auto-Track SMS'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#BEF264]" />
              </button>
            </form>

            {/* Live Parsing Preview */}
            {quickParseResult && (
              <div className="mt-2.5 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="font-bold text-gray-800">
                    {quickParseResult.source}: {quickParseResult.merchant}
                  </span>
                  <span className="text-gray-500 font-mono text-[11px]">
                    {quickParseResult.account}
                  </span>
                  <span className="bg-emerald-200/60 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                    {quickParseResult.category}
                  </span>
                </div>
                <div className="font-extrabold text-sm text-[#12141A] font-mono">
                  {quickParseResult.type === 'EXPENSE' ? '-' : '+'} ₹{quickParseResult.amount}
                </div>
              </div>
            )}
          </div>

          {/* 4 Metric Summary Cards (Pure Real Database Values) */}
          <MetricCards 
            totalExpense={analytics?.totalExpense || 0}
            totalIncome={analytics?.totalIncome || 0}
            phonePeSpend={analytics?.phonePeSpend || 0}
            avgDailySpend={analytics?.avgDailySpend || 0}
            expenseCount={expenseCount}
            incomeCount={incomeCount}
            phonePeCount={phonePeCount}
          />

          {/* Grid: Real Dual Bar Chart & Calendar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
            <div className="lg:col-span-7 xl:col-span-8">
              <SpendingChart monthlyData={analytics?.monthlyBreakdown || []} />
            </div>
            <div className="lg:col-span-5 xl:col-span-4">
              <CalendarCard calendarDays={analytics?.calendarDays || {}} />
            </div>
          </div>

          {/* Grid: Category Donut & Real Live Transaction List */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 xl:col-span-4">
              <CategoryDonut categories={analytics?.categoryBreakdown || []} />
            </div>
            <div className="lg:col-span-7 xl:col-span-8 -mt-6 lg:mt-0">
              <TransactionList 
                transactions={transactions} 
                onDelete={handleDeleteTransaction}
                onSelectTransaction={(txn) => setSelectedRawSms(txn.rawSms)}
              />
            </div>
          </div>

          {/* Footer with Clear All DB option */}
          <div className="mt-10 flex items-center justify-between text-xs text-gray-400 border-t border-gray-200/60 pt-4">
            <span>Vendify • 100% Real MongoDB Atlas Integration</span>
            {transactions.length > 0 && (
              <button
                onClick={handleClearAll}
                className="hover:text-red-600 underline transition-colors"
              >
                Clear Database Transactions
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSmsModal={() => setIsSmsModalOpen(true)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      {/* Modals */}
      <SmsSyncModal 
        isOpen={isSmsModalOpen}
        onClose={() => setIsSmsModalOpen(false)}
        onImportTransaction={handleAddTransaction}
        onImportBatch={handleImportBatch}
      />

      <AddExpenseModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddTransaction={handleAddTransaction}
      />

      {/* Raw SMS Inspector Modal */}
      {selectedRawSms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <h4 className="font-bold text-base text-[#12141A] mb-2">Raw SMS Notification</h4>
            <div className="bg-[#F4F5F8] p-4 rounded-2xl text-xs font-mono text-gray-700 leading-relaxed break-words">
              {selectedRawSms}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedRawSms(null)}
                className="px-4 py-2 bg-[#12141A] text-white text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
