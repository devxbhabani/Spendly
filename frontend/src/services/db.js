import Dexie from 'dexie';
import { categorizeMerchant } from '../utils/parser';
import { API_BASE_URL } from './api';

// Module 2: IndexedDB Local-First Database (Dexie.js)
export const db = new Dexie('PersonalExpenseDB');

db.version(1).stores({
  transactions: '++id, amount, type, merchant, category, date, source, account',
});

/**
 * Save new transaction locally and sync to MongoDB backend
 */
export async function saveTransaction(txn) {
  const category = txn.category || categorizeMerchant(txn.merchant, txn.rawSms || '');
  const entry = {
    ...txn,
    category,
    amount: Number(txn.amount),
    date: txn.date || new Date().toISOString(),
  };

  // 1. Save to local IndexedDB (instant offline-first access)
  const localId = await db.transactions.add(entry);

  // 2. Sync to MongoDB Atlas backend API if online
  try {
    const res = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (res.ok) {
      console.log('✓ Successfully synced transaction to MongoDB Atlas');
    }
  } catch (err) {
    console.warn('Backend offline, queued locally in IndexedDB:', err.message);
  }

  return localId;
}

/**
 * Query transactions by month (e.g., month = 8 for September, 0-indexed)
 */
export async function getTransactionsByMonth(year, month) {
  const all = await db.transactions.toArray();
  return all.filter((t) => {
    const d = new Date(t.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

/**
 * Get all transactions sorted by date descending
 */
export async function getAllTransactions() {
  return await db.transactions.orderBy('date').reverse().toArray();
}

/**
 * Auto-categorize helper
 */
export function autoCategorize(merchant, rawText = '') {
  return categorizeMerchant(merchant, rawText);
}
