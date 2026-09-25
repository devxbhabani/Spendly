import Transaction from "../models/Transaction.js";

//  Get all transactions
// GET /api/transactions
export async function getTransactions(req, res) {
	try {
		const transactions = await Transaction.find().sort({ date: -1 });
		res.status(200).json(transactions);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}

//Create a new transaction
// Helper to detect promotional spam messages
export function isPromotionalMessage(text) {
	if (!text) return false;
	return /(?:cashback\s+waiting|claim\s+your\s+cashback|use\s+code|coupon|flat\s+\d+%\s+off|\d+%\s+off|hurry|offer\s+is\s+valid|shop\s+giva|jewellery|recharge\s+on\s+bob|win\s+up\s+to|reward\s+points)/i.test(
		text,
	);
}

// Helper to determine true type (corrects "Money received ... has sent to your account")
export function normalizeType(type, rawSms) {
	if (!rawSms) return type;
	if (
		/(?:money\s+received|received\s+from|has\s+sent\s+(?:rs|inr|₹).*to\s+your|credited\s+with|refund\s+of)/i.test(
			rawSms,
		)
	) {
		return "INCOME";
	}
	return type;
}

// Create a new transaction
// POST /api/transactions
export async function createTransaction(req, res) {
	try {
		const {
			type,
			amount,
			merchant,
			category,
			source,
			account,
			rawSms,
			date,
		} = req.body;

		if (!type || amount === undefined || !merchant) {
			return res
				.status(400)
				.json({ error: "Please provide type, amount, and merchant" });
		}

		// 1. Ignore promotional marketing messages
		if (isPromotionalMessage(rawSms)) {
			return res.status(200).json({ message: "Ignored promotional message" });
		}

		const numAmount = Number(amount);
		const effectiveType = normalizeType(type, rawSms);
		const txnDate = date ? new Date(date) : new Date();
		const cleanSms = rawSms ? rawSms.trim().replace(/\s+/g, " ") : null;

		// 2. Check for exact duplicate rawSms
		if (cleanSms) {
			const existingExact = await Transaction.findOne({
				$or: [
					{ rawSms: cleanSms },
					{ rawSms: rawSms },
				],
			});
			if (existingExact) {
				return res.status(200).json(existingExact);
			}
		}

		// 3. Cross-source deduplication (e.g. PhonePe Push Notification + Bank SMS for same transaction)
		const tenMinutes = 10 * 60 * 1000;
		const minTime = new Date(txnDate.getTime() - tenMinutes);
		const maxTime = new Date(txnDate.getTime() + tenMinutes);

		const crossDuplicate = await Transaction.findOne({
			amount: numAmount,
			type: effectiveType,
			date: { $gte: minTime, $lte: maxTime },
		});

		if (crossDuplicate) {
			// Already recorded via another channel (e.g. PhonePe notification already logged before Bank SMS)
			if (account && !crossDuplicate.account) {
				crossDuplicate.account = account;
				await crossDuplicate.save();
			}
			return res.status(200).json(crossDuplicate);
		}

		const transaction = await Transaction.create({
			type: effectiveType,
			amount: numAmount,
			merchant,
			category: category || "Other Payment",
			source: source || "Manual",
			account: account || null,
			rawSms: cleanSms,
			date: txnDate,
		});

		res.status(201).json(transaction);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}

// Batch create transactions (PhonePe / Bank SMS sync with duplicate protection)
// POST /api/transactions/batch
export async function batchCreateTransactions(req, res) {
	try {
		const items = req.body;
		if (!Array.isArray(items) || items.length === 0) {
			return res
				.status(400)
				.json({ error: "Expected an array of transactions" });
		}

		const insertedDocs = [];
		for (const item of items) {
			if (isPromotionalMessage(item.rawSms)) continue;

			const numAmount = Number(item.amount);
			const effectiveType = normalizeType(item.type, item.rawSms);
			const txnDate = item.date ? new Date(item.date) : new Date();
			const cleanSms = item.rawSms
				? item.rawSms.trim().replace(/\s+/g, " ")
				: null;

			// Check exact duplicate
			let existing = null;
			if (cleanSms) {
				existing = await Transaction.findOne({
					$or: [{ rawSms: cleanSms }, { rawSms: item.rawSms }],
				});
			}

			// Check cross-source duplicate within 15 minutes
			if (!existing) {
				const fifteenMins = 15 * 60 * 1000;
				existing = await Transaction.findOne({
					amount: numAmount,
					type: effectiveType,
					date: {
						$gte: new Date(txnDate.getTime() - fifteenMins),
						$lte: new Date(txnDate.getTime() + fifteenMins),
					},
				});
			}

			if (!existing) {
				const doc = await Transaction.create({
					type: effectiveType,
					amount: numAmount,
					merchant: item.merchant,
					category: item.category || "Other Payment",
					source: item.source || "Bank SMS",
					account: item.account || null,
					rawSms: cleanSms,
					date: txnDate,
				});
				insertedDocs.push(doc);
			}
		}

		res.status(201).json(insertedDocs);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}

// Delete a transaction by ID
// @route   DELETE /api/transactions/:id
export async function deleteTransaction(req, res) {
	try {
		const { id } = req.params;
		const deleted = await Transaction.findByIdAndDelete(id);

		if (!deleted) {
			return res.status(404).json({ error: "Transaction not found" });
		}

		res.status(200).json({ message: "Transaction deleted successfully", id });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}

// Clear all transactions
// @route   DELETE /api/transactions
export async function clearAllTransactions(req, res) {
	try {
		await Transaction.deleteMany({});
		res.status(200).json({
			message: "All transactions cleared successfully",
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}

// Get purely dynamic aggregated analytics from MongoDB
// GET /api/analytics
export async function getAnalytics(req, res) {
	try {
		const all = await Transaction.find().sort({ date: 1 });

		const totalExpense = all
			.filter((t) => t.type === "EXPENSE")
			.reduce((sum, t) => sum + t.amount, 0);

		const totalIncome = all
			.filter((t) => t.type === "INCOME")
			.reduce((sum, t) => sum + t.amount, 0);

		const phonePeSpend = all
			.filter(
				(t) =>
					t.type === "EXPENSE" &&
					(t.source === "PhonePe" || /phonepe/i.test(t.rawSms || "")),
			)
			.reduce((sum, t) => sum + t.amount, 0);

		const expenseDaysSet = new Set(
			all
				.filter((t) => t.type === "EXPENSE")
				.map((t) => new Date(t.date).toISOString().slice(0, 10)),
		);
		const dayCount = expenseDaysSet.size;
		const avgDailySpend =
			dayCount > 0 ? Math.round(totalExpense / dayCount) : 0;

		// Monthly breakdown
		const monthNames = [
			"Jan",
			"Feb",
			"Mar",
			"Apr",
			"May",
			"Jun",
			"Jul",
			"Aug",
			"Sep",
			"Oct",
			"Nov",
			"Dec",
		];
		const monthlyMap = {};
		monthNames.forEach((m) => {
			monthlyMap[m] = 0;
		});

		all.forEach((t) => {
			if (t.type === "EXPENSE") {
				const d = new Date(t.date);
				const m = monthNames[d.getMonth()];
				monthlyMap[m] = (monthlyMap[m] || 0) + t.amount;
			}
		});

		const maxMonthlySpend = Math.max(...Object.values(monthlyMap), 1000);
		const monthlyBreakdown = monthNames.slice(0, 9).map((m) => ({
			month: m,
			spend: monthlyMap[m] || 0,
			max: Math.max(maxMonthlySpend * 1.25, 5000),
		}));

		// Category breakdown
		const categoryTotals = {};
		all.filter((t) => t.type === "EXPENSE").forEach((t) => {
			const cat = t.category || "Other Payment";
			categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
		});

		const categoryColors = {
			"Saving & Investment": "#FF7A45",
			Transportation: "#FF9E79",
			"Shopping & Retail": "#60A5FA",
			"Food & Dining": "#BEF264",
			"Bills & Utilities": "#A78BFA",
			Entertainment: "#F472B6",
			"Health & Medical": "#34D399",
			"Other Payment": "#FBBF24",
		};

		const categoryBreakdown = Object.keys(categoryTotals)
			.map((cat) => ({
				name: cat,
				amount: categoryTotals[cat],
				color: categoryColors[cat] || "#9CA3AF",
				percent:
					totalExpense > 0
						? Math.round((categoryTotals[cat] / totalExpense) * 100)
						: 0,
			}))
			.sort((a, b) => b.amount - a.amount);

		// Calendar activity days for current month (tracks both debits and credits)
		const currentMonth = new Date().getMonth();
		const currentYear = new Date().getFullYear();
		const calendarDays = {};
		all.forEach((t) => {
			const d = new Date(t.date);
			if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
				const day = d.getDate();
				if (!calendarDays[day]) {
					calendarDays[day] = { debited: 0, credited: 0 };
				}
				if (t.type === "EXPENSE") {
					calendarDays[day].debited += t.amount;
				} else if (t.type === "INCOME") {
					calendarDays[day].credited += t.amount;
				}
			}
		});

		res.status(200).json({
			totalExpense,
			totalIncome,
			phonePeSpend,
			avgDailySpend,
			monthlyBreakdown,
			categoryBreakdown,
			calendarDays,
			transactionCount: all.length,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}

// Clean up duplicates and misclassifications across the database
// POST /api/transactions/cleanup
export async function cleanupDuplicates(req, res) {
	try {
		const all = await Transaction.find().sort({ date: 1, createdAt: 1 });
		const toDeleteIds = [];
		const seenSms = new Set();
		const keptList = [];

		for (const t of all) {
			// 1. Remove promo spam
			if (isPromotionalMessage(t.rawSms) || isPromotionalMessage(t.merchant)) {
				toDeleteIds.push(t._id);
				continue;
			}

			// 2. Fix misclassified type (e.g. Gunjan sent ₹160 to your bank account)
			const expectedType = normalizeType(t.type, t.rawSms);
			if (t.type !== expectedType) {
				t.type = expectedType;
				await t.save();
			}

			// 3. Exact rawSms duplicate check
			const cleanSms = t.rawSms ? t.rawSms.trim().replace(/\s+/g, " ") : null;
			if (cleanSms) {
				if (seenSms.has(cleanSms)) {
					toDeleteIds.push(t._id);
					continue;
				}
				seenSms.add(cleanSms);
			}

			// 4. Cross-source duplicate check within 15 minutes (e.g. PhonePe notification + Bank SMS of same payment)
			const tDate = new Date(t.date).getTime();
			const isCrossDup = keptList.some(
				(k) =>
					k.amount === t.amount &&
					k.type === t.type &&
					Math.abs(new Date(k.date).getTime() - tDate) < 15 * 60 * 1000,
			);

			if (isCrossDup) {
				toDeleteIds.push(t._id);
				continue;
			}

			keptList.push(t);
		}

		if (toDeleteIds.length > 0) {
			await Transaction.deleteMany({ _id: { $in: toDeleteIds } });
		}

		res.status(200).json({
			message: `Cleaned up database. Removed ${toDeleteIds.length} duplicate/spam records. Kept ${keptList.length} valid transactions.`,
			removedCount: toDeleteIds.length,
			remainingCount: keptList.length,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}

