/**
 * Module 1: Robust Bank & UPI SMS Parser Engine
 * Handles PhonePe, GPay, Paytm, UCO Bank, SBI, HDFC, ICICI, etc.
 * Supports exact formats like:
 * "A/c XX4723 Debited with Rs.161.00 on 09-09-2026 by UCO-UPI.Avl Bal Rs.42.39. Report Dispute https://spgrs.ucoonline.bank.in/Home_Page.jsp"
 */

export function categorizeMerchant(merchantName, smsText = '') {
  const text = `${merchantName} ${smsText}`.toLowerCase();
  
  if (/(?:swiggy|zomato|starbucks|mcdonald|burger|pizza|cafe|restaurant|eats|dine|food|tea|coffee|bakery|subway|dominos|kfc)/i.test(text)) {
    return 'Food';
  }
  if (/(?:amazon|flipkart|myntra|zara|h&m|ajio|tata\s*cliq|nykaa|retail|store|mart|mall|shopping|meesho)/i.test(text)) {
    return 'Shopping';
  }
  if (/(?:uber|ola|rapido|metro|petrol|fuel|indian\s*oil|bharat\s*petrol|hp\s*cl|shell|railway|irctc|flight|indigo|air\s*india|fastag)/i.test(text)) {
    return 'Transport';
  }
  if (/(?:airtel|jio|vi|bescom|electricity|water|gas|wifi|broadband|recharge|billdesk|utility|dth|tatasky)/i.test(text)) {
    return 'Bills & Utilities';
  }
  if (/(?:netflix|spotify|bookmyshow|hotstar|prime|youtube|cinema|pvr|inox|gaming|steam|playstation)/i.test(text)) {
    return 'Entertainment';
  }
  if (/(?:apollo|pharmeasy|1mg|pharmacy|hospital|clinic|medplus|gym|cult|fitness|doctor)/i.test(text)) {
    return 'Health & Medical';
  }
  if (/(?:zerodha|groww|angelone|upstox|mutual\s*fund|sip|investment|bse|nse|crypto)/i.test(text)) {
    return 'Saving & Investment';
  }
  if (/(?:salary|allowance|bonus|payroll|dividend|pension)/i.test(text)) {
    return 'Salary';
  }
  if (/(?:uco|sbi|hdfc|icici|axis|pnb|canara|bank|upi)/i.test(text)) {
    return 'UPI & Bank Transfer';
  }

  return 'Other';
}

export function parseTransactionSMS(smsText) {
  if (!smsText || typeof smsText !== 'string') return null;

  const cleanText = smsText.replace(/\n/g, ' ').trim();

  // 1. Transaction Type: EXPENSE vs INCOME
  const isDebit = /(?:debited|paid|sent|withdrawn|spent|transferred\s+to|purchase|txn\s+of)/i.test(cleanText);
  const isCredit = /(?:credited|received|deposited|added|refunded|cashback)/i.test(cleanText);

  if (!isDebit && !isCredit) return null;

  // 2. Amount Extraction: Rs., INR, ₹ prefix handling
  const amountMatch = cleanText.match(/(?:RS|INR|₹|Rs\.?)\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (!amountMatch) return null;

  const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  if (isNaN(amount) || amount <= 0) return null;

  // 3. Merchant / VPA Identifier following 'to', 'at', 'vpa', 'by', 'for'
  let merchant = null;
  const merchantMatch = cleanText.match(/(?:to\s+(?:vpa\s+)?|at\s+|info[\s*:]+|beneficiary\s+|for\s+|by\s+)([a-zA-Z0-9.\-_@ ]{2,30}?)(?:\.|\s+on|\s+ref|\s+via|\s+avl|\s+bal|\s+upi|\s+report|$)/i);
  
  if (merchantMatch && merchantMatch[1]) {
    merchant = merchantMatch[1].trim();
  }

  // Fallbacks for known sources
  if (!merchant || merchant.length < 2) {
    if (/uco-upi|ucoonline|uco bank/i.test(cleanText)) {
      merchant = 'UCO-UPI';
    } else if (/phonepe/i.test(cleanText)) {
      merchant = 'PhonePe';
    } else if (/gpay|google pay/i.test(cleanText)) {
      merchant = 'Google Pay';
    } else if (/paytm/i.test(cleanText)) {
      merchant = 'Paytm';
    } else {
      merchant = 'Unknown';
    }
  }

  // Clean UPI handles or trailing dots
  let cleanMerchant = merchant
    .replace(/^vpa\s+/i, '')
    .replace(/@(?:okhdfcbank|okaxis|oksbi|icici|ybl|paytm|axl|ibl)$/i, '')
    .replace(/\.$/, '')
    .trim();

  // 4. Account Reference (e.g. A/c XX4723 -> **4723)
  const accountMatch = cleanText.match(/(?:a\/c|acct|account|card)\s*(?:no\.?)?\s*(?:ending\s+|xx+|\*+)?([0-9]{3,6})/i);
  const accountNo = accountMatch ? `**${accountMatch[1].slice(-4)}` : null;

  // 5. Available Balance (e.g. Avl Bal Rs.42.39)
  const balMatch = cleanText.match(/(?:avl(?:\s+bal)?|available\s+balance|bal)\s*(?:is\s*)?(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i);
  const availableBal = balMatch ? parseFloat(balMatch[1].replace(/,/g, '')) : null;

  // 6. Timestamp / Date extraction (Handles DD-MM-YYYY, DD/MM/YYYY, or standard)
  let txnDate = new Date();
  const ddmmyyyyMatch = cleanText.match(/\b(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})\b/);
  if (ddmmyyyyMatch) {
    const d = parseInt(ddmmyyyyMatch[1], 10);
    const m = parseInt(ddmmyyyyMatch[2], 10) - 1;
    let y = parseInt(ddmmyyyyMatch[3], 10);
    if (y < 100) y += 2000;
    const parsed = new Date(y, m, d);
    if (!isNaN(parsed.getTime())) {
      txnDate = parsed;
    }
  }

  const category = categorizeMerchant(cleanMerchant, cleanText);

  let source = 'Bank SMS';
  if (/phonepe/i.test(cleanText)) source = 'PhonePe';
  else if (/uco/i.test(cleanText)) source = 'UCO Bank';
  else if (/sbi/i.test(cleanText)) source = 'SBI';
  else if (/hdfc/i.test(cleanText)) source = 'HDFC';
  else if (/icici/i.test(cleanText)) source = 'ICICI';
  else if (/gpay|google pay/i.test(cleanText)) source = 'GPay';
  else if (/paytm/i.test(cleanText)) source = 'Paytm';

  return {
    type: isDebit ? 'EXPENSE' : 'INCOME',
    amount: amount,
    merchant: cleanMerchant,
    category: category,
    account: accountNo,
    balance: availableBal,
    date: txnDate.toISOString(),
    rawSms: cleanText,
    source: source,
  };
}
