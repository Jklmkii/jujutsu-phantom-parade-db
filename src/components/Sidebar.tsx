import React from 'react';
import { 
  Home, 
  Users, 
  Sparkles, 
  Calendar, 
  ShieldCheck,
  Zap,
  Menu,
  Award,
  PenTool,
  Settings,
  Scale,
  Dices,
  Calculator,
  Skull,
  Radio,
  Volume2,
  VolumeX
} from 'lucide-react';
import type { ActiveTab } from '../types';
import { useJjkStore } from '../store/useJjkStore';
import { useTranslation } from '../i18n';
import { playTabSwitch, playClick } from '../utils/sound';
import { getAssetPath } from '../utils/assets';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedCharId: string | null;
  onClearSelection: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab,
  onClearSelection
}) => {
  const [collapsed, setCollapsed] = React.useState(false);
  const { t } = useTranslation();
  const { 
    isScratchpadOpen, 
    toggleScratchpad, 
    toggleSettings, 
    soundEnabled, 
    toggleSound,
    toggleSoundboard 
  } = useJjkStore();

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: t.nav.home, icon: <Home className="w-5 h-5" /> },
    { id: 'characters', label: t.nav.characters, icon: <Users className="w-5 h-5" /> },
    { id: 'compare', label: t.nav.compare, icon: <Scale className="w-5 h-5" /> },
    { id: 'memories', label: t.nav.memories, icon: <Sparkles className="w-5 h-5" /> },
    { id: 'tierlist', label: t.nav.tierlist, icon: <Award className="w-5 h-5" /> },
    { id: 'teams', label: t.nav.teams, icon: <ShieldCheck className="w-5 h-5" /> },
    { id: 'buffs', label: t.nav.buffs, icon: <Zap className="w-5 h-5" /> },
    { id: 'timeline', label: t.nav.timeline, icon: <Calendar className="w-5 h-5" /> },
    { id: 'gacha', label: t.nav.gacha, icon: <Dices className="w-5 h-5" /> },
    { id: 'dps', label: t.nav.dps, icon: <Calculator className="w-5 h-5" /> },
    { id: 'raids', label: t.nav.raids, icon: <Skull className="w-5 h-5 text-red-400" /> },
  ];

  const handleNav = (tab: ActiveTab) => {
    playTabSwitch();
    setActiveTab(tab);
    onClearSelection();
  };

  return (
    <aside 
      className={`fixed top-0 left-0 h-screen z-40 bg-[#0c0916] border-r border-[#201833] flex flex-col transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#201833]">
        <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => handleNav('home')}>
          {/* App Logo */}
          <div className="w-10 h-10 min-w-[40px] flex items-center justify-center relative group">
            <div className="absolute inset-0 bg-purple-600/30 rounded-full blur-md group-hover:bg-purple-500/50 transition-all"></div>
            <img 
              src={getAssetPath('assets/logo.png')} 
              alt="JJKPPDB Logo" 
              className="w-10 h-10 object-contain relative z-10 drop-shadow-[0_0_10px_rgba(168,85,247,0.7)] transform group-hover:scale-110 transition-transform duration-300"
            />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="font-black text-lg tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-purple-100 to-indigo-300">
                JJKPPDB
              </span>
              <span className="text-[10px] font-bold tracking-widest text-purple-400/80 uppercase">
                {t.nav.offlineDatabase}
              </span>
            </div>
          )}
        </div>
        <button 
          onClick={() => {
            playClick();
            setCollapsed(!collapsed);
          }}
          className="text-gray-400 hover:text-purple-300 p-1 rounded transition-colors"
          title={t.nav.toggleSidebar}
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              data-testid={`nav-${item.id}`}
              aria-label={item.label}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-purple-900/60 to-purple-800/30 text-purple-200 border-l-4 border-purple-500 shadow-md shadow-purple-950/40'
                  : 'text-gray-400 hover:bg-[#181228] hover:text-gray-200'
              }`}
              title={item.label}
            >
              <div className={`${isActive ? 'text-purple-400' : 'text-gray-400'}`}>
                {item.icon}
              </div>
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Quick Action Tools: Whiteboard, Audio, Settings */}
      <div className="p-2 border-t border-[#201833] space-y-1">
        {/* Tactical Whiteboard / Scratchpad button */}
        <button
          onClick={() => {
            playClick();
            toggleScratchpad();
          }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${
            isScratchpadOpen
              ? 'bg-purple-900/40 border-purple-500 text-purple-200 shadow-md shadow-purple-900/30'
              : 'border-transparent text-gray-400 hover:bg-[#181228] hover:text-gray-200'
          }`}
          title={t.nav.scratchpad}
        >
          <PenTool className="w-4 h-4 text-purple-400 shrink-0" />
          {!collapsed && (
            <span className="flex items-center justify-between w-full">
              <span>{t.nav.scratchpad}</span>
              {isScratchpadOpen && <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />}
            </span>
          )}
        </button>

        {/* Audio SFX quick toggle */}
        <button
          onClick={() => {
            toggleSound();
            if (!soundEnabled) {
              setTimeout(() => playClick(), 40);
            }
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:bg-[#181228] hover:text-gray-200 transition-all"
          title={soundEnabled ? t.nav.soundDisable : t.nav.soundEnable}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-purple-400 shrink-0" />
          ) : (
            <VolumeX className="w-4 h-4 text-gray-500 shrink-0" />
          )}
          {!collapsed && <span>{t.nav.soundActive}</span>}
        </button>

        {/* Tactical Soundboard Modal button */}
        <button
          onClick={() => {
            playClick();
            toggleSoundboard();
          }}
          data-testid="nav-soundboard"
          aria-label="Soundboard"
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:bg-[#181228] hover:text-purple-300 transition-all cursor-pointer"
          title="Soundboard Tático Procedural"
        >
          <Radio className="w-4 h-4 text-purple-400 shrink-0" />
          {!collapsed && <span>Soundboard</span>}
        </button>

        {/* Settings & Backup Modal button */}
        <button
          onClick={() => {
            playClick();
            toggleSettings();
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:bg-[#181228] hover:text-gray-200 transition-all"
          title={t.nav.settings}
        >
          <Settings className="w-4 h-4 text-purple-400 shrink-0" />
          {!collapsed && <span>{t.nav.settings}</span>}
        </button>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-[#201833]">
        {!collapsed ? (
          <div className="bg-[#140f24] p-2.5 rounded-xl border border-purple-900/30">
            <div className="flex items-center gap-2 text-[11px] font-bold text-purple-400 mb-0.5">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span>{t.nav.offlineDatabase}</span>
            </div>
            <p className="text-[10px] text-gray-400 leading-tight">
              {t.nav.statsFooter}
            </p>
          </div>
        ) : (
          <div className="flex justify-center" title="100% Offline">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
          </div>
        )}
      </div>
    </aside>
  );
};
