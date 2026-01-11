import React from 'react';
import { PurchaseRecord } from '../types';
import { Trash2, ClipboardCheck, Pencil, Calendar, DollarSign } from 'lucide-react';

interface Props {
  records: PurchaseRecord[];
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  currency: string;
}

export const HistoryTable: React.FC<Props> = ({ records, onDelete, onEdit, currency }) => {
  // NOTE: 'records' passed here MUST already be sorted by the parent (App.tsx)
  
  if (records.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
        <div className="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
          <Calendar size={24} />
        </div>
        <p className="text-gray-500 font-medium">No records found</p>
        <p className="text-gray-400 text-sm mt-1">Add a purchase or spot check to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 whitespace-nowrap">Date</th>
              <th className="px-6 py-4 whitespace-nowrap">Details</th>
              <th className="px-6 py-4 whitespace-nowrap text-right">Cost</th>
              <th className="px-6 py-4 whitespace-nowrap text-right">Units</th>
              <th className="px-6 py-4 whitespace-nowrap hidden md:table-cell text-right">Meter</th>
              <th className="px-6 py-4 whitespace-nowrap text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.map((record) => {
               const isSpotCheck = record.recordType === 'SPOT_CHECK';
               const totalCost = record.price + (record.vat || 0) + (record.serviceFee || 0);
               const effectiveRate = record.units > 0 ? totalCost / record.units : 0;

               return (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors group">
                  {/* Date Column */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">
                        {new Date(record.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(record.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>

                  {/* Type/Details Column */}
                  <td className="px-6 py-4">
                    {isSpotCheck ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                        <ClipboardCheck size={12} />
                        Meter Check
                      </span>
                    ) : (
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Rate:</span>
                        <span className="font-semibold text-blue-600">
                           {currency}{effectiveRate.toFixed(2)}<span className="text-blue-400 font-normal">/kWh</span>
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Cost Column */}
                  <td className="px-6 py-4 text-right">
                    {isSpotCheck ? (
                      <span className="text-gray-300">-</span>
                    ) : (
                      <span className="font-medium text-gray-900">{currency}{record.price.toFixed(2)}</span>
                    )}
                  </td>

                  {/* Units Column */}
                  <td className="px-6 py-4 text-right">
                    {isSpotCheck ? (
                      <span className="text-gray-300">-</span>
                    ) : (
                      <span className="font-medium text-gray-900">{record.units.toFixed(1)} kWh</span>
                    )}
                  </td>

                  {/* Meter Reading (Hidden on Mobile) */}
                  <td className="px-6 py-4 text-right hidden md:table-cell text-gray-500 font-mono">
                    {record.meterReading.toLocaleString()}
                  </td>

                  {/* Actions Column */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => onEdit(record.id)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        onClick={() => onDelete(record.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
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