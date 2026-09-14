import React, { useState } from 'react';
import { BarChart3, ChevronDown } from 'lucide-react';
import { formatINR } from './MetricCards';

export default function SpendingChart({ monthlyData = [] }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Fallback default months if empty
  const defaultMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'].map(m => ({
    month: m,
    spend: 0,
    max: 1000,
  }));

  const data = monthlyData && monthlyData.length > 0 ? monthlyData : defaultMonths;
  const maxSpendInPeriod = Math.max(...data.map(d => d.spend), 100);
  const chartCeiling = Math.max(maxSpendInPeriod * 1.25, 1000);

  // Grid steps (0%, 25%, 50%, 75%, 100%)
  const steps = [1, 0.75, 0.5, 0.25, 0];

  return (
    <div className="bg-white rounded-3xl p-5 lg:p-6 border border-[#E8ECF2] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#F4F5F8] flex items-center justify-center text-gray-700">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-base lg:text-lg text-[#12141A]">
              Spending &amp; Cashflow Rates
            </h3>
            <p className="text-[11px] text-gray-400 font-medium">
              Real monthly expenses from MongoDB
            </p>
          </div>
        </div>

        {/* Period indicator */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-[#F4F5F8] px-3 py-1.5 rounded-full">
          <span>Live Database</span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative h-64 w-full flex items-end justify-between pt-6 pb-2">
        {/* Horizontal Dashed Guidelines based on real values */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-7">
          {steps.map((ratio, idx) => {
            const val = Math.round(chartCeiling * ratio);
            const label = val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`;
            return (
              <div key={idx} className="flex items-center gap-2 w-full">
                <span className="text-[10px] font-medium text-gray-400 w-10 text-right font-mono">
                  {label}
                </span>
                <div className="flex-1 border-b border-dashed border-gray-100"></div>
              </div>
            );
          })}
        </div>

        {/* Columns Container */}
        <div className="flex-1 flex items-end justify-between pl-12 pr-2 h-full z-10 gap-2 sm:gap-3">
          {data.map((item, idx) => {
            const actualSpendHeight = chartCeiling > 0 ? Math.min(100, Math.round((item.spend / chartCeiling) * 100)) : 0;
            const isHovered = hoveredIndex === idx;

            return (
              <div 
                key={item.month} 
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Floating Tooltip with Real DB Values */}
                {isHovered && (
                  <div className="absolute -top-12 z-30 bg-[#12141A] text-white text-[11px] font-medium py-1.5 px-3 rounded-xl shadow-xl whitespace-nowrap pointer-events-none transform -translate-y-1 transition-all">
                    <div className="font-bold text-[#BEF264]">{item.month} Total</div>
                    <div>{formatINR(item.spend)}</div>
                  </div>
                )}

                {/* The Bar Track + Value Bar */}
                <div className="w-full max-w-[28px] sm:max-w-[34px] relative flex flex-col justify-end items-center h-full pb-1">
                  {/* Background Soft Pill */}
                  <div className="w-full h-full bg-[#F4F5F8] rounded-t-xl rounded-b-lg absolute bottom-1 transition-all group-hover:bg-[#EAEFF5]"></div>

                  {/* Foreground Vibrant Orange Pill (Actual Spend) */}
                  <div 
                    className="w-full bg-[#FF7A45] hover:bg-[#F97316] rounded-t-xl rounded-b-lg relative z-10 transition-all duration-300 shadow-sm origin-bottom"
                    style={{ height: `${actualSpendHeight}%`, minHeight: item.spend > 0 ? '6px' : '0px' }}
                  ></div>
                </div>

                {/* X-axis Label */}
                <span className={`text-[11px] font-semibold mt-2 transition-colors ${
                  isHovered || item.spend > 0 ? 'text-[#12141A] font-bold' : 'text-gray-400'
                }`}>
                  {item.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
