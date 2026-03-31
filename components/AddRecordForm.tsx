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
  
  // Format Date for Input: YYYY-MM-DDTHH:mm
  const toLocalISOString = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    price: '',
    units: '',
    date: toLocalISOString(new Date()),
    vat: '',
    serviceFee: '0',
    meterReading: ''
  });

  // Pre-fill if editing
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
        // Reset to defaults if switching back to add mode
        setMode(initialMode);
        setFormData(prev => ({ ...prev, date: toLocalISOString(new Date()) }));
    }
  }, [initialData, initialMode]);

  // Live Calculations
  const effectiveRate = useMemo(() => {
    if (mode === 'SPOT_CHECK') return 0;
    const price = parseFloat(formData.price) || 0;
    const vat = parseFloat(formData.vat) || 0;
    const fee = parseFloat(formData.serviceFee) || 0;
    const units = parseFloat(formData.units) || 0;

    if (units <= 0) return 0;
    return (price + vat + fee) / units;
  }, [formData, mode]);

  // Usage Warning Logic
  const usageWarning = useMemo(() => {
    if (initialData) return null; // Don't warn on edit

    const currentReading = parseFloat(formData.meterReading);
    if (isNaN(currentReading)) return null;

    // Get previous reading from *any* valid record
    const sorted = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastRecord = sorted[0];

    if (!lastRecord) return null;

    const currentUsage = currentReading - lastRecord.meterReading;
    if (currentUsage <= 0) return null;

    // Calculate historical average (Between Recharges Only)
    // We only care about purchase intervals to detect "missed purchases"
    const rechargeRecords = sorted.filter(r => r.recordType !== 'SPOT_CHECK' && r.units > 0);
    
    let totalUsage = 0;
    let count = 0;

    for (let i = 0; i < rechargeRecords.length - 1; i++) {
        const diff = rechargeRecords[i].meterReading - rechargeRecords[i+1].meterReading;
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
    
    // Robust ID generation
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
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
           <h2 className="text-xl font-bold text-gray-800">
             {initialData ? 'Edit Record' : (mode === 'SPOT_CHECK' ? 'New Reading' : 'New Purchase')}
           </h2>
           <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
             <X size={24} />
           </button>
        </div>

        <div className="p-6">
          {/* Mode Switcher */}
          {!initialData && (
              <div className="flex bg-gray-100 p-1 rounded-lg mb-8">
                <button
                  type="button"
                  onClick={() => setMode('PURCHASE')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-md transition-all ${
                    mode === 'PURCHASE' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Zap size={16} />
                  Purchase
                </button>
                <button
                  type="button"
                  onClick={() => setMode('SPOT_CHECK')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-md transition-all ${
                    mode === 'SPOT_CHECK' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
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
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                <div className="text-sm text-amber-900">
                  <p className="font-bold">High Usage Detected</p>
                  <p className="mt-1 opacity-90">
                    Usage of <strong>{usageWarning.current.toFixed(1)} kWh</strong> since last log is unusually high. 
                    (Avg: {usageWarning.average.toFixed(1)} kWh). Did you miss a purchase?
                  </p>
                </div>
              </div>
            )}

            {/* Effective Rate Card */}
            {mode === 'PURCHASE' && (
               <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                      <Calculator size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-blue-900">Effective Rate</div>
                      <div className="text-xs text-blue-600">Total Cost / Units</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-700">{currency}{effectiveRate.toFixed(2)}</div>
                    <div className="text-xs text-blue-500">per kWh</div>
                  </div>
               </div>
            )}

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Common Fields */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Meter Reading (kWh)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="e.g. 12050.5"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                  value={formData.meterReading}
                  onChange={e => setFormData({...formData, meterReading: e.target.value})}
                />
              </div>

              {/* Purchase Only Fields */}
              {mode === 'PURCHASE' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Price Paid</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500 font-medium">{currency}</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="0.00"
                        value={formData.price}
                        onChange={e => setFormData({...formData, price: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Units Purchased</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        required
                        className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="0.0"
                        value={formData.units}
                        onChange={e => setFormData({...formData, units: e.target.value})}
                      />
                      <span className="absolute right-3 top-2.5 text-gray-500 text-sm">kWh</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">VAT</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500 font-medium">{currency}</span>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="0.00"
                        value={formData.vat}
                        onChange={e => setFormData({...formData, vat: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Service Fee</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500 font-medium">{currency}</span>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="0.00"
                        value={formData.serviceFee}
                        onChange={e => setFormData({...formData, serviceFee: e.target.value})}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="pt-6 flex justify-end gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition-all flex items-center gap-2"
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