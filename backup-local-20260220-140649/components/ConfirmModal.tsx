import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
}

export const ConfirmModal: React.FC<Props> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDangerous = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-surface-900/80 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-surface-800 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md animate-slide-up overflow-hidden">
        {/* Danger gradient overlay */}
        {isDangerous && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
        )}

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {isDangerous && (
                <div className="p-2 bg-red-500/10 rounded-xl">
                  <AlertTriangle size={20} className="text-red-400" />
                </div>
              )}
              <h3 className="text-lg font-bold text-white">{title}</h3>
            </div>
            <button
              onClick={onCancel}
              className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Message */}
          <p className="text-gray-400 text-sm leading-relaxed mb-6">{message}</p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 bg-surface-700/50 hover:bg-surface-600/50 text-gray-300 font-medium rounded-xl transition-colors border border-white/5"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2.5 font-medium rounded-xl transition-all ${
                isDangerous
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white shadow-lg shadow-red-500/20'
                  : 'bg-gradient-to-r from-volt-500 to-volt-600 hover:from-volt-400 hover:to-volt-500 text-surface-900 shadow-glow-cyan'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
