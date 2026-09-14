import React from "react";
import {
	Home,
	Receipt,
	History,
	Tag,
	Package,
	TrendingUp,
	MessageSquare,
	Settings,
	HelpCircle,
	LifeBuoy,
	Smartphone,
	PlusCircle,
} from "lucide-react";

export default function Sidebar({
	activeTab,
	setActiveTab,
	onOpenSmsModal,
	onOpenAddModal,
}) {
	const menuItems = [
		{ id: "dashboard", label: "Home", icon: Home, count: null },
		{
			id: "expenses",
			label: "Live Expenses",
			icon: Receipt,
			count: "1",
			isPrimary: true,
		},
		{ id: "history", label: "Transactions", icon: History, count: null },
		{
			id: "sms",
			label: "SMS Sync",
			icon: Smartphone,
			count: "Live",
			isHighlight: true,
		},
		{ id: "categories", label: "Categories", icon: Tag, count: null },
		{ id: "analytics", label: "Analytics", icon: TrendingUp, count: null },
		{ id: "settings", label: "Settings", icon: Settings, count: null },
	];

	return (
		<aside className="hidden lg:flex flex-col w-64 bg-white border-r border-[#E8ECF2] p-5 h-screen sticky top-0 select-none z-20">
			{/* Brand Logo */}
			<div className="flex items-center gap-3 px-2 py-3 mb-6">
				<div className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center text-[#BEF264] shadow-sm">
					<svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
						<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2v-2h2v2zm0-4h-2V7h2v5.5z" />
					</svg>
				</div>
				<div className="flex flex-col">
					<span className="font-bold text-xl tracking-tight text-[#12141A]">
						Spendly
					</span>
					<span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
						Expense Tracker
					</span>
				</div>
			</div>

			{/* Quick Add Button */}
			<div className="mb-5 space-y-2">
				<button
					onClick={onOpenAddModal}
					className="w-full flex items-center justify-center gap-2 bg-[#12141A] hover:bg-black text-white text-sm font-semibold py-3 px-4 rounded-2xl transition-all shadow-sm hover:shadow active:scale-[0.98]"
				>
					<PlusCircle className="w-4 h-4 text-[#BEF264]" />
					<span>Add Transaction</span>
				</button>
				<button
					onClick={onOpenSmsModal}
					className="w-full flex items-center justify-center gap-2 bg-[#BEF264] hover:bg-[#A3E635] text-[#12141A] text-sm font-bold py-2.5 px-4 rounded-2xl transition-all shadow-sm active:scale-[0.98]"
				>
					<Smartphone className="w-4 h-4" />
					<span>PhonePe SMS Sync</span>
				</button>
			</div>

			{/* Main Navigation */}
			<nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
				{menuItems.map((item) => {
					const Icon = item.icon;
					const isActive = activeTab === item.id;

					if (isActive) {
						return (
							<button
								key={item.id}
								onClick={() => setActiveTab(item.id)}
								className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-[#12141A] text-white font-medium text-sm transition-all shadow-md group"
							>
								<div className="flex items-center gap-3">
									<Icon className="w-4 h-4 text-[#BEF264]" />
									<span>{item.label}</span>
								</div>
								{item.count && (
									<span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-mono font-medium">
										{item.count} &gt;
									</span>
								)}
							</button>
						);
					}

					return (
						<button
							key={item.id}
							onClick={() => {
								if (item.id === "sms") {
									onOpenSmsModal();
								} else {
									setActiveTab(item.id);
								}
							}}
							className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-gray-500 hover:text-[#12141A] hover:bg-[#F4F5F8] font-medium text-sm transition-all group"
						>
							<div className="flex items-center gap-3">
								<Icon className="w-4 h-4 group-hover:text-[#12141A] transition-colors" />
								<span>{item.label}</span>
							</div>
							{item.count && (
								<span
									className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
										item.isHighlight
											? "bg-[#BEF264] text-[#12141A] font-bold"
											: "bg-gray-100 text-gray-500"
									}`}
								>
									{item.count} &gt;
								</span>
							)}
						</button>
					);
				})}
			</nav>

			{/* Bottom Help Section */}
			<div className="pt-4 mt-auto border-t border-[#E8ECF2] space-y-1">
				<button className="w-full flex items-center justify-between px-4 py-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50 text-xs font-medium transition-colors">
					<div className="flex items-center gap-2.5">
						<LifeBuoy className="w-4 h-4" />
						<span>Support</span>
					</div>
					<span className="text-[10px] text-gray-400">1 &gt;</span>
				</button>
				<button className="w-full flex items-center justify-between px-4 py-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50 text-xs font-medium transition-colors">
					<div className="flex items-center gap-2.5">
						<HelpCircle className="w-4 h-4" />
						<span>Help Center</span>
					</div>
					<span className="text-[10px] text-gray-400">&gt;</span>
				</button>
			</div>
		</aside>
	);
}
