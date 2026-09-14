import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { formatINR } from './MetricCards';

export default function CalendarCard({ calendarDays = {}, onSelectDate }) {
  const today = new Date().getDate();
  const currentMonthName = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date());
  const [selectedDay, setSelectedDay] = useState(today);

  // Calculate days in current month
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const cells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    cells.push(d);
  }

  // Calculate median spend for days that have expenses
  const spendAmounts = Object.values(calendarDays).filter(val => val > 0);
  const avgSpend = spendAmounts.length > 0 ? spendAmounts.reduce((a, b) => a + b, 0) / spendAmounts.length : 0;

  const handleDayClick = (day) => {
    setSelectedDay(day);
    if (onSelectDate) onSelectDate(day);
  };

  const selectedDaySpend = calendarDays[selectedDay] || 0;

  return (
    <div className="bg-white rounded-3xl p-5 lg:p-6 border border-[#E8ECF2] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#F4F5F8] flex items-center justify-center text-gray-700">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-base text-[#12141A]">
            Calendar
          </h3>
        </div>

        {/* Current Month */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-[#F4F5F8] px-3 py-1.5 rounded-full">
          <span>{currentMonthName}</span>
        </div>
      </div>

      {/* Weekday Header */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {dayNames.map((name, i) => (
          <span key={i} className="text-xs font-bold text-gray-400 py-1">
            {name}
          </span>
        ))}
      </div>

      {/* Date Grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="w-8 h-8 mx-auto" />;
          }

          const isSelected = selectedDay === day;
          const isToday = day === today;
          const daySpend = calendarDays[day] || 0;
          const hasSpend = daySpend > 0;
          const isHighSpend = hasSpend && daySpend >= avgSpend && spendAmounts.length > 1;

          let badgeClasses = "text-gray-600 hover:bg-gray-100";

          if (isSelected) {
            badgeClasses = "bg-[#12141A] text-white font-bold ring-2 ring-black shadow-md scale-105";
          } else if (isToday) {
            badgeClasses = "bg-gray-200 text-black font-bold";
          } else if (isHighSpend) {
            badgeClasses = "bg-[#FF7A45] text-white font-bold shadow-sm";
          } else if (hasSpend) {
            badgeClasses = "bg-[#BEF264] text-[#12141A] font-bold shadow-sm hover:bg-[#A3E635]";
          }

          return (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              title={hasSpend ? `Spend: ${formatINR(daySpend)}` : 'No spend'}
              className={`w-8 h-8 sm:w-9 sm:h-9 mx-auto rounded-full flex items-center justify-center text-xs transition-all ${badgeClasses}`}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Dynamic Day Status */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
        <span className="text-gray-400 font-medium">
          Day {selectedDay} Spend:
        </span>
        <span className="font-extrabold text-[#12141A]">
          {formatINR(selectedDaySpend)}
        </span>
      </div>
    </div>
  );
}
