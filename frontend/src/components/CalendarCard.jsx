import React, { useState } from 'react';
import { Calendar as CalendarIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { formatINR } from './MetricCards';

export default function CalendarCard({ calendarDays = {}, transactions = [], onSelectDate }) {
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

  // Helper to extract debited & credited for a specific day
  const getDayData = (day) => {
    if (Array.isArray(transactions) && transactions.length > 0) {
      let debited = 0;
      let credited = 0;
      transactions.forEach((t) => {
        if (!t.date) return;
        const d = new Date(t.date);
        if (d.getDate() === day && d.getMonth() === month && d.getFullYear() === year) {
          if (t.type === 'EXPENSE') debited += t.amount;
          else if (t.type === 'INCOME') credited += t.amount;
        }
      });
      if (debited > 0 || credited > 0) {
        return { debited, credited };
      }
    }

    // Fallback to calendarDays prop
    const entry = calendarDays[day];
    if (typeof entry === 'number') {
      return { debited: entry, credited: 0 };
    } else if (entry && typeof entry === 'object') {
      return { debited: entry.debited || 0, credited: entry.credited || 0 };
    }
    return { debited: 0, credited: 0 };
  };

  const handleDayClick = (day) => {
    setSelectedDay(day);
    if (onSelectDate) onSelectDate(day);
  };

  const selectedData = getDayData(selectedDay);

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

          const { debited, credited } = getDayData(day);
          const hasDebited = debited > 0;
          const hasCredited = credited > 0;
          const isSelected = selectedDay === day;
          const isToday = day === today;

          let badgeClasses = "text-gray-600 hover:bg-gray-100";

          if (isSelected) {
            badgeClasses = "bg-[#12141A] text-white font-bold ring-2 ring-black shadow-md scale-105";
          } else if (isToday) {
            badgeClasses = "bg-gray-200 text-black font-bold";
          } else if (hasDebited && hasCredited) {
            badgeClasses = "bg-[#BEF264] text-[#12141A] font-bold shadow-sm hover:bg-[#A3E635]";
          } else if (hasDebited) {
            badgeClasses = "bg-[#FEE2E2] text-rose-700 font-bold shadow-sm hover:bg-[#FECACA]";
          } else if (hasCredited) {
            badgeClasses = "bg-[#D1FAE5] text-emerald-800 font-bold shadow-sm hover:bg-[#A7F3D0]";
          }

          const tooltipParts = [];
          if (credited > 0) tooltipParts.push(`+${formatINR(credited)} (credited)`);
          if (debited > 0) tooltipParts.push(`-${formatINR(debited)} (debited)`);
          const tooltip = tooltipParts.length > 0 ? `Day ${day}: ${tooltipParts.join(' | ')}` : `Day ${day}: No activity`;

          return (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              title={tooltip}
              className={`relative w-8 h-8 sm:w-9 sm:h-9 mx-auto rounded-full flex flex-col items-center justify-center text-xs transition-all ${badgeClasses}`}
            >
              <span>{day}</span>
              {/* Subtle dual-dots for mixed activity */}
              {(hasDebited || hasCredited) && !isSelected && (
                <div className="flex gap-0.5 mt-[-2px]">
                  {hasCredited && <span className="w-1 h-1 rounded-full bg-emerald-500"></span>}
                  {hasDebited && <span className="w-1 h-1 rounded-full bg-rose-500"></span>}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Dynamic Day Status displaying +X(credited) and -Y(debited) */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400 font-medium">
            Day {selectedDay} Activity:
          </span>
          {selectedData.credited === 0 && selectedData.debited === 0 && (
            <span className="text-gray-400 italic font-medium">No activity</span>
          )}
        </div>

        {(selectedData.credited > 0 || selectedData.debited > 0) && (
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-mono font-semibold">
            {selectedData.credited > 0 && (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1.5 rounded-xl shadow-xs">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                +{formatINR(selectedData.credited)} (credited)
              </span>
            )}
            {selectedData.debited > 0 && (
              <span className="inline-flex items-center gap-1.5 text-rose-700 bg-rose-50 border border-rose-200/80 px-2.5 py-1.5 rounded-xl shadow-xs">
                <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                -{formatINR(selectedData.debited)} (debited)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

