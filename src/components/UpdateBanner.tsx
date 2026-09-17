import React, { useEffect, useState } from 'react';
import { Sparkles, RefreshCw, ArrowRight, X } from 'lucide-react';
import type { UpdaterStatus } from '../types';

export const UpdateBanner: React.FC = () => {
  const [updaterState, setUpdaterState] = useState<UpdaterStatus | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!window.electronAPI?.onUpdateStatus) return;

    const cleanup = window.electronAPI.onUpdateStatus((status) => {
      setUpdaterState(status);
      if (status.status === 'downloaded' || status.status === 'available') {
        setIsDismissed(false);
      }
    });

    return () => {
      cleanup?.();
    };
  }, []);

  if (!updaterState || isDismissed) return null;

  const handleInstall = () => {
    window.electronAPI?.installUpdate?.();
  };

  if (updaterState.status === 'downloading') {
    return (
      <div className="sticky top-2 z-40 mb-4 rounded-xl overflow-hidden bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 border border-purple-500/40 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-lg animate-in fade-in">
        <div className="flex items-center gap-2.5">
          <RefreshCw size={14} className="animate-spin text-purple-400" />
          <span>Baixando atualização do JJKPPDB Offline: {updaterState.percent ?? 0}%...</span>
          <div className="hidden sm:block w-32 h-2 bg-purple-950/80 rounded-full overflow-hidden border border-purple-500/30">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 transition-all duration-300"
              style={{ width: `${Math.max(0, Math.min(100, updaterState.percent ?? 0))}%` }}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="text-purple-300 hover:text-white transition-colors p-1"
          title="Fechar"
          aria-label="Fechar banner de atualização"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  if (updaterState.status === 'downloaded') {
    return (
      <div className="sticky top-2 z-40 mb-4 rounded-xl overflow-hidden bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 border border-emerald-500/50 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between shadow-xl animate-in slide-in-from-top">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-yellow-300 fill-yellow-300 animate-pulse" />
          <span>Nova versão {updaterState.version ? `v${updaterState.version}` : ''} pronta para ser aplicada!</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleInstall}
            className="px-3 py-1 bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 rounded-lg font-black text-xs hover:brightness-110 flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
          >
            Reiniciar e Atualizar <ArrowRight size={12} />
          </button>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="text-emerald-200/80 hover:text-white ml-2 transition-colors p-1"
            title="Fechar"
            aria-label="Fechar banner de atualização"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return null;
};
