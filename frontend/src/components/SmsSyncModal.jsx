import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { parseTransactionSMS, SAMPLE_SMS_DATA } from '../services/parser';
import { isNative, readDeviceSms, requestSmsPermission } from '../services/smsService';
import { formatINR } from './MetricCards';

export default function SmsSyncModal({ isOpen, onClose, onImportTransaction, onImportBatch }) {
  const [smsInput, setSmsInput] = useState(SAMPLE_SMS_DATA[0].sms);
  const [isReadingNative, setIsReadingNative] = useState(false);
  const [nativeMessage, setNativeMessage] = useState(null);

  if (!isOpen) return null;

  // Realtime parse
  const parsed = parseTransactionSMS(smsInput);

  const handleImport = () => {
    if (!parsed) return;
    onImportTransaction(parsed);
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 }
    });
    onClose();
  };

  const handleNativeSync = async () => {
    setIsReadingNative(true);
    setNativeMessage('Requesting SMS Inbox permissions...');
    try {
      const granted = await requestSmsPermission();
      if (!granted) {
        setNativeMessage('SMS Permission denied. Please grant permission in Android settings.');
        setIsReadingNative(false);
        return;
      }
      setNativeMessage('Reading recent Bank & UPI SMS messages...');
      const txns = await readDeviceSms();
      if (txns && txns.length > 0) {
        onImportBatch(txns);
        confetti({ particleCount: 100, spread: 70 });
        setNativeMessage(`Successfully imported ${txns.length} transactions from device!`);
        setTimeout(() => onClose(), 1200);
      } else {
        setNativeMessage('No new bank or UPI transaction messages found in inbox.');
      }
    } catch (err) {
      setNativeMessage('Native sync error: ' + err.message);
    } finally {
      setIsReadingNative(false);
    }
  };

  const loadSample = (sample) => {
    setSmsInput(sample.sms);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#BEF264] flex items-center justify-center text-[#12141A]">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#12141A]">
                Bank &amp; UPI SMS Tracker
              </h3>
              <p className="text-xs text-gray-400 font-medium">
                Automatic UCO Bank, PhonePe &amp; UPI Ingestion
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Native Android Action Card (or simulator banner) */}
        <div className="mt-4 p-4 rounded-2xl bg-[#F4F5F8] border border-gray-200/60">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-700 block">
                {isNative ? "Android Native Device Detected" : "Browser Sandbox / Web Mode"}
              </span>
              <span className="text-[11px] text-gray-400">
                {isNative
                  ? "Directly read SMS inbox via Capacitor plugin"
                  : "Simulate UCO Bank, PhonePe & Bank SMS in real time"}
              </span>
            </div>

            {isNative ? (
              <button
                onClick={handleNativeSync}
                disabled={isReadingNative}
                className="bg-[#12141A] hover:bg-black text-white text-xs font-bold py-2 px-3.5 rounded-xl transition-all shadow-sm"
              >
                {isReadingNative ? 'Reading...' : 'Auto-Sync SMS'}
              </button>
            ) : (
              <span className="text-[10px] font-bold bg-[#BEF264] text-[#1E3A0F] px-2 py-1 rounded-lg">
                Live Parser Ready
              </span>
            )}
          </div>
          {nativeMessage && (
            <p className="text-xs font-medium text-purple-700 mt-2">{nativeMessage}</p>
          )}
        </div>

        {/* Quick Sample SMS Pills */}
        <div className="mt-4">
          <label className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Click sample SMS format:</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_SMS_DATA.map((item, idx) => (
              <button
                key={idx}
                onClick={() => loadSample(item)}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-xl transition-all ${
                  idx === 0 
                    ? 'bg-[#12141A] text-white font-bold'
                    : 'bg-gray-100 hover:bg-[#BEF264] hover:text-[#12141A] text-gray-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Raw SMS Input Area */}
        <div className="mt-4">
          <label className="text-xs font-bold text-gray-500 mb-1.5 block">
            SMS Text / Notification Body
          </label>
          <textarea
            rows={3}
            value={smsInput}
            onChange={(e) => setSmsInput(e.target.value)}
            placeholder="Paste your bank or PhonePe transaction SMS here..."
            className="w-full p-3 bg-[#F4F5F8] border border-gray-200 focus:border-black focus:bg-white rounded-2xl text-xs font-mono outline-none transition-all resize-none"
          />
        </div>

        {/* Live Parsed Output Card */}
        <div className="mt-4">
          <label className="text-xs font-bold text-gray-500 mb-1.5 block">
            Extracted Transaction Entity
          </label>

          {parsed ? (
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-800">
                    Valid {parsed.type} Detected
                  </span>
                </div>
                <span className="text-sm font-extrabold font-mono text-[#12141A]">
                  {parsed.type === 'EXPENSE' ? '-' : '+'} {formatINR(parsed.amount)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-emerald-200/50">
                <div>
                  <span className="text-gray-400 block text-[10px]">Merchant / Payee</span>
                  <span className="font-bold text-gray-800">{parsed.merchant}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Category</span>
                  <span className="font-bold text-gray-800">{parsed.category}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Source / Bank</span>
                  <span className="font-bold text-purple-700">{parsed.source}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Account</span>
                  <span className="font-bold text-gray-800">{parsed.account || 'N/A'}</span>
                </div>
                {parsed.balance !== null && (
                  <div className="col-span-2 pt-1 border-t border-emerald-200/30">
                    <span className="text-gray-400 block text-[10px]">Available Account Balance</span>
                    <span className="font-bold text-emerald-700">{formatINR(parsed.balance)}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center gap-2 text-xs text-amber-800 font-medium">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                Could not detect amount or transaction keywords. Check if SMS has ₹, INR, or Rs.
              </span>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-500 hover:text-black hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!parsed}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold shadow-md transition-all ${
              parsed
                ? 'bg-[#12141A] hover:bg-black text-white active:scale-95'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span>Update &amp; Sync to App</span>
            <ArrowRight className="w-4 h-4 text-[#BEF264]" />
          </button>
        </div>
      </div>
    </div>
  );
}
