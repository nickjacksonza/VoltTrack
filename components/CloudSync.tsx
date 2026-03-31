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
        // Try to restore session user
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
        className={`p-2 rounded-lg transition-colors ${
          isOpen ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-500'
        }`}
        title="Cloud Sync"
      >
        <Cloud size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-72 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50 animate-fade-in">
          {!GOOGLE_CLIENT_ID ? (
             <div className="text-center py-4">
                <div className="bg-amber-50 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 text-amber-500">
                    <Settings size={20} />
                </div>
                <h3 className="font-bold text-gray-800 mb-1">Setup Required</h3>
                <p className="text-xs text-gray-500 leading-relaxed px-2">
                    To enable Cloud Backup, please set the <code>GOOGLE_CLIENT_ID</code> in your <code>constants.ts</code> file.
                </p>
             </div>
          ) : !user ? (
            <div className="text-center py-2">
              <h3 className="font-bold text-gray-800 mb-2">Cloud Backup</h3>
              <p className="text-xs text-gray-500 mb-4">Sign in with Google to backup and sync your data across devices.</p>
              <button
                onClick={handleLogin}
                disabled={!servicesReady}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {servicesReady ? 'Sign in with Google' : 'Initializing...'}
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-3">
                {user.picture ? (
                  <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    <UserIcon size={16} />
                  </div>
                )}
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-bold text-gray-800 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors">
                  <LogOut size={16} />
                </button>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleBackup}
                  disabled={status === 'loading'}
                  className="w-full py-2 px-3 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors"
                >
                  <Upload size={16} />
                  Backup to Drive
                </button>
                
                <button
                  onClick={handleRestore}
                  disabled={status === 'loading'}
                  className="w-full py-2 px-3 bg-gray-50 hover:bg-amber-50 text-gray-700 hover:text-amber-700 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors"
                >
                  <Download size={16} />
                  Restore from Drive
                </button>
              </div>

              {status !== 'idle' && (
                <div className={`mt-3 p-2 rounded-lg text-xs flex items-center gap-2 ${
                  status === 'loading' ? 'bg-blue-50 text-blue-700' :
                  status === 'success' ? 'bg-green-50 text-green-700' :
                  'bg-red-50 text-red-700'
                }`}>
                  {status === 'loading' && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>}
                  {status === 'success' && <Check size={12} />}
                  {status === 'error' && <AlertCircle size={12} />}
                  <span>{message}</span>
                </div>
              )}
              
              <div className="mt-3 pt-3 border-t border-gray-100 text-[10px] text-gray-400 text-center">
                 Saved to 'VoltTrack_Data.json' in Drive
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};