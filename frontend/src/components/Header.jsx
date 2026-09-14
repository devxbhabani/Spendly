import React from "react";
import {
	Calendar,
	Download,
	RefreshCw,
	Menu,
	Plus,
	Smartphone,
} from "lucide-react";

export default function Header({
	userName = "Bhabani",
	onExport,
	onRefresh,
	onOpenSmsModal,
	onOpenAddModal,
	isSyncing = false,
}) {
	const currentDate = new Intl.DateTimeFormat("en-US", {
		month: "long",
		year: "numeric",
	}).format(new Date());

	return (
		<header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
			{/* User Greeting */}
			<div>
				<h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#12141A] flex items-center gap-2">
					Welcome Back, {userName}!{" "}
					<span className="inline-block animate-bounce">👋</span>
				</h1>
				<p className="text-xs lg:text-sm text-[#7E8494] font-medium mt-1">
					Let's see your current expenses &amp; cashflow today
				</p>
			</div>

			{/* Header Actions & Controls */}
			<div className="flex items-center flex-wrap gap-2.5">
				{/* Date Selector Pill */}
				<div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-2xl border border-[#E8ECF2] shadow-sm text-xs lg:text-sm font-semibold text-[#12141A]">
					<Calendar className="w-4 h-4 text-gray-500" />
					<span>{currentDate}</span>
				</div>

				{/* Export Button */}
				<button
					onClick={onExport}
					className="flex items-center gap-2 bg-white hover:bg-gray-50 active:scale-95 transition-all px-3.5 py-2 rounded-2xl border border-[#E8ECF2] shadow-sm text-xs lg:text-sm font-semibold text-[#12141A]"
					title="Export CSV / JSON"
				>
					<Download className="w-4 h-4 text-gray-500" />
					<span>Export</span>
				</button>

				{/* SMS Sync Lime Button */}
				<button
					onClick={onOpenSmsModal}
					className="flex items-center gap-2 bg-[#BEF264] hover:bg-[#A3E635] text-[#12141A] active:scale-95 transition-all px-3.5 py-2 rounded-2xl shadow-sm text-xs lg:text-sm font-bold"
					title="Sync PhonePe / Bank SMS"
				>
					<Smartphone className="w-4 h-4" />
					<span className="hidden sm:inline">SMS Sync</span>
				</button>

				{/* Refresh Icon */}
				<button
					onClick={onRefresh}
					className={`w-9 h-9 rounded-2xl bg-white hover:bg-gray-50 border border-[#E8ECF2] shadow-sm flex items-center justify-center text-gray-600 transition-all ${
						isSyncing ? "animate-spin text-black" : ""
					}`}
					title="Refresh Data"
				>
					<RefreshCw className="w-4 h-4" />
				</button>

				{/* Mobile quick add button */}
				<button
					onClick={onOpenAddModal}
					className="md:hidden flex items-center justify-center w-9 h-9 rounded-2xl bg-[#12141A] text-white shadow-sm active:scale-95"
					title="Add Expense"
				>
					<Plus className="w-4 h-4 text-[#BEF264]" />
				</button>
			</div>
		</header>
	);
}
