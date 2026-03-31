import React, { useState, useEffect } from 'react';
import { Cloud, Download, Upload, Check, AlertCircle, User as UserIcon, LogOut, Settings } from 'lucide-react';
import { initGoogleServices, loginToGoogle, backupToDrive, restoreFromDrive } from '../services/driveService';
import { PurchaseRecord, UserProfile, BackupData } from '../types';
import { GOOGLE_CLIENT_ID } from '../constants';

interface Props {
  records: PurchaseRecord[];
  currency: string;
  onRestore: (data: BackupData) => void;
}

export const CloudSync: React.FC<Props> = ({ records, currency, onRestore }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [servicesReady, setServicesReady] = useState(false);

  useEffect(() => {
    if (GOOGLE_CLIENT_ID) {
      initGoogleServices(() => {
        setServicesReady(true);
        const savedUser = localStorage.getItem('volttrack_user_v1');
        if (savedUser) setUser(JSON.parse(savedUser));
      });
    }
  }, []);

  const handleLogin = async () => {
    if (!servicesReady) return;
    try {
      const profile = await loginToGoogle();
      setUser(profile);
      localStorage.setItem('volttrack_user_v1', JSON.stringify(profile));
    } catch (err) {
      console.error("Login failed", err);
      setMessage("Login failed. Check console.");
      setStatus('error');
    }
  };

  const handleLogout = () => {
    const token = window.gapi?.client?.getToken();
    if (token && window.google) {
      window.google.accounts.oauth2.revoke(token.access_token, () => {});
    }
    window.gapi?.client?.setToken(null);
    setUser(null);
    localStorage.removeItem('volttrack_user_v1');
    setIsOpen(false);
  };

  const handleBackup = async () => {
    if (!user) return;
    setStatus('loading');
    setMessage('Backing up to Google Drive...');

    try {
      const data: BackupData = {
        records,
        currency,
        lastUpdated: new Date().toISOString()
      };
      const resultMsg = await backupToDrive(data);
      setStatus('success');
      setMessage(resultMsg);
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage('Backup failed.');
    }
  };

  const handleRestore = async () => {
    if (!user) return;
    setStatus('loading');
    setMessage('Searching for backup...');

    try {
      const data = await restoreFromDrive();
      if (data) {
        onRestore(data);
        setStatus('success');
        setMessage('Data restored successfully!');
        setTimeout(() => setStatus('idle'), 3000);
      }
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setMessage(err.message || 'Restore failed.');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg transition-all ${
          isOpen ? 'bg-volt-500/10 text-volt-400 shadow-glow-cyan' : 'hover:bg-surface-600/50 text-gray-400'
        }`}
        title="Cloud Sync"
      >
        <Cloud size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-72 bg-surface-800 rounded-2xl shadow-2xl border border-white/10 p-4 z-50 animate-slide-up">
          {!GOOGLE_CLIENT_ID ? (
            <div className="text-center py-4">
              <div className="bg-energy-500/10 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Settings size={22} className="text-energy-400" />
              </div>
              <h3 className="font-bold text-white mb-1">Setup Required</h3>
              <p className="text-xs text-gray-500 leading-relaxed px-2">
                To enable Cloud Backup, please set the <code className="text-volt-400">GOOGLE_CLIENT_ID</code> in your <code className="text-volt-400">constants.ts</code> file.
              </p>
            </div>
          ) : !user ? (
            <div className="text-center py-2">
              <h3 className="font-bold text-white mb-2">Cloud Backup</h3>
              <p className="text-xs text-gray-500 mb-4">Sign in with Google to backup and sync your data across devices.</p>
              <button
                onClick={handleLogin}
                disabled={!servicesReady}
                className="w-full py-2.5 bg-gradient-to-r from-volt-500 to-volt-600 hover:from-volt-400 hover:to-volt-500 text-surface-900 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {servicesReady ? 'Sign in with Google' : 'Initializing...'}
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-3">
                {user.picture ? (
                  <img src={user.picture} alt={user.name} className="w-9 h-9 rounded-xl" />
                ) : (
                  <div className="w-9 h-9 bg-volt-500/10 text-volt-400 rounded-xl flex items-center justify-center">
                    <UserIcon size={18} />
                  </div>
                )}
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-bold text-white truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                  <LogOut size={16} />
                </button>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleBackup}
                  disabled={status === 'loading'}
                  className="w-full py-2.5 px-3 bg-surface-700/50 hover:bg-volt-500/10 text-gray-300 hover:text-volt-400 rounded-xl text-sm font-medium flex items-center gap-3 transition-all border border-white/5 hover:border-volt-500/30"
                >
                  <Upload size={16} />
                  Backup to Drive
                </button>

                <button
                  onClick={handleRestore}
                  disabled={status === 'loading'}
                  className="w-full py-2.5 px-3 bg-surface-700/50 hover:bg-energy-500/10 text-gray-300 hover:text-energy-400 rounded-xl text-sm font-medium flex items-center gap-3 transition-all border border-white/5 hover:border-energy-500/30"
                >
                  <Download size={16} />
                  Restore from Drive
                </button>
              </div>

              {status !== 'idle' && (
                <div className={`mt-3 p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                  status === 'loading' ? 'bg-volt-500/10 text-volt-300' :
                  status === 'success' ? 'bg-emerald-500/10 text-emerald-300' :
                  'bg-red-500/10 text-red-300'
                }`}>
                  {status === 'loading' && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>}
                  {status === 'success' && <Check size={14} />}
                  {status === 'error' && <AlertCircle size={14} />}
                  <span>{message}</span>
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-white/5 text-[10px] text-gray-600 text-center">
                Saved to 'VoltTrack_Data.json' in Drive
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
