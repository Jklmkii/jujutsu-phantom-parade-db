import React, { useEffect, useRef, useState } from 'react';
import { X, Volume2, VolumeX, Download, Upload, Trash2, CheckCircle2, AlertCircle, ShieldCheck, Database, RefreshCw, Sparkles, ArrowRight, ExternalLink } from 'lucide-react';
import { useJjkStore } from '../store/useJjkStore';
import { playClick, playTransformSurge } from '../utils/sound';
import type { UpdaterStatus } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    soundEnabled,
    toggleSound,
    favoriteCharIds,
    favoriteMemoryIds,
    teams,
    tierList,
    exportBackupJSON,
    importBackupJSON,
    resetAllUserData,
  } = useJjkStore();

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updaterStatus, setUpdaterStatus] = useState<UpdaterStatus | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = React.useCallback((type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  }, []);

  useEffect(() => {
    if (!window.electronAPI?.onUpdateStatus) return;

    const cleanup = window.electronAPI.onUpdateStatus((status) => {
      setUpdaterStatus(status);
      if (status.status === 'downloaded') {
        setCheckingUpdate(false);
        showNotification('success', `Nova versão ${status.version ? `v${status.version} ` : ''}pronta para ser aplicada!`);
      } else if (status.status === 'not-available') {
        setCheckingUpdate(false);
        showNotification('success', 'Você já está utilizando a versão mais recente.');
      } else if (status.status === 'error') {
        setCheckingUpdate(false);
        showNotification('error', status.message || 'Erro ao verificar atualizações.');
      }
    });

    return () => {
      cleanup?.();
    };
  }, [showNotification]);

  if (!isOpen) return null;

  const handleCheckUpdate = async () => {
    playClick();
    if (!window.electronAPI?.checkForUpdates) {
      showNotification('error', 'Verificação de atualizações disponível no aplicativo Desktop.');
      return;
    }
    setCheckingUpdate(true);
    try {
      const res = await window.electronAPI.checkForUpdates();
      if (res.success) {
        showNotification('success', res.message || 'Verificando atualizações no GitHub Releases...');
      } else {
        const errorText = res.error ? res.error.split('\n')[0].slice(0, 100) : 'Falha ao buscar atualizações.';
        showNotification('error', errorText);
      }
    } catch {
      showNotification('error', 'Erro ao conectar ao serviço de atualização.');
    } finally {
      setCheckingUpdate(false);
    }
  };

  // Export JSON (Native Electron or Web Download)
  const handleExport = async () => {
    playClick();
    const jsonStr = exportBackupJSON();
    const defaultName = `jjkppdb-backup-${new Date().toISOString().split('T')[0]}.json`;

    if (window.electronAPI?.saveFile) {
      const res = await window.electronAPI.saveFile(defaultName, jsonStr, [
        { name: 'Arquivos JSON', extensions: ['json'] },
      ]);
      if (res.success) {
        showNotification('success', 'Backup salvo com sucesso no seu computador!');
      } else if (res.error) {
        showNotification('error', `Falha ao salvar: ${res.error}`);
      }
      return;
    }

    // Web Fallback
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('success', 'Download do arquivo de backup iniciado!');
  };

  // Import JSON (Native Electron or File Input)
  const handleImport = async () => {
    playClick();
    if (window.electronAPI?.openFile) {
      const res = await window.electronAPI.openFile([
        { name: 'Arquivos JSON', extensions: ['json'] },
      ]);
      if (res.success && res.content) {
        const result = importBackupJSON(res.content);
        if (result.success) {
          playTransformSurge();
          showNotification('success', result.message);
        } else {
          showNotification('error', result.message);
        }
      }
      return;
    }

    // Web Fallback
    fileInputRef.current?.click();
  };

  const handleWebFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = importBackupJSON(content);
        if (result.success) {
          playTransformSurge();
          showNotification('success', result.message);
        } else {
          showNotification('error', result.message);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = () => {
    playClick();
    resetAllUserData();
    setConfirmReset(false);
    showNotification('success', 'Todos os dados locais foram restaurados.');
  };

  const tierCount = Object.keys(tierList).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#110d22] border border-[#2f2256] rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
        
        {/* Hidden File Input for Browser Fallback */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleWebFileChange}
          accept=".json"
          className="hidden"
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#251b44] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-900/40 rounded-xl border border-purple-500/30 text-purple-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-wide">CONFIGURAÇÕES & BACKUP</h2>
              <p className="text-xs text-gray-400">Gerencie armazenamento local e preferências offline</p>
            </div>
          </div>
          <button
            onClick={() => {
              playClick();
              onClose();
            }}
            className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-[#1f1738] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div
            className={`flex items-center gap-3 p-3.5 rounded-xl border text-xs font-semibold animate-slideDown ${
              notification.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-red-950/60 border-red-500/40 text-red-300'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            )}
            <span>{notification.text}</span>
          </div>
        )}

        {/* Section 1: Sound Effects */}
        <div className="space-y-3">
          <label className="text-xs uppercase font-bold text-gray-400 block tracking-wider">
            Áudio & Resposta Tátil
          </label>
          <div className="flex items-center justify-between p-4 bg-[#16102c] border border-[#271d47] rounded-2xl">
            <div className="flex items-center gap-3">
              {soundEnabled ? (
                <Volume2 className="w-5 h-5 text-purple-400" />
              ) : (
                <VolumeX className="w-5 h-5 text-gray-500" />
              )}
              <div>
                <p className="text-sm font-bold text-white">Efeitos Sonoros (SFX)</p>
                <p className="text-xs text-gray-400">Sons táteis sintetizados para ações e transformações</p>
              </div>
            </div>
            <button
              onClick={() => {
                toggleSound();
                if (!soundEnabled) {
                  setTimeout(() => playClick(), 50);
                }
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                soundEnabled
                  ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-900/50'
                  : 'bg-[#22183d] border-[#382663] text-gray-400 hover:text-white'
              }`}
            >
              {soundEnabled ? 'Ativado' : 'Desativado'}
            </button>
          </div>
        </div>

        {/* Section 2: Local Storage Data Overview */}
        <div className="space-y-3">
          <label className="text-xs uppercase font-bold text-gray-400 block tracking-wider">
            Estatísticas do Cofre Local
          </label>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-[#16102c] border border-[#271d47] rounded-xl text-center">
              <span className="text-xl font-black text-amber-400 block">
                {favoriteCharIds.length + favoriteMemoryIds.length}
              </span>
              <span className="text-[11px] font-semibold text-gray-400">Favoritos</span>
            </div>
            <div className="p-3 bg-[#16102c] border border-[#271d47] rounded-xl text-center">
              <span className="text-xl font-black text-purple-400 block">
                {teams.length}
              </span>
              <span className="text-[11px] font-semibold text-gray-400">Equipes</span>
            </div>
            <div className="p-3 bg-[#16102c] border border-[#271d47] rounded-xl text-center">
              <span className="text-xl font-black text-cyan-400 block">
                {tierCount}
              </span>
              <span className="text-[11px] font-semibold text-gray-400">Ranqueados</span>
            </div>
          </div>
        </div>

        {/* Section 3: Backup & Restore Actions */}
        <div className="space-y-3">
          <label className="text-xs uppercase font-bold text-gray-400 block tracking-wider">
            Backup & Restauração
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 p-3 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/40 rounded-xl text-xs font-bold text-purple-200 transition-all shadow-md"
            >
              <Download className="w-4 h-4 text-purple-400" />
              <span>Exportar Backup (.json)</span>
            </button>

            <button
              onClick={handleImport}
              className="flex items-center justify-center gap-2 p-3 bg-indigo-900/30 hover:bg-indigo-900/50 border border-indigo-500/40 rounded-xl text-xs font-bold text-indigo-200 transition-all shadow-md"
            >
              <Upload className="w-4 h-4 text-indigo-400" />
              <span>Importar Backup (.json)</span>
            </button>
          </div>
        </div>

        {/* Section: App Updates */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs uppercase font-bold text-gray-400 block tracking-wider">
              Atualizações do Aplicativo
            </label>
            <span className="text-[11px] font-mono text-purple-300/80 bg-purple-950/50 px-2 py-0.5 rounded-md border border-purple-500/20">
              Versão Instalada: v1.0.6
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#16102c] border border-[#271d47] rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-950/60 rounded-xl border border-purple-500/30 text-purple-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">JJKPPDB Offline</p>
                <p className="text-xs text-gray-400">Verificação automática via GitHub Releases</p>
              </div>
            </div>
            <button
              onClick={handleCheckUpdate}
              disabled={checkingUpdate || updaterStatus?.status === 'downloading'}
              className="flex items-center gap-2 px-3.5 py-2 bg-purple-600/80 hover:bg-purple-600 disabled:opacity-50 border border-purple-400/50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-900/30 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checkingUpdate || updaterStatus?.status === 'checking' ? 'animate-spin' : ''}`} />
              <span>{checkingUpdate || updaterStatus?.status === 'checking' ? 'Verificando...' : 'Verificar Atualizações'}</span>
            </button>
          </div>

          {/* Dynamic Updater Feedback */}
          {updaterStatus && (
            <div className="space-y-2 animate-fadeIn">
              {updaterStatus.status === 'downloading' && (
                <div className="p-4 bg-gradient-to-r from-purple-950/80 to-indigo-950/80 border border-purple-500/50 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-purple-300 font-semibold">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                      Baixando atualização do JJKPPDB ({updaterStatus.version ? `v${updaterStatus.version}` : 'nova versão'})...
                    </span>
                    <span className="font-mono font-bold text-white">{updaterStatus.percent ?? 0}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-black/50 rounded-full overflow-hidden border border-purple-500/30">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 via-indigo-400 to-emerald-400 transition-all duration-300"
                      style={{ width: `${Math.max(0, Math.min(100, updaterStatus.percent ?? 0))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-400 font-mono">
                    <span>
                      {updaterStatus.transferred && updaterStatus.total
                        ? `${(updaterStatus.transferred / (1024 * 1024)).toFixed(1)} MB / ${(updaterStatus.total / (1024 * 1024)).toFixed(1)} MB`
                        : `${updaterStatus.percent ?? 0}% transferido`}
                    </span>
                    {updaterStatus.bytesPerSecond ? (
                      <span className="text-purple-300">{(updaterStatus.bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s</span>
                    ) : null}
                  </div>
                </div>
              )}

              {updaterStatus.status === 'downloaded' && (
                <div className="p-4 bg-gradient-to-r from-emerald-950/90 to-teal-950/90 border border-emerald-500/60 rounded-2xl flex items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 text-yellow-300 fill-yellow-300 animate-pulse shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-white">
                        Nova versão {updaterStatus.version ? `v${updaterStatus.version}` : ''} pronta para ser aplicada!
                      </p>
                      <p className="text-[11px] text-emerald-300">
                        Clique abaixo para reiniciar o aplicativo e concluir a atualização.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      window.electronAPI?.installUpdate?.();
                    }}
                    className="px-3.5 py-2 bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 rounded-xl font-black text-xs hover:brightness-110 flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
                  >
                    <span>Reiniciar e Aplicar</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              )}

              {updaterStatus.status === 'not-available' && (
                <div className="flex items-center gap-2 p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Você já está utilizando a versão mais recente disponível no GitHub Releases.</span>
                </div>
              )}

              {updaterStatus.status === 'available' && (
                <div className="flex items-center gap-2 p-3 bg-purple-950/50 border border-purple-500/40 rounded-xl text-xs text-purple-300">
                  <RefreshCw className="w-4 h-4 text-purple-400 animate-spin shrink-0" />
                  <span>Nova versão {updaterStatus.version ? `v${updaterStatus.version}` : ''} encontrada! Iniciando download...</span>
                </div>
              )}

              {updaterStatus.status === 'error' && (
                <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-red-300">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{updaterStatus.message || 'Não foi possível verificar atualizações no momento.'}</span>
                  </div>
                  <a
                    href="https://github.com/Jklmkii/jujutsu-phantom-parade-db/releases/latest"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-purple-300 hover:text-white underline font-semibold"
                  >
                    Abrir página de downloads do GitHub Releases <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section: Reset Safety */}
        <div className="pt-2 border-t border-[#251b44]">
          {confirmReset ? (
            <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-2xl space-y-3">
              <p className="text-xs font-bold text-red-300">
                Tem certeza? Isso apagará todos os seus favoritos, equipes e tier lists salvas neste dispositivo.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg"
                >
                  Sim, apagar tudo
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="px-4 py-2 bg-[#22183d] text-gray-300 rounded-xl text-xs font-bold hover:text-white"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                playClick();
                setConfirmReset(true);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-red-400/80 hover:text-red-400 hover:bg-red-950/20 rounded-xl transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar todos os dados salvos</span>
            </button>
          )}
        </div>

        {/* Offline Badge Footer */}
        <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-gray-500 pt-2 border-t border-[#201736]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>100% Offline • Sem telemetria • Armazenamento Local Seguro</span>
        </div>

      </div>
    </div>
  );
};
