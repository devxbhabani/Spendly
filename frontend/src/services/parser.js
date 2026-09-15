export function categorizeMerchant(merchantName, smsText = "") {
	const text = `${merchantName} ${smsText}`.toLowerCase();

	if (
		/(?:swiggy|zomato|starbucks|mcdonald|burger|pizza|cafe|restaurant|eats|dine|food|tea|coffee|bakery|subway|dominos|kfc)/i.test(
			text,
		)
	) {
		return "Food & Dining";
	}
	if (
		/(?:amazon|flipkart|myntra|zara|h&m|ajio|tata\s*cliq|nykaa|retail|store|mart|mall|shopping|meesho)/i.test(
			text,
		)
	) {
		return "Shopping & Retail";
	}
	if (
		/(?:uber|ola|rapido|metro|petrol|fuel|indian\s*oil|bharat\s*petrol|hp\s*cl|shell|railway|irctc|flight|indigo|air\s*india|fastag)/i.test(
			text,
		)
	) {
		return "Transportation";
	}
	if (
		/(?:airtel|jio|vi|bescom|electricity|water|gas|wifi|broadband|recharge|billdesk|utility|dth|tatasky)/i.test(
			text,
		)
	) {
		return "Bills & Utilities";
	}
	if (
		/(?:netflix|spotify|bookmyshow|hotstar|prime|youtube|cinema|pvr|inox|gaming|steam|playstation)/i.test(
			text,
		)
	) {
		return "Entertainment";
	}
	if (
		/(?:apollo|pharmeasy|1mg|pharmacy|hospital|clinic|medplus|gym|cult|fitness|doctor)/i.test(
			text,
		)
	) {
		return "Health & Medical";
	}
	if (
		/(?:zerodha|groww|angelone|upstox|mutual\s*fund|sip|investment|bse|nse|crypto)/i.test(
			text,
		)
	) {
		return "Saving & Investment";
	}
	if (/(?:salary|allowance|bonus|payroll|dividend|pension)/i.test(text)) {
		return "Salary & Income";
	}
	if (/(?:uco|sbi|hdfc|icici|axis|pnb|canara|bank|upi)/i.test(text)) {
		return "UPI & Bank Transfer";
	}

	return "Other Payment";
}

