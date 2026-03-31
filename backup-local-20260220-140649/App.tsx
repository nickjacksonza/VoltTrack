import React, { useState, useEffect, useMemo } from 'react';
import { PurchaseRecord, AppView, BackupData } from './types';
import { APP_NAME, DEFAULT_CURRENCY_SYMBOL } from './constants';
import { SummaryCards } from './components/SummaryCards';
import { UsageChart } from './components/UsageChart';
import { HistoryTable } from './components/HistoryTable';
import { AddRecordForm } from './components/AddRecordForm';
import { AiAnalysis } from './components/AiAnalysis';
import { AnomalyAlert } from './components/AnomalyAlert';
import { MonthlyAnalysis } from './components/MonthlyAnalysis';
import { CloudSync } from './components/CloudSync';
import { ConfirmModal } from './components/ConfirmModal';
import { Zap, LayoutDashboard, History, Plus, BarChart3, ClipboardCheck, CalendarDays, ChevronLeft, Activity, Download } from 'lucide-react';
import { exportRecordsToCsv } from './utils/exportCsv';

const STORAGE_KEY = 'volttrack_data_v1';
const SETTINGS_KEY = 'volttrack_settings_v1';

function App() {
  // --- State Management ---
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);

  // Initialize Records (Lazy Load) - Always sorted chronologically (oldest first)
  const [records, setRecords] = useState<PurchaseRecord[]>(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        // Handle both old format (array) and new format (object with records)
        const rawRecords = Array.isArray(parsed) ? parsed : (parsed.records || []);

        // Migrate any simple IDs to proper generated IDs
        const migratedRecords = rawRecords.map((r: PurchaseRecord) => {
          if (/^[0-9]+$/.test(r.id)) {
            // Replace numeric-only IDs with proper generated IDs
            return { ...r, id: Date.now().toString(36) + Math.random().toString(36).substring(2, 9) };
          }
          return r;
        });

        // Always sort chronologically (ascending by date) on load
        return migratedRecords.sort((a: PurchaseRecord, b: PurchaseRecord) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
      }
      // Start with empty array - no mock data
      return [];
    } catch (e) {
      console.error("Failed to load records:", e);
      return [];
    }
  });

  // Initialize Settings (Lazy Load)
  const [currency, setCurrency] = useState<string>(() => {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      return savedSettings ? JSON.parse(savedSettings).currency : DEFAULT_CURRENCY_SYMBOL;
    } catch (e) {
      return DEFAULT_CURRENCY_SYMBOL;
    }
  });

  const [addMode, setAddMode] = useState<'PURCHASE' | 'SPOT_CHECK'>('PURCHASE');
  const [editingRecord, setEditingRecord] = useState<PurchaseRecord | null>(null);

  // --- Modal State for Deletion ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);

  // --- Effects ---
  // Save records in chronological order (single source of truth)
  useEffect(() => {
    const sortedForStorage = [...records].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sortedForStorage));
  }, [records]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ currency }));
  }, [currency]);

  // --- Computed Values ---
  // records: always chronological (oldest first) - use for charts, analysis, calculations
  // recentFirst: reverse order (newest first) - use for Recent Activity display
  const recentFirst = useMemo(() => [...records].reverse(), [records]);

  // --- Action Handlers ---
  const handleCurrencyChange = (newSymbol: string) => {
    setCurrency(newSymbol);
  };

  const handleSaveRecord = (record: PurchaseRecord) => {
    if (editingRecord) {
      // Update existing record and re-sort to maintain chronological order
      setRecords(prev => {
        const updated = prev.map(r => r.id === record.id ? record : r);
        return updated.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      });
      setEditingRecord(null);
    } else {
      // Add new record and maintain chronological order
      setRecords(prev => {
        const newRecords = [...prev, record];
        return newRecords.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      });
    }
    setView(AppView.DASHBOARD);
  };

  const requestDelete = (id: string) => {
    setRecordToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (recordToDelete) {
      setRecords(prev => prev.filter(r => r.id !== recordToDelete));
      setRecordToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  const cancelDelete = () => {
    setRecordToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const handleEditRecord = (id: string) => {
    const record = records.find(r => r.id === id);
    if (record) {
      setEditingRecord(record);
      setAddMode(record.recordType || 'PURCHASE');
      setView(AppView.ADD);
    }
  };

  const handleCloudRestore = (data: BackupData) => {
    if (window.confirm(`Found backup with ${data.records.length} records. Restore? This will overwrite current data.`)) {
      // Sort restored records chronologically (oldest first)
      const sortedRecords = [...data.records].sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setRecords(sortedRecords);
      setCurrency(data.currency);
      setView(AppView.DASHBOARD);
    }
  };

  const openAddForm = (mode: 'PURCHASE' | 'SPOT_CHECK') => {
    setEditingRecord(null);
    setAddMode(mode);
    setView(AppView.ADD);
  };

  // --- Render Helpers ---
  const NavButton = ({ targetView, icon: Icon, label }: { targetView: AppView, icon: any, label: string }) => (
    <button
      onClick={() => setView(targetView)}
      className={`flex flex-col items-center justify-center w-full py-3 px-1 rounded-xl transition-all duration-300 ${
        view === targetView
          ? 'text-volt-500 bg-volt-500/10 font-semibold shadow-glow-cyan'
          : 'text-gray-500 hover:text-gray-300 hover:bg-surface-600/50'
      }`}
    >
      <Icon size={22} className="mb-1" />
      <span className="text-xs tracking-wide">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-surface-900 bg-grid flex flex-col relative">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-volt-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-60 h-60 bg-energy-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* --- Confirmation Modal --- */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Record"
        message="Are you sure you want to permanently delete this record? This action cannot be undone."
        confirmText="Delete"
        isDangerous={true}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      {/* --- Header --- */}
      <header className="glass sticky top-0 z-30 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setView(AppView.DASHBOARD)}>
            {/* Logo */}
            <div className="relative">
              <div className="absolute inset-0 bg-volt-500/30 rounded-xl blur-lg group-hover:bg-volt-500/50 transition-all"></div>
              <div className="relative bg-gradient-to-br from-volt-400 to-volt-600 p-2.5 rounded-xl shadow-glow-cyan">
                <Zap className="text-surface-900" size={20} strokeWidth={2.5} />
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold tracking-tight text-white">
                {APP_NAME}
              </h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest -mt-0.5">Smart Monitor</p>
            </div>

            {/* Currency Editor */}
            <div className="flex items-center bg-surface-700/50 hover:bg-surface-600/50 border border-white/5 rounded-lg px-2.5 py-1.5 transition-colors ml-2" title="Change Currency">
              <span className="text-[10px] text-gray-500 font-semibold uppercase mr-1.5 tracking-wider">Curr</span>
              <input
                className="bg-transparent w-8 text-center font-bold text-volt-400 text-sm focus:outline-none p-0 border-none"
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                maxLength={3}
                aria-label="Currency Symbol"
              />
            </div>
          </div>

          {view !== AppView.ADD && (
            <div className="flex gap-3 items-center">
              {/* Export CSV */}
              <button
                onClick={() => exportRecordsToCsv(records, currency)}
                className="p-2 rounded-lg hover:bg-surface-600/50 text-gray-400 hover:text-volt-400 transition-all"
                title="Export to CSV"
              >
                <Download size={20} />
              </button>

              <CloudSync records={records} currency={currency} onRestore={handleCloudRestore} />

              <div className="h-6 w-px bg-white/10 hidden sm:block"></div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAddForm('SPOT_CHECK')}
                  className="hidden sm:flex items-center gap-2 px-3 py-2 bg-surface-700/50 border border-white/10 text-gray-300 rounded-lg text-sm font-medium hover:bg-surface-600/50 hover:border-white/20 transition-all"
                >
                  <ClipboardCheck size={16} className="text-energy-400" />
                  Spot Check
                </button>
                <button
                  onClick={() => openAddForm('PURCHASE')}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-volt-500 to-volt-600 text-surface-900 rounded-lg text-sm font-bold hover:from-volt-400 hover:to-volt-500 shadow-glow-cyan hover:shadow-[0_0_30px_rgba(0,212,255,0.4)] transition-all active:scale-95"
                >
                  <Plus size={18} strokeWidth={2.5} />
                  <span className="hidden sm:inline">Log Purchase</span>
                  <span className="sm:hidden">Add</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 pb-24 md:pb-12 relative z-10">

        {view === AppView.DASHBOARD && (
          <div className="space-y-8">
            {/* Top Level Alerts */}
            <AnomalyAlert records={records} />

            {/* Stats Overview */}
            <section className="animate-slide-up">
              <SummaryCards records={records} currency={currency} />
            </section>

            {/* Charts & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up delay-100">
              <div className="lg:col-span-2">
                <UsageChart records={records} currency={currency} />
              </div>

              <div className="lg:col-span-1 flex flex-col gap-4">
                {/* Quick Analysis Card */}
                <div className="relative overflow-hidden bg-gradient-to-br from-surface-700 to-surface-800 rounded-2xl p-6 border border-white/5 flex-1 flex flex-col justify-center">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-volt-500/10 rounded-full blur-2xl"></div>
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 bg-volt-500/20 rounded-lg">
                        <BarChart3 size={18} className="text-volt-400" />
                      </div>
                      <h3 className="font-semibold text-white">AI Insights</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                      {records.length > 0
                        ? `Analyzing ${records.length} records. Get your spending breakdown and savings tips.`
                        : "Log your first purchase to unlock AI-powered insights."}
                    </p>
                    <button
                      onClick={() => setView(AppView.INSIGHTS)}
                      className="w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium transition-all border border-white/10 hover:border-volt-500/30 text-gray-300 hover:text-white"
                    >
                      View Analysis
                    </button>
                  </div>
                </div>

                {/* Monthly View Card */}
                <button
                  onClick={() => setView(AppView.MONTHLY)}
                  className="w-full p-5 bg-surface-700/50 border border-white/5 rounded-2xl hover:border-volt-500/30 transition-all flex items-center justify-between group card-hover"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-energy-500/10 text-energy-400 rounded-xl group-hover:bg-energy-500/20 transition-colors">
                      <CalendarDays size={22} />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-white">Monthly View</div>
                      <div className="text-xs text-gray-500 mt-0.5">Calendar & Weekly Breakdown</div>
                    </div>
                  </div>
                  <div className="text-gray-600 group-hover:text-volt-500 transition-colors">
                    <ChevronLeft size={20} className="rotate-180" />
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Activity Table */}
            <section className="animate-slide-up delay-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-volt-500/10 rounded-lg">
                    <Activity size={18} className="text-volt-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Recent Activity</h3>
                </div>
                {records.length > 5 && (
                  <button
                    onClick={() => setView(AppView.HISTORY)}
                    className="text-sm text-volt-400 hover:text-volt-300 font-medium transition-colors"
                  >
                    View All
                  </button>
                )}
              </div>
              <HistoryTable
                records={recentFirst.slice(0, 5)}
                onDelete={requestDelete}
                onEdit={handleEditRecord}
                currency={currency}
              />
            </section>
          </div>
        )}

        {view === AppView.HISTORY && (
          <div className="animate-fade-in space-y-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setView(AppView.DASHBOARD)} className="p-2 hover:bg-surface-600/50 rounded-xl text-gray-400 hover:text-white transition-colors">
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-2xl font-bold text-white">Full History</h2>
            </div>
            <HistoryTable
              records={recentFirst}
              onDelete={requestDelete}
              onEdit={handleEditRecord}
              currency={currency}
            />
          </div>
        )}

        {view === AppView.ADD && (
          <div className="animate-fade-in">
            <AddRecordForm
              onSave={handleSaveRecord}
              onCancel={() => {
                setEditingRecord(null);
                setView(AppView.DASHBOARD);
              }}
              records={records}
              initialMode={addMode}
              initialData={editingRecord}
              currency={currency}
            />
          </div>
        )}

        {view === AppView.INSIGHTS && (
          <div className="animate-fade-in space-y-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setView(AppView.DASHBOARD)} className="p-2 hover:bg-surface-600/50 rounded-xl text-gray-400 hover:text-white transition-colors">
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-2xl font-bold text-white">Smart Insights</h2>
            </div>
            <AiAnalysis records={records} currency={currency} />
          </div>
        )}

        {view === AppView.MONTHLY && (
          <div className="animate-fade-in space-y-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setView(AppView.DASHBOARD)} className="p-2 hover:bg-surface-600/50 rounded-xl text-gray-400 hover:text-white transition-colors">
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-2xl font-bold text-white">Monthly Breakdown</h2>
            </div>
            <MonthlyAnalysis records={records} currency={currency} />
          </div>
        )}
      </main>

      {/* --- Mobile Bottom Nav --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-white/5 px-2 py-1 z-40 safe-area-pb">
        <div className="grid grid-cols-4 gap-1">
          <NavButton targetView={AppView.DASHBOARD} icon={LayoutDashboard} label="Home" />
          <NavButton targetView={AppView.MONTHLY} icon={CalendarDays} label="Monthly" />
          <NavButton targetView={AppView.HISTORY} icon={History} label="History" />
          <NavButton targetView={AppView.INSIGHTS} icon={BarChart3} label="Insights" />
        </div>
      </nav>
    </div>
  );
}

export default App;
