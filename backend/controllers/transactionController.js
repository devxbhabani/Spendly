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

		const transaction = await Transaction.create({
			type,
			amount: Number(amount),
			merchant,
			category: category || "Other Payment",
			source: source || "Manual",
			account: account || null,
			rawSms: rawSms || null,
			date: date ? new Date(date) : new Date(),
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
			// Check if duplicate exists
			let query = {};
			if (item.rawSms) {
				query = { rawSms: item.rawSms };
			} else {
				query = {
					amount: Number(item.amount),
					merchant: item.merchant,
					type: item.type,
					date: item.date ? new Date(item.date) : { $exists: true },
				};
			}

			const existing = await Transaction.findOne(query);
			if (!existing) {
				const doc = await Transaction.create({
					type: item.type,
					amount: Number(item.amount),
					merchant: item.merchant,
					category: item.category || "Other Payment",
					source: item.source || "Bank SMS",
					account: item.account || null,
					rawSms: item.rawSms || null,
					date: item.date ? new Date(item.date) : new Date(),
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

		// Calendar activity days for current month
		const currentMonth = new Date().getMonth();
		const calendarDays = {};
		all.filter((t) => t.type === "EXPENSE").forEach((t) => {
			const d = new Date(t.date);
			if (d.getMonth() === currentMonth) {
				const day = d.getDate();
				calendarDays[day] = (calendarDays[day] || 0) + t.amount;
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
