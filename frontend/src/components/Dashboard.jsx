import React, { useState } from "react";
import MetricCards from "./MetricCards";
import SpendingChart from "./SpendingChart";
import CategoryDonut from "./CategoryDonut";
import TransactionList from "./TransactionList";
import CalendarCard from "./CalendarCard";

export default function Dashboard({
	transactions = [],
	analytics = null,
	onDeleteTransaction,
	onSelectTransaction,
}) {
	const [activeDate, setActiveDate] = useState(null);

	const totalExpense = analytics?.totalExpense || 0;
	const totalIncome = analytics?.totalIncome || 0;
	const netCashFlow = totalIncome - totalExpense;
	const phonePeSpend = analytics?.phonePeSpend || 0;
	const avgDailySpend = analytics?.avgDailySpend || 0;

	const expenseCount = transactions.filter((t) => t.type === "EXPENSE").length;
	const incomeCount = transactions.filter((t) => t.type === "INCOME").length;
	const phonePeCount = transactions.filter(
		(t) =>
			t.type === "EXPENSE" &&
			(t.source === "PhonePe" || /phonepe/i.test(t.rawSms || "")),
	).length;

	return (
		<div className="space-y-6">
			{/* Summary Metric Cards */}
			<MetricCards
				totalExpense={totalExpense}
				totalIncome={totalIncome}
				phonePeSpend={phonePeSpend}
				avgDailySpend={avgDailySpend}
				expenseCount={expenseCount}
				incomeCount={incomeCount}
				phonePeCount={phonePeCount}
			/>

			{/* Visual Charts: Monthly Bar Chart & Activity Calendar */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
				<div className="lg:col-span-7 xl:col-span-8">
					<SpendingChart monthlyData={analytics?.monthlyBreakdown || []} />
				</div>
				<div className="lg:col-span-5 xl:col-span-4">
					<CalendarCard
						calendarDays={analytics?.calendarDays || {}}
						onSelectDate={(day) => setActiveDate(day)}
					/>
				</div>
			</div>

			{/* Category Pie/Donut Chart & Filterable Transaction Log */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
				<div className="lg:col-span-5 xl:col-span-4">
					<CategoryDonut categories={analytics?.categoryBreakdown || []} />
				</div>
				<div className="lg:col-span-7 xl:col-span-8 -mt-6 lg:mt-0">
					<TransactionList
						transactions={transactions}
						onDelete={onDeleteTransaction}
						onSelectTransaction={onSelectTransaction}
					/>
				</div>
			</div>
		</div>
	);
}
