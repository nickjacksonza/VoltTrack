import React, { useMemo } from 'react';
import { PurchaseRecord } from '../types';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface Props {
  records: PurchaseRecord[];
  currency: string;
}

export const UsageChart: React.FC<Props> = ({ records, currency }) => {
  const chartData = useMemo(() => {
    // Records are already sorted chronologically (oldest first) from App.tsx
    // Include all records (purchases and spot checks) for usage calculation
    if (records.length < 2) return [];

    const data: {
      date: string;
      fullDate: string;
      dailyUsage: number;
      days: number;
      totalUsage: number;
      rate: number;
      cumulativeSpend: number;
    }[] = [];

    let cumulativeSpend = 0;

    for (let i = 1; i < records.length; i++) {
      const prevRecord = records[i - 1];
      const currRecord = records[i];

      // Calculate days between readings (ensure dates are valid)
      const msPerDay = 1000 * 60 * 60 * 24;
      const currTime = new Date(currRecord.date).getTime();
      const prevTime = new Date(prevRecord.date).getTime();
      const daysBetween = Math.max(1, (currTime - prevTime) / msPerDay);

      // Calculate usage between readings (ensure numbers)
      const currMeter = Number(currRecord.meterReading) || 0;
      const prevMeter = Number(prevRecord.meterReading) || 0;
      const totalUsage = currMeter - prevMeter;
      const dailyUsage = daysBetween > 0 ? totalUsage / daysBetween : 0;

      // Calculate rate (only for purchase records)
      const isPurchase = currRecord.recordType !== 'SPOT_CHECK' && currRecord.units > 0;
      const rate = isPurchase && currRecord.units > 0 ? currRecord.price / currRecord.units : 0;

      // Accumulate spend
      if (isPurchase) {
        cumulativeSpend += currRecord.price;
      }

      data.push({
        date: new Date(currRecord.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        fullDate: new Date(currRecord.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        dailyUsage: Math.max(0, dailyUsage),
        days: daysBetween,
        totalUsage: Math.max(0, totalUsage),
        rate: rate,
        cumulativeSpend: cumulativeSpend
      });
    }

    return data;
  }, [records]);

  if (chartData.length === 0) {
    return (
      <div className="bg-surface-700/30 p-8 rounded-2xl border border-white/5 flex flex-col items-center justify-center h-80 text-center">
        <div className="bg-surface-600/50 p-4 rounded-2xl mb-4">
          <TrendingUp size={28} className="text-gray-600" />
        </div>
        <p className="text-gray-400 font-medium">Not enough data yet</p>
        <p className="text-sm text-gray-600 mt-1">Add at least 2 records to see usage trends.</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-surface-800 border border-white/10 rounded-xl p-3 shadow-xl min-w-[180px]">
          <p className="text-xs text-gray-500 mb-2 font-medium border-b border-white/5 pb-2">
            {data?.fullDate} <span className="text-gray-600">({data?.days} days)</span>
          </p>
          <div className="space-y-1.5">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-gray-400">{entry.name}</span>
                </div>
                <span className="font-mono font-medium text-white">
                  {entry.name === 'Daily Avg' && `${entry.value.toFixed(2)} kWh/day`}
                  {entry.name === 'Rate' && entry.value > 0 && `${currency}${entry.value.toFixed(2)}/kWh`}
                  {entry.name === 'Rate' && entry.value === 0 && <span className="text-gray-500">N/A</span>}
                </span>
              </div>
            ))}
            {data?.totalUsage > 0 && (
              <div className="flex items-center justify-between gap-4 text-sm pt-1 border-t border-white/5 mt-1">
                <span className="text-gray-500">Period total</span>
                <span className="font-mono text-gray-400">{Math.round(data.totalUsage)} kWh</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate averages for display
  const avgDailyUsage = chartData.reduce((sum, d) => sum + d.dailyUsage, 0) / chartData.length;
  const avgRate = chartData.filter(d => d.rate > 0).reduce((sum, d, _, arr) => sum + d.rate / arr.length, 0);

  return (
    <div className="bg-surface-700/30 p-5 rounded-2xl border border-white/5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-volt-500/10 rounded-lg">
            <TrendingUp size={18} className="text-volt-400" />
          </div>
          <div>
            <h3 className="font-bold text-white">Usage & Cost Trends</h3>
            <p className="text-[10px] text-gray-500 mt-0.5">
              Avg: {avgDailyUsage.toFixed(2)} kWh/day • {currency}{avgRate.toFixed(2)}/kWh
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-energy-500 rounded-full"></span>
            <span className="text-gray-500">kWh/day</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-volt-400 rounded-full"></span>
            <span className="text-gray-500">{currency}/kWh</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 5, left: -15 }}>
            <defs>
              <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#4b5563"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={8}
            />
            <YAxis
              yAxisId="usage"
              stroke="#4b5563"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${val}`}
              domain={[0, 'auto']}
            />
            <YAxis
              yAxisId="rate"
              orientation="right"
              stroke="#4b5563"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${currency}${val.toFixed(1)}`}
              domain={[0, 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Daily usage as line trend - uses left Y-axis */}
            <Line
              yAxisId="usage"
              type="monotone"
              dataKey="dailyUsage"
              name="Daily Avg"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#f59e0b' }}
            />

            {/* Rate as line - uses right Y-axis */}
            <Line
              yAxisId="rate"
              type="monotone"
              dataKey="rate"
              name="Rate"
              stroke="#00d4ff"
              strokeWidth={2}
              dot={{ r: 3, fill: '#00d4ff', strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 0, fill: '#00d4ff' }}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
