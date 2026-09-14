import React, { useState } from 'react';
import { PieChart, Sparkles } from 'lucide-react';
import { formatINR } from './MetricCards';

export default function CategoryDonut({ categories = [] }) {
  const [hoveredCategory, setHoveredCategory] = useState(null);

  const hasData = categories && categories.length > 0;
  const activeCategory = hoveredCategory || (hasData ? categories[0] : null);

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  return (
    <div className="bg-white rounded-3xl p-5 lg:p-6 border border-[#E8ECF2] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-[#F4F5F8] flex items-center justify-center text-gray-700">
          <PieChart className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-bold text-base text-[#12141A]">
            Statistic Activity
          </h3>
          <p className="text-[11px] text-gray-400 font-medium">
            Category distribution from database
          </p>
        </div>
      </div>

      {/* Content layout */}
      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-10 text-center px-4">
          <div className="w-16 h-16 rounded-full bg-[#F4F5F8] flex items-center justify-center text-gray-300 mb-3">
            <PieChart className="w-8 h-8" />
          </div>
          <p className="text-sm font-bold text-gray-600">No Expenses Recorded</p>
          <p className="text-xs text-gray-400 mt-1 max-w-[200px]">
            Sync PhonePe SMS or record an expense to view category distribution.
          </p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
          {/* Donut SVG */}
          <div className="relative w-40 h-40 flex items-center justify-center flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              {/* Background ring */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="transparent"
                stroke="#F4F5F8"
                strokeWidth="16"
              />

              {/* Dynamic Segments */}
              {categories.map((cat) => {
                const strokeDasharray = `${(cat.percent / 100) * circumference} ${circumference}`;
                const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
                accumulatedPercent += cat.percent;

                const isSelected = activeCategory?.name === cat.name;

                return (
                  <circle
                    key={cat.name}
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="transparent"
                    stroke={cat.color}
                    strokeWidth={isSelected ? "19" : "16"}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-300 cursor-pointer hover:opacity-90"
                    onMouseEnter={() => setHoveredCategory(cat)}
                  />
                );
              })}
            </svg>

            {/* Central Donut Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-2xl font-black text-[#12141A] tracking-tight">
                {activeCategory ? `${activeCategory.percent}%` : '0%'}
              </span>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider max-w-[70px] truncate">
                {activeCategory ? activeCategory.name.split(' ')[0] : ''}
              </span>
            </div>
          </div>

          {/* Legend List */}
          <div className="flex-1 w-full space-y-2 max-h-48 overflow-y-auto pr-1">
            {categories.map((item) => {
              const isHovered = activeCategory?.name === item.name;

              return (
                <div
                  key={item.name}
                  onMouseEnter={() => setHoveredCategory(item)}
                  className={`flex items-center justify-between p-1.5 rounded-xl cursor-pointer transition-all ${
                    isHovered ? 'bg-[#F4F5F8] scale-[1.02]' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    ></span>
                    <div className="truncate">
                      <p className="text-xs font-bold text-[#12141A] truncate">
                        {formatINR(item.amount)}
                      </p>
                      <p className="text-[11px] text-gray-400 font-medium truncate">
                        {item.name}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-gray-500 font-mono">
                    {item.percent}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
