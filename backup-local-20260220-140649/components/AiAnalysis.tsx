import React, { useState } from 'react';
import { PurchaseRecord, AnalysisResult } from '../types';
import { analyzeElectricityUsage } from '../services/geminiService';
import { Sparkles, BrainCircuit, Lightbulb, TrendingUp, AlertCircle, Zap } from 'lucide-react';

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
      <div className="relative overflow-hidden bg-surface-700/30 p-8 rounded-2xl border border-white/5 text-center">
        <div className="absolute top-0 right-0 w-40 h-40 bg-volt-500/5 rounded-full blur-3xl"></div>
        <div className="relative">
          <div className="bg-surface-600/50 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BrainCircuit size={28} className="text-volt-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">AI Usage Analysis</h3>
          <p className="text-gray-500">Add data to unlock personalized consumption insights powered by Gemini.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!analysis && !loading && (
        <div className="relative overflow-hidden bg-gradient-to-br from-surface-700 via-surface-800 to-surface-700 rounded-2xl p-8 text-center border border-white/5">
          <div className="absolute inset-0 bg-gradient-to-br from-volt-500/10 via-transparent to-energy-500/10"></div>
          <div className="absolute top-0 right-0 w-60 h-60 bg-volt-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-energy-500/10 rounded-full blur-3xl"></div>

          <div className="relative">
            <div className="inline-flex items-center justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-volt-500/30 rounded-2xl blur-lg animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-volt-400 to-volt-600 p-4 rounded-2xl">
                  <Sparkles className="h-8 w-8 text-surface-900" />
                </div>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Unlock Smart Insights</h2>
            <p className="mb-6 text-gray-400 max-w-lg mx-auto leading-relaxed">
              Let Gemini analyze your purchase history to identify spending patterns, efficiency trends, and opportunities to save.
            </p>
            <button
              onClick={handleAnalyze}
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-volt-500 to-volt-600 text-surface-900 font-bold rounded-xl shadow-glow-cyan hover:from-volt-400 hover:to-volt-500 transition-all active:scale-95"
            >
              <BrainCircuit size={20} />
              Analyze My Usage
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="bg-surface-700/30 p-12 rounded-2xl border border-white/5 text-center">
          <div className="relative inline-block mb-4">
            <div className="w-12 h-12 border-2 border-volt-500/30 rounded-full"></div>
            <div className="absolute inset-0 w-12 h-12 border-2 border-volt-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-400 font-medium animate-pulse">Consulting with Gemini...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 p-4 rounded-2xl border border-red-500/20 flex items-start gap-3">
          <AlertCircle className="text-red-400 mt-0.5 flex-shrink-0" size={20} />
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {analysis && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
          {/* Summary Card */}
          <div className="relative overflow-hidden bg-surface-700/30 p-6 rounded-2xl border border-white/5 md:col-span-2">
            <div className="absolute top-0 right-0 w-32 h-32 bg-volt-500/5 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-volt-500/10 rounded-xl">
                  <BrainCircuit size={20} className="text-volt-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Executive Summary</h3>
              </div>
              <p className="text-gray-300 leading-relaxed">{analysis.summary}</p>
            </div>
          </div>

          {/* Trend Card */}
          <div className="relative overflow-hidden bg-surface-700/30 p-6 rounded-2xl border border-white/5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-500/10 rounded-xl">
                  <TrendingUp size={20} className="text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Trend Analysis</h3>
              </div>
              <p className="text-gray-300">{analysis.trend}</p>
            </div>
          </div>

          {/* Recommendations Card */}
          <div className="relative overflow-hidden bg-surface-700/30 p-6 rounded-2xl border border-white/5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-energy-500/5 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-energy-500/10 rounded-xl">
                  <Lightbulb size={20} className="text-energy-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Savings Tips</h3>
              </div>
              <ul className="space-y-3">
                {analysis.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-300 text-sm">
                    <Zap size={14} className="text-energy-500 mt-0.5 flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="md:col-span-2 text-center">
            <button
              onClick={handleAnalyze}
              className="text-sm text-volt-400 hover:text-volt-300 font-medium transition-colors"
            >
              Refresh Analysis
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
