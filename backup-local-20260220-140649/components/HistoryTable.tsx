import React from 'react';
import { PurchaseRecord } from '../types';
import { Trash2, ClipboardCheck, Pencil, Calendar, Zap } from 'lucide-react';

interface Props {
  records: PurchaseRecord[];
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  currency: string;
}

export const HistoryTable: React.FC<Props> = ({ records, onDelete, onEdit, currency }) => {

  if (records.length === 0) {
    return (
      <div className="text-center py-16 bg-surface-700/30 rounded-2xl border border-dashed border-white/10">
        <div className="bg-surface-600/50 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Calendar size={24} className="text-gray-500" />
        </div>
        <p className="text-gray-400 font-medium">No records found</p>
        <p className="text-gray-600 text-sm mt-1">Add a purchase or spot check to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-700/30 rounded-2xl border border-white/5 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-surface-800/50 text-gray-500 font-medium border-b border-white/5">
            <tr>
              <th className="px-4 sm:px-6 py-4 whitespace-nowrap text-[10px] sm:text-xs uppercase tracking-wider">Date</th>
              <th className="px-4 sm:px-6 py-4 whitespace-nowrap text-[10px] sm:text-xs uppercase tracking-wider">Details</th>
              <th className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-[10px] sm:text-xs uppercase tracking-wider">Cost</th>
              <th className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-[10px] sm:text-xs uppercase tracking-wider">Units</th>
              <th className="px-4 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell text-right text-[10px] sm:text-xs uppercase tracking-wider">Meter</th>
              <th className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-[10px] sm:text-xs uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {records.map((record, index) => {
              const isSpotCheck = record.recordType === 'SPOT_CHECK';
              // Price already includes VAT and service fee
              const effectiveRate = record.units > 0 ? record.price / record.units : 0;

              return (
                <tr
                  key={record.id}
                  className="hover:bg-white/[0.02] transition-colors group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Date Column */}
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-200">
                        {new Date(record.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="text-xs text-gray-600 font-mono">
                        {new Date(record.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>

                  {/* Type/Details Column */}
                  <td className="px-4 sm:px-6 py-4">
                    {isSpotCheck ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-surface-600/50 text-gray-400 border border-white/5">
                        <ClipboardCheck size={12} />
                        Meter Check
                      </span>
                    ) : (
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-600 uppercase tracking-wider">Rate</span>
                        <span className="font-semibold text-volt-400 font-mono">
                          {currency}{effectiveRate.toFixed(2)}
                          <span className="text-volt-600 font-normal text-xs">/kWh</span>
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Cost Column */}
                  <td className="px-4 sm:px-6 py-4 text-right">
                    {isSpotCheck ? (
                      <span className="text-gray-700">-</span>
                    ) : (
                      <span className="font-medium text-gray-200 font-mono">{currency}{record.price.toFixed(2)}</span>
                    )}
                  </td>

                  {/* Units Column */}
                  <td className="px-4 sm:px-6 py-4 text-right">
                    {isSpotCheck ? (
                      <span className="text-gray-700">-</span>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <Zap size={12} className="text-energy-500" />
                        <span className="font-medium text-gray-200 font-mono">{record.units.toFixed(1)}</span>
                      </div>
                    )}
                  </td>

                  {/* Meter Reading (Hidden on Mobile) */}
                  <td className="px-4 sm:px-6 py-4 text-right hidden md:table-cell">
                    <span className="text-gray-400 font-mono text-sm">
                      {record.meterReading.toLocaleString()}
                    </span>
                  </td>

                  {/* Actions Column */}
                  <td className="px-4 sm:px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEdit(record.id)}
                        className="p-2 text-gray-600 hover:text-volt-400 hover:bg-volt-500/10 rounded-lg transition-all"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(record.id)}
                        className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
