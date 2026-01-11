import React, { useMemo } from 'react';
import { PurchaseRecord } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Props {
  records: PurchaseRecord[];
  currency: string;
}

export const UsageChart: React.FC<Props> = ({ records, currency }) => {
  const chartData = useMemo(() => {
    // 1. Filter: Remove Spot Checks for the Cost/Unit view (since they have 0 cost)
    //    We only want to show financial history here.
    const financialRecords = records.filter(r => r.recordType !== 'SPOT_CHECK' && (r.units > 0 || !r.recordType));

    // 2. Sort: Chronological (Oldest -> Newest) for the chart X-Axis
    const sorted = [...financialRecords].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 3. Map: Transform to chart format
    return sorted.map(r => {
      const totalCost = r.price + (r.vat || 0) + (r.serviceFee || 0);
      return {
        date: new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        cost: totalCost,
        units: r.units,
      };
    });
  }, [records]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center h-80 text-center">
        <div className="bg-gray-50 p-3 rounded-full mb-3">
            <LineChart size={24} className="text-gray-300" />
        </div>
        <p className="text-gray-500 font-medium">No chart data available</p>
        <p className="text-sm text-gray-400 mt-1">Add a purchase to visualize your spending trends.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-gray-800">Spending & Consumption</h3>
      </div>
      
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis 
                dataKey="date" 
                stroke="#9ca3af" 
                fontSize={11} 
                tickLine={false}
                axisLine={false}
                dy={10}
            />
            <YAxis 
                yAxisId="left" 
                stroke="#9ca3af" 
                fontSize={11} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${currency}${val}`}
            />
            <YAxis 
                yAxisId="right" 
                orientation="right" 
                stroke="#9ca3af" 
                fontSize={11} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}k`}
            />
            <Tooltip 
              contentStyle={{ 
                  backgroundColor: '#fff', 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
              }}
              cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }}
              formatter={(value: number, name: string) => [
                name === 'Total Cost' ? `${currency}${value.toFixed(2)}` : `${value.toFixed(1)} kWh`,
                name === 'cost' ? 'Total Cost' : 'Units'
              ]}
              labelStyle={{ color: '#6b7280', marginBottom: '0.5rem', fontSize: '0.75rem' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="cost" 
                name="Total Cost" 
                stroke="#2563eb" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#2563eb', strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
            />
            <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="units" 
                name="Units (kWh)" 
                stroke="#f59e0b" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};