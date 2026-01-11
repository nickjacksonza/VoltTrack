import React, { useState, useEffect, useMemo } from 'react';
import { PurchaseRecord, AppView, BackupData } from './types';
import { MOCK_DATA, APP_NAME, DEFAULT_CURRENCY_SYMBOL } from './constants';
import { SummaryCards } from './components/SummaryCards';
import { UsageChart } from './components/UsageChart';
import { HistoryTable } from './components/HistoryTable';
import { AddRecordForm } from './components/AddRecordForm';
import { AiAnalysis } from './components/AiAnalysis';
import { AnomalyAlert } from './components/AnomalyAlert';
import { MonthlyAnalysis } from './components/MonthlyAnalysis';
import { CloudSync } from './components/CloudSync';
import { ConfirmModal } from './components/ConfirmModal'; // New Component
import { Zap, LayoutDashboard, History, Plus, BarChart3, ClipboardCheck, CalendarDays, ChevronLeft } from 'lucide-react';

const STORAGE_KEY = 'volttrack_data_v1';
const SETTINGS_KEY = 'volttrack_settings_v1';

function App() {
  // --- State Management ---
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  
  // Initialize Records (Lazy Load)
  const [records, setRecords] = useState<PurchaseRecord[]>(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      return savedData ? JSON.parse(savedData) : MOCK_DATA;
    } catch (e) {
      console.error("Failed to load records:", e);
      return MOCK_DATA;
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
  // Persist records whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  // Persist settings whenever they change
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ currency }));
  }, [currency]);

  // --- Computed Values ---
  // Centralized Sorting: "Single Source of Truth" for ordered lists.
  // We sort once here, and pass this to any component that needs an ordered list.
  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records]);

  // --- Action Handlers ---

  const handleCurrencyChange = (newSymbol: string) => {
    setCurrency(newSymbol);
  };

  const handleSaveRecord = (record: PurchaseRecord) => {
    if (editingRecord) {
      // Update existing
      setRecords(prev => prev.map(r => r.id === record.id ? record : r));
      setEditingRecord(null);
    } else {
      // Add new
      setRecords(prev => [record, ...prev]);
    }
    setView(AppView.DASHBOARD);
  };

  // Step 1: User clicks delete -> Open Modal
  const requestDelete = (id: string) => {
    setRecordToDelete(id);
    setIsDeleteModalOpen(true);
  };

  // Step 2: User confirms -> Perform Delete
  const confirmDelete = () => {
    if (recordToDelete) {
      setRecords(prev => prev.filter(r => r.id !== recordToDelete));
      setRecordToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  // Step 3: User cancels -> Close Modal
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
    // We can stick with window.confirm here for now as it's a rare, destructive full-app action
    // or upgrade to a modal later.
    if (window.confirm(`Found backup with ${data.records.length} records. Restore? This will overwrite current data.`)) {
      setRecords(data.records);
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
      className={`flex flex-col items-center justify-center w-full py-3 px-1 rounded-xl transition-all duration-200 ${
        view === targetView 
          ? 'text-blue-600 bg-blue-50 font-semibold' 
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
      }`}
    >
      <Icon size={22} className="mb-1" />
      <span className="text-xs">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      
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
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView(AppView.DASHBOARD)}>
            <div className="bg-blue-600 p-2 rounded-lg shadow-sm group-hover:bg-blue-700 transition-colors">
              <Zap className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight hidden sm:block text-gray-900">
              {APP_NAME}
            </h1>
            
            {/* Currency Editor */}
            <div className="flex items-center bg-gray-100 hover:bg-gray-200 rounded-md px-2 py-1 transition-colors" title="Change Currency">
                <span className="text-[10px] text-gray-500 font-bold uppercase mr-1">Curr</span>
                <input 
                    className="bg-transparent w-8 text-center font-bold text-gray-800 text-sm focus:outline-none p-0 border-none"
                    value={currency}
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                    maxLength={3}
                    aria-label="Currency Symbol"
                />
            </div>
          </div>

          {view !== AppView.ADD && (
            <div className="flex gap-3 items-center">
              <CloudSync records={records} currency={currency} onRestore={handleCloudRestore} />
              
              <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAddForm('SPOT_CHECK')}
                  className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  <ClipboardCheck size={16} />
                  Spot Check
                </button>
                <button
                  onClick={() => openAddForm('PURCHASE')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm hover:shadow transition-all active:scale-95"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">Log Purchase</span>
                  <span className="sm:hidden">Add</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 pb-24 md:pb-12">
        
        {view === AppView.DASHBOARD && (
          <div className="space-y-8 animate-fade-in">
            {/* Top Level Alerts */}
            <AnomalyAlert records={records} />

            {/* Stats Overview */}
            <section>
              <SummaryCards records={sortedRecords} currency={currency} />
            </section>

            {/* Charts & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <UsageChart records={sortedRecords} currency={currency} />
              </div>
              
              <div className="lg:col-span-1 flex flex-col gap-4">
                 {/* Quick Analysis Card */}
                 <div className="bg-slate-900 rounded-xl p-6 text-white shadow-lg flex-1 flex flex-col justify-center">
                   <div className="flex items-center gap-2 mb-3 text-blue-300">
                      <BarChart3 size={20} />
                      <h3 className="font-semibold">AI Insights</h3>
                   </div>
                   <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                     {records.length > 0 
                       ? `Analyzing ${records.length} records. Tap below to see your full spending breakdown and savings tips.`
                       : "Log your first purchase to unlock AI-powered insights."}
                   </p>
                   <button 
                    onClick={() => setView(AppView.INSIGHTS)}
                    className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors border border-white/10"
                   >
                     View Analysis
                   </button>
                 </div>

                 {/* Monthly View Card */}
                 <button 
                    onClick={() => setView(AppView.MONTHLY)}
                    className="w-full p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
                   >
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors">
                            <CalendarDays size={24} />
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-gray-900">Monthly View</div>
                            <div className="text-xs text-gray-500 mt-1">Calendar & Weekly Breakdown</div>
                        </div>
                     </div>
                     <div className="text-gray-300 group-hover:text-blue-600 transition-colors">
                       <ChevronLeft size={20} className="rotate-180" />
                     </div>
                   </button>
              </div>
            </div>

            {/* Recent Activity Table */}
            <section>
               <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
                  {records.length > 5 && (
                    <button 
                      onClick={() => setView(AppView.HISTORY)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View All
                    </button>
                  )}
               </div>
               <HistoryTable 
                records={sortedRecords.slice(0, 5)} 
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
               <button onClick={() => setView(AppView.DASHBOARD)} className="p-2 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors">
                  <ChevronLeft size={24} />
               </button>
               <h2 className="text-2xl font-bold text-gray-900">Full History</h2>
            </div>
            <HistoryTable 
              records={sortedRecords} 
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
               <button onClick={() => setView(AppView.DASHBOARD)} className="p-2 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors">
                  <ChevronLeft size={24} />
               </button>
               <h2 className="text-2xl font-bold text-gray-900">Smart Insights</h2>
            </div>
            <AiAnalysis records={records} currency={currency} />
          </div>
        )}

        {view === AppView.MONTHLY && (
          <div className="animate-fade-in space-y-6">
             <div className="flex items-center gap-3">
                <button onClick={() => setView(AppView.DASHBOARD)} className="p-2 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors">
                    <ChevronLeft size={24} />
                </button>
                <h2 className="text-2xl font-bold text-gray-900">Monthly Breakdown</h2>
             </div>
            <MonthlyAnalysis records={records} currency={currency} />
          </div>
        )}
      </main>

      {/* --- Mobile Bottom Nav --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1 z-40 safe-area-pb shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
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