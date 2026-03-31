import React, { useState, useMemo, useEffect } from 'react';
import { PurchaseRecord } from '../types';
import { Save, X, Calculator, AlertTriangle, Zap, ClipboardCheck } from 'lucide-react';

interface Props {
  onSave: (record: PurchaseRecord) => void;
  onCancel: () => void;
  records: PurchaseRecord[];
  initialMode?: 'PURCHASE' | 'SPOT_CHECK';
  currency: string;
  initialData?: PurchaseRecord | null;
}

export const AddRecordForm: React.FC<Props> = ({ onSave, onCancel, records, initialMode = 'PURCHASE', currency, initialData }) => {
  const [mode, setMode] = useState<'PURCHASE' | 'SPOT_CHECK'>(initialMode);

  // Convert Date to local datetime string for the datetime-local input
  const toLocalISOString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    price: '',
    units: '',
    date: toLocalISOString(new Date()),
    vat: '',
    serviceFee: '0',
    meterReading: ''
  });

  useEffect(() => {
    if (initialData) {
      setMode(initialData.recordType || 'PURCHASE');
      setFormData({
        price: initialData.price.toString(),
        units: initialData.units.toString(),
        date: toLocalISOString(new Date(initialData.date)),
        vat: initialData.vat.toString(),
        serviceFee: initialData.serviceFee.toString(),
        meterReading: initialData.meterReading.toString()
      });
    } else {
      setMode(initialMode);
      setFormData(prev => ({ ...prev, date: toLocalISOString(new Date()) }));
    }
  }, [initialData, initialMode]);

  // Price already includes VAT and service fee - they're just breakdown info
  const effectiveRate = useMemo(() => {
    if (mode === 'SPOT_CHECK') return 0;
    const price = parseFloat(formData.price) || 0;
    const units = parseFloat(formData.units) || 0;

    if (units <= 0) return 0;
    return price / units;
  }, [formData, mode]);

  const usageWarning = useMemo(() => {
    if (initialData) return null;

    const currentReading = parseFloat(formData.meterReading);
    if (isNaN(currentReading)) return null;

    // Records are sorted chronologically (oldest first), so last item is most recent
    if (records.length === 0) return null;
    const lastRecord = records[records.length - 1];

    const currentUsage = currentReading - lastRecord.meterReading;
    if (currentUsage <= 0) return null;

    // Filter to recharge records only (chronological order)
    const rechargeRecords = records.filter(r => r.recordType !== 'SPOT_CHECK' && r.units > 0);

    let totalUsage = 0;
    let count = 0;

    // Calculate usage between consecutive records (chronological order)
    for (let i = 0; i < rechargeRecords.length - 1; i++) {
      const diff = rechargeRecords[i + 1].meterReading - rechargeRecords[i].meterReading;
      if (diff > 0) {
        totalUsage += diff;
        count++;
      }
    }

    if (count < 2) return null;
    const avgUsagePerRecharge = totalUsage / count;

    if (currentUsage > avgUsagePerRecharge * 1.8) {
      return {
        current: currentUsage,
        average: avgUsagePerRecharge,
        lastDate: lastRecord.date
      };
    }
    return null;

  }, [formData.meterReading, records, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const isSpotCheck = mode === 'SPOT_CHECK';

    const generateId = () => {
      return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
    };

    const newRecord: PurchaseRecord = {
      id: initialData?.id || generateId(),
      price: isSpotCheck ? 0 : parseFloat(formData.price),
      units: isSpotCheck ? 0 : parseFloat(formData.units),
      date: new Date(formData.date).toISOString(),
      vat: isSpotCheck ? 0 : (parseFloat(formData.vat) || 0),
      serviceFee: isSpotCheck ? 0 : (parseFloat(formData.serviceFee) || 0),
      meterReading: parseFloat(formData.meterReading),
      recordType: mode
    };

    onSave(newRecord);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-surface-800 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-surface-700/50">
          <h2 className="text-xl font-bold text-white">
            {initialData ? 'Edit Record' : (mode === 'SPOT_CHECK' ? 'New Reading' : 'New Purchase')}
          </h2>
          <button onClick={onCancel} className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Mode Switcher */}
          {!initialData && (
            <div className="flex bg-surface-700/50 p-1 rounded-xl mb-8 border border-white/5">
              <button
                type="button"
                onClick={() => setMode('PURCHASE')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  mode === 'PURCHASE'
                    ? 'bg-gradient-to-r from-volt-500 to-volt-600 text-surface-900 shadow-glow-cyan'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Zap size={16} />
                Purchase
              </button>
              <button
                type="button"
                onClick={() => setMode('SPOT_CHECK')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  mode === 'SPOT_CHECK'
                    ? 'bg-gradient-to-r from-volt-500 to-volt-600 text-surface-900 shadow-glow-cyan'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <ClipboardCheck size={16} />
                Spot Check
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Warning Banner */}
            {usageWarning && (
              <div className="relative overflow-hidden bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl"></div>
                <div className="relative bg-amber-500/20 p-2 rounded-lg h-fit">
                  <AlertTriangle className="text-amber-400" size={18} />
                </div>
                <div className="relative text-sm">
                  <p className="font-bold text-amber-300">High Usage Detected</p>
                  <p className="mt-1 text-amber-200/70">
                    Usage of <strong className="text-amber-200">{usageWarning.current.toFixed(1)} kWh</strong> since last log is unusually high.
                    (Avg: {usageWarning.average.toFixed(1)} kWh). Did you miss a purchase?
                  </p>
                </div>
              </div>
            )}

            {/* Effective Rate Card */}
            {mode === 'PURCHASE' && (
              <div className="relative overflow-hidden bg-gradient-to-r from-volt-500/10 to-volt-600/10 border border-volt-500/20 rounded-xl p-4 flex items-center justify-between">
                <div className="absolute top-0 right-0 w-32 h-32 bg-volt-500/10 rounded-full blur-2xl"></div>
                <div className="relative flex items-center gap-3">
                  <div className="bg-volt-500/20 text-volt-400 p-2.5 rounded-xl">
                    <Calculator size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-volt-300">Effective Rate</div>
                    <div className="text-xs text-volt-400/60">Total Cost / Units</div>
                  </div>
                </div>
                <div className="relative text-right">
                  <div className="text-2xl font-bold text-volt-400 font-mono text-glow-cyan">{currency}{effectiveRate.toFixed(2)}</div>
                  <div className="text-xs text-volt-500">per kWh</div>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Common Fields */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  className="w-full px-4 py-3 bg-surface-700/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-volt-500/50 focus:border-volt-500/50 transition-all placeholder-gray-500"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Meter Reading (kWh)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="e.g. 12050.5"
                  className="w-full px-4 py-3 bg-surface-700/50 border border-white/10 rounded-xl text-white font-mono focus:ring-2 focus:ring-volt-500/50 focus:border-volt-500/50 transition-all placeholder-gray-500"
                  value={formData.meterReading}
                  onChange={e => setFormData({ ...formData, meterReading: e.target.value })}
                />
              </div>

              {/* Purchase Only Fields */}
              {mode === 'PURCHASE' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Price Paid</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-gray-400 font-medium">{currency}</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-surface-700/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-volt-500/50 focus:border-volt-500/50 transition-all placeholder-gray-500"
                        placeholder="0.00"
                        value={formData.price}
                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Units Purchased</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        required
                        className="w-full pl-4 pr-14 py-3 bg-surface-700/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-volt-500/50 focus:border-volt-500/50 transition-all placeholder-gray-500"
                        placeholder="0.0"
                        value={formData.units}
                        onChange={e => setFormData({ ...formData, units: e.target.value })}
                      />
                      <span className="absolute right-4 top-3.5 text-gray-500 text-sm">kWh</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">VAT <span className="text-gray-500 font-normal">(included in price)</span></label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-gray-400 font-medium">{currency}</span>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full pl-10 pr-4 py-3 bg-surface-700/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-volt-500/50 focus:border-volt-500/50 transition-all placeholder-gray-500"
                        placeholder="0.00"
                        value={formData.vat}
                        onChange={e => setFormData({ ...formData, vat: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Service Fee <span className="text-gray-500 font-normal">(included in price)</span></label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-gray-400 font-medium">{currency}</span>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full pl-10 pr-4 py-3 bg-surface-700/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-volt-500/50 focus:border-volt-500/50 transition-all placeholder-gray-500"
                        placeholder="0.00"
                        value={formData.serviceFee}
                        onChange={e => setFormData({ ...formData, serviceFee: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="pt-6 flex justify-end gap-3 border-t border-white/5">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2.5 text-gray-400 font-medium hover:text-white hover:bg-white/5 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-volt-500 to-volt-600 hover:from-volt-400 hover:to-volt-500 text-surface-900 font-bold rounded-xl shadow-glow-cyan hover:shadow-[0_0_30px_rgba(0,212,255,0.4)] transition-all flex items-center gap-2 active:scale-95"
              >
                <Save size={18} />
                {initialData ? 'Update Record' : 'Save Record'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};