export function parseTransactionSMS(smsText) {
	if (!smsText || typeof smsText !== "string") return null;

	const cleanText = smsText.replace(/\n/g, " ").trim();

	// 1. Determine Debit vs Credit
	const isDebit =
		/(?:debited|paid|sent|withdrawn|spent|transferred\s+to|purchase|txn\s+of)/i.test(
			cleanText,
		);
	const isCredit =
		/(?:credited|received|deposited|added|refunded|cashback)/i.test(
			cleanText,
		);

	if (!isDebit && !isCredit) return null;

	// 2. Extract Amount (handles Rs.161.00, Rs 161, ₹161, INR 161, with commas and decimals)
	const amountMatch = cleanText.match(
		/(?:RS|INR|₹|Rs\.?)\s*([\d,]+(?:\.\d{1,2})?)/i,
	);
	if (!amountMatch) return null;

	const amount = parseFloat(amountMatch[1].replace(/,/g, ""));
	if (isNaN(amount) || amount <= 0) return null;

	// 3. Extract Merchant / Beneficiary / Transfer Mechanism
	let merchant = null;

	// Match "by UCO-UPI", "to Swiggy", "at Starbucks", "info: XYZ", "to vpa abc@upi"
	const patternMatch = cleanText.match(
		/(?:to\s+(?:vpa\s+)?|at\s+|info[\s*:]+|beneficiary\s+|for\s+|by\s+)([a-zA-Z0-9.\-_@ ]{2,30}?)(?:\.|\s+on|\s+ref|\s+via|\s+avl|\s+bal|\s+upi|\s+report|$)/i,
	);

	if (patternMatch && patternMatch[1]) {
		merchant = patternMatch[1].trim();
	}

	// Fallback: Check for known bank handles or merchants
	if (!merchant || merchant.length < 2) {
		if (/uco-upi|ucoonline|uco bank/i.test(cleanText)) {
			merchant = "UCO Bank UPI";
		} else if (/phonepe/i.test(cleanText)) {
			merchant = "PhonePe UPI";
		} else if (/gpay|google pay/i.test(cleanText)) {
			merchant = "Google Pay";
		} else if (/paytm/i.test(cleanText)) {
			merchant = "Paytm";
		} else {
			merchant = isDebit ? "Direct Debit / UPI" : "Direct Account Credit";
		}
	}

	// Clean merchant formatting
	let cleanMerchant = merchant
		.replace(/^vpa\s+/i, "")
		.replace(/@(?:okhdfcbank|okaxis|oksbi|icici|ybl|paytm|axl|ibl)$/i, "")
		.replace(/\.$/, "")
		.trim();

	// 4. Extract Account Reference (e.g. A/c XX4723 -> **4723)
	const accountMatch = cleanText.match(
		/(?:a\/c|acct|account|card)\s*(?:no\.?)?\s*(?:ending\s+|xx+|\*+)?([0-9]{3,6})/i,
	);
	const accountNo = accountMatch ? `**${accountMatch[1].slice(-4)}` : null;

	// 5. Extract Available Balance if present (e.g. Avl Bal Rs.42.39)
	const balMatch = cleanText.match(
		/(?:avl(?:\s+bal)?|available\s+balance|bal)\s*(?:is\s*)?(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
	);
	const availableBal = balMatch
		? parseFloat(balMatch[1].replace(/,/g, ""))
		: null;

	// 6. Extract Date (Handles DD-MM-YYYY, DD/MM/YYYY, or DD-Mon-YYYY)
	let txnDate = new Date();
	const ddmmyyyyMatch = cleanText.match(
		/\b(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})\b/,
	);
	if (ddmmyyyyMatch) {
		const d = parseInt(ddmmyyyyMatch[1], 10);
		const m = parseInt(ddmmyyyyMatch[2], 10) - 1; // 0-indexed month
		let y = parseInt(ddmmyyyyMatch[3], 10);
		if (y < 100) y += 2000;
		const parsed = new Date(y, m, d);
		if (!isNaN(parsed.getTime())) {
			txnDate = parsed;
		}
	} else {
		const textDateMatch = cleanText.match(
			/(\d{1,2}-[a-zA-Z]{3}(?:-\d{2,4})?)/i,
		);
		if (textDateMatch) {
			const parsed = new Date(textDateMatch[1]);
			if (!isNaN(parsed.getTime())) {
				txnDate = parsed;
			}
		}
	}

	// 7. Source identification
	let source = "Bank SMS";
	if (/phonepe/i.test(cleanText)) {
		source = "PhonePe";
	} else if (/uco/i.test(cleanText)) {
		source = "UCO Bank";
	} else if (/sbi/i.test(cleanText)) {
		source = "SBI";
	} else if (/hdfc/i.test(cleanText)) {
		source = "HDFC Bank";
	} else if (/icici/i.test(cleanText)) {
		source = "ICICI Bank";
	} else if (/axis/i.test(cleanText)) {
		source = "Axis Bank";
	} else if (/gpay|google pay/i.test(cleanText)) {
		source = "Google Pay";
	} else if (/paytm/i.test(cleanText)) {
		source = "Paytm";
	}

	const category = categorizeMerchant(cleanMerchant, cleanText);

	return {
		type: isDebit ? "EXPENSE" : "INCOME",
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

/**
 * Sample SMS messages including the user's UCO Bank format
 */
export const SAMPLE_SMS_DATA = [
	{
		label: "UCO Bank UPI (Your Format)",
		sms: "A/c XX4723 Debited with Rs.161.00 on 09-09-2026 by UCO-UPI.Avl Bal Rs.42.39. Report Dispute https://spgrs.ucoonline.bank.in/Home_Page.jsp",
	},
	{
		label: "PhonePe Swiggy",
		sms: "Paid ₹480 to Swiggy via PhonePe on 12-Sep-2026. UTR 425678912345. Thank you for using PhonePe.",
	},
	{
		label: "HDFC Salary Credit",
		sms: "Your A/c **4821 is credited with INR 75,000.00 on 01-Sep-2026 by Monthly Payroll / Salary. Avl Bal: INR 1,42,850.00 - HDFC Bank",
	},
	{
		label: "Amazon Shopping",
		sms: "Txn of Rs. 3,499.00 paid at Amazon India on Card ending **9012. OTP not required. Updated Bal: Rs. 38,400.00",
	},
	{
		label: "Uber Ride",
		sms: "Debited ₹340.00 from A/c **4821 to vpa uber.india@icici via UPI. Ref No 98127391.",
	},
];
