const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function fetchTransactions() {
  const res = await fetch(`${API_BASE_URL}/transactions`);
  if (!res.ok) throw new Error(`Failed to fetch transactions: ${res.statusText}`);
  return await res.json();
}

export async function createTransaction(data) {
  const res = await fetch(`${API_BASE_URL}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create transaction: ${res.statusText}`);
  return await res.json();
}

export async function batchCreateTransactions(transactionsArray) {
  const res = await fetch(`${API_BASE_URL}/transactions/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transactionsArray),
  });
  if (!res.ok) throw new Error(`Failed to batch import transactions: ${res.statusText}`);
  return await res.json();
}

export async function deleteTransaction(id) {
  const res = await fetch(`${API_BASE_URL}/transactions/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete transaction: ${res.statusText}`);
  return await res.json();
}

export async function clearAllTransactions() {
  const res = await fetch(`${API_BASE_URL}/transactions`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to clear transactions: ${res.statusText}`);
  return await res.json();
}

export async function fetchAnalytics() {
  const res = await fetch(`${API_BASE_URL}/analytics`);
  if (!res.ok) throw new Error(`Failed to fetch analytics: ${res.statusText}`);
  return await res.json();
}
