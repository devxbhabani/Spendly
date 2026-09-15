import React from "react";
import {
	CreditCard,
	Wallet,
	Smartphone,
	TrendingUp,
	Activity,
	Receipt,
} from "lucide-react";

export function formatINR(amount) {
	if (amount === undefined || amount === null || isNaN(amount)) return "₹0";
	return new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
		maximumFractionDigits: 0,
	}).format(amount);
}

export default function MetricCards({
	totalExpense = 0,
	totalIncome = 0,
	phonePeSpend = 0,
	avgDailySpend = 0,
	expenseCount = 0,
	incomeCount = 0,
	phonePeCount = 0,
}) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
			{/* Highlighted Lime Card - Total Expenses */}
			<div className="bg-[#BEF264] rounded-3xl p-5 lg:p-6 shadow-[0_10px_30px_-6px_rgba(190,242,100,0.45)] hover:shadow-[0_14px_35px_-4px_rgba(190,242,100,0.55)] transition-all flex flex-col justify-between relative overflow-hidden group">
				<div className="flex items-center justify-between mb-4">
					<div className="w-10 h-10 rounded-2xl bg-black/90 flex items-center justify-center text-[#BEF264]">
						<Wallet className="w-5 h-5" />
					</div>
					<span className="text-xs font-bold bg-black/10 text-black px-2.5 py-1 rounded-full flex items-center gap-1">
						<Receipt className="w-3 h-3" />
						{expenseCount} {expenseCount === 1 ? "expense" : "expenses"}
					</span>
				</div>

				<div>
					<p className="text-xs font-bold text-[#1E3A0F]/80 uppercase tracking-wider mb-1">
						Total Expenses
					</p>
					<h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-[#12141A]">
						{formatINR(totalExpense)}
					</h2>
				</div>
			</div>

			{/* White Card - Total Income */}
			<div className="bg-white rounded-3xl p-5 lg:p-6 border border-[#E8ECF2] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between">
				<div className="flex items-center justify-between mb-4">
					<div className="w-10 h-10 rounded-2xl bg-[#F4F5F8] flex items-center justify-center text-[#12141A]">
						<TrendingUp className="w-5 h-5 text-emerald-600" />
					</div>
					<span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full flex items-center gap-1">
						{incomeCount} {incomeCount === 1 ? "credit" : "credits"}
					</span>
				</div>

				<div>
					<p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
						Total Revenue &amp; Income
					</p>
					<h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-[#12141A]">
						{formatINR(totalIncome)}
					</h2>
				</div>
			</div>

			{/* White Card - PhonePe & UPI Spend */}
			<div className="bg-white rounded-3xl p-5 lg:p-6 border border-[#E8ECF2] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between">
				<div className="flex items-center justify-between mb-4">
					<div className="w-10 h-10 rounded-2xl bg-[#F4F5F8] flex items-center justify-center text-[#5F259F]">
						<Smartphone className="w-5 h-5" />
					</div>
					<span className="text-xs font-bold bg-purple-50 text-[#5F259F] px-2.5 py-1 rounded-full flex items-center gap-1">
						{phonePeCount} UPI txns
					</span>
				</div>

				<div>
					<p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
						PhonePe &amp; UPI Spend
					</p>
					<h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-[#12141A]">
						{formatINR(phonePeSpend)}
					</h2>
				</div>
			</div>

			{/* White Card - Average Daily Spend */}
			<div className="bg-white rounded-3xl p-5 lg:p-6 border border-[#E8ECF2] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between">
				<div className="flex items-center justify-between mb-4">
					<div className="w-10 h-10 rounded-2xl bg-[#F4F5F8] flex items-center justify-center text-amber-600">
						<Activity className="w-5 h-5" />
					</div>
					<span className="text-xs font-bold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full flex items-center gap-1">
						Daily Average
					</span>
				</div>

				<div>
					<p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
						Average Daily Spend
					</p>
					<h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-[#12141A]">
						{formatINR(avgDailySpend)}
					</h2>
				</div>
			</div>
		</div>
	);
}
