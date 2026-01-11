import React, { useState } from 'react';
import { PurchaseRecord, AnalysisResult } from '../types';
import { analyzeElectricityUsage } from '../services/geminiService';
import { Sparkles, BrainCircuit, Lightbulb, TrendingUp, AlertCircle } from 'lucide-react';

interface Props {
  records: PurchaseRecord[];
  currency: string;
}

export const AiAnalysis: React.FC<Props> = ({ records, currency }) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeElectricityUsage(records, currency);
      setAnalysis(result);
    } catch (err) {
      setError("Failed to generate insights. Please check your internet connection or API key.");
    } finally {
      setLoading(false);
    }
  };

  if (records.length === 0) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-8 rounded-xl border border-blue-100 text-center">
        <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-blue-600">
          <BrainCircuit size={24} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Usage Analysis</h3>
        <p className="text-gray-600 mb-4">Add data to unlock personalized consumption insights powered by Gemini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!analysis && !loading && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-8 text-white text-center shadow-lg">
          <Sparkles className="mx-auto mb-4 h-10 w-10 text-yellow-300" />
          <h2 className="text-2xl font-bold mb-2">Unlock Smart Insights</h2>
          <p className="mb-6 text-blue-100 max-w-lg mx-auto">
            Let Gemini analyze your purchase history to identify spending patterns, efficiency trends, and opportunities to save.
          </p>
          <button
            onClick={handleAnalyze}
            className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-full shadow-md hover:bg-blue-50 transition-transform active:scale-95 flex items-center gap-2 mx-auto"
          >
            <BrainCircuit size={20} />
            Analyze My Usage
          </button>
        </div>
      )}

      {loading && (
        <div className="bg-white p-12 rounded-xl border border-gray-100 shadow-sm text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium animate-pulse">Consulting with Gemini...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-start gap-3 text-red-700">
          <AlertCircle className="mt-0.5 flex-shrink-0" size={20} />
          <p>{error}</p>
        </div>
      )}

      {analysis && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          {/* Summary Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm md:col-span-2">
             <div className="flex items-center gap-3 mb-4">
               <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                 <BrainCircuit size={20} />
               </div>
               <h3 className="text-lg font-bold text-gray-900">Executive Summary</h3>
             </div>
             <p className="text-gray-700 leading-relaxed">{analysis.summary}</p>
          </div>

          {/* Trend Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
               <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                 <TrendingUp size={20} />
               </div>
               <h3 className="text-lg font-bold text-gray-900">Trend Analysis</h3>
             </div>
             <p className="text-gray-700">{analysis.trend}</p>
          </div>

          {/* Recommendations Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
             <div className="flex items-center gap-3 mb-4">
               <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                 <Lightbulb size={20} />
               </div>
               <h3 className="text-lg font-bold text-gray-900">Savings Tips</h3>
             </div>
             <ul className="space-y-3">
               {analysis.recommendations.map((rec, idx) => (
                 <li key={idx} className="flex items-start gap-2 text-gray-700 text-sm">
                   <span className="font-bold text-amber-500 mt-1">•</span>
                   {rec}
                 </li>
               ))}
             </ul>
          </div>
          
          <div className="md:col-span-2 text-center">
            <button 
              onClick={handleAnalyze}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium underline decoration-blue-300 hover:decoration-blue-800"
            >
              Refresh Analysis
            </button>
          </div>
        </div>
      )}
    </div>
  );
};