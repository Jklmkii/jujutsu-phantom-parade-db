import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  Home, 
  ChevronDown, 
  Shield, 
  Coins, 
  PenTool, 
  Radio, 
  Volume2, 
  VolumeX, 
  Settings, 
  Users, 
  Scale, 
  Award, 
  ShieldCheck, 
  Zap, 
  Calendar, 
  Dices, 
  Package, 
  Clock, 
  Calculator, 
  Skull, 
  Gamepad2,
  Sparkles
} from 'lucide-react';
import type { ActiveTab, Character } from '../types';
import { useJjkStore } from '../store/useJjkStore';
import { useTranslation } from '../i18n';
import { playTabSwitch, playClick, playSelect } from '../utils/sound';
import { getAssetPath } from '../utils/assets';

interface TopHeaderBarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedCharacter: Character | null;
  onBackToHub: () => void;
}

export const TopHeaderBar: React.FC<TopHeaderBarProps> = ({
  activeTab,
  setActiveTab,
  selectedCharacter,
  onBackToHub
}) => {
  const { t, language, setLanguage } = useTranslation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { 
    isScratchpadOpen, 
    toggleScratchpad, 
    toggleSettings, 
    soundEnabled, 
    toggleSound,
    toggleSoundboard,
    savingsPlan
  } = useJjkStore();

  const currentCubes = savingsPlan.currentCubes || 0;

  // Fecha o dropdown ao clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navCategories: {
    category: string;
    items: { id: ActiveTab; label: string; icon: React.ReactNode; color: string }[];
  }[] = [
    {
      category: language === 'pt' ? 'Combate & Batalha' : 'Combat & Battle',
      items: [
        { id: 'raids', label: t.nav.raids, icon: <Skull className="w-4 h-4" />, color: 'text-rose-400' },
        { id: 'dps', label: t.nav.dps, icon: <Calculator className="w-4 h-4" />, color: 'text-cyan-400' },
        { id: 'teams', label: t.nav.teams, icon: <ShieldCheck className="w-4 h-4" />, color: 'text-indigo-400' },
        { id: 'compare', label: t.nav.compare, icon: <Scale className="w-4 h-4" />, color: 'text-sky-400' },
        { id: 'buffs', label: t.nav.buffs, icon: <Zap className="w-4 h-4" />, color: 'text-amber-400' },
      ]
    },
    {
      category: language === 'pt' ? 'Catálogo & Base de Dados' : 'Catalog & Database',
      items: [
        { id: 'characters', label: t.nav.characters, icon: <Users className="w-4 h-4" />, color: 'text-cyan-400' },
        { id: 'memories', label: t.nav.memories, icon: <Sparkles className="w-4 h-4" />, color: 'text-amber-400' },
        { id: 'timeline', label: t.nav.timeline, icon: <Calendar className="w-4 h-4" />, color: 'text-blue-400' },
        { id: 'tierlist', label: t.nav.tierlist, icon: <Award className="w-4 h-4" />, color: 'text-yellow-400' },
      ]
    },
    {
      category: language === 'pt' ? 'Estratégia & Ferramentas' : 'Strategy & Tools',
      items: [
        { id: 'jujutsudle', label: t.nav.jujutsudle, icon: <Gamepad2 className="w-4 h-4" />, color: 'text-purple-400' },
        { id: 'gacha', label: t.nav.gacha, icon: <Dices className="w-4 h-4" />, color: 'text-amber-400' },
        { id: 'planner', label: t.nav.planner, icon: <Package className="w-4 h-4" />, color: 'text-emerald-400' },
        { id: 'stamina', label: t.nav.stamina, icon: <Clock className="w-4 h-4" />, color: 'text-purple-400' },
      ]
    }
  ];

  // Nome do módulo ativo para exibição no breadcrumb
  const getActiveModuleLabel = (): string => {
    if (selectedCharacter) {
      return `${selectedCharacter.name.toUpperCase()} (${selectedCharacter.epithet || 'SSR'})`;
    }
    for (const cat of navCategories) {
      const found = cat.items.find(i => i.id === activeTab);
      if (found) return found.label;
    }
    return t.nav.home;
  };

  const handleQuickNav = (tab: ActiveTab) => {
    playTabSwitch();
    setDropdownOpen(false);
    setActiveTab(tab);
  };

  const isHome = activeTab === 'home' && !selectedCharacter;

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-[#06070c]/90 backdrop-blur-xl border-b border-[#1c263d] px-3 sm:px-6 flex items-center justify-between transition-colors shadow-lg">
      
      {/* 1. Lado Esquerdo: Identidade / Botão de Voltar ao Hub */}
      <div className="flex items-center gap-3 sm:gap-4">
        {isHome ? (
          /* Estado na Home: Logo Oficial com Pulso Ciano */
          <div className="flex items-center gap-3 select-none">
            <div className="relative w-10 h-10 flex items-center justify-center group">
              <div className="absolute inset-0 bg-cyan-500/25 rounded-xl blur-md group-hover:bg-cyan-400/40 transition-all" />
              <img 
                src={getAssetPath('assets/logo.png')} 
                alt="JJKPPDB Logo" 
                className="w-9 h-9 object-contain relative z-10 drop-shadow-[0_0_12px_rgba(6,182,212,0.8)] transform group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-black text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-indigo-300 font-mono">
                JJKPPDB
              </span>
              <span className="text-[10px] font-bold tracking-widest text-cyan-400 uppercase font-mono">
                {language === 'pt' ? 'CENTRO DE COMANDO OFFLINE' : 'OFFLINE COMMAND HUB'}
              </span>
            </div>
          </div>
        ) : (
          /* Estado em Qualquer Outra Página: Botão Chamativo de Voltar ao Hub */
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                playSelect();
                onBackToHub();
              }}
              data-testid="nav-home"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-mono font-black tracking-wider uppercase bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 hover:from-cyan-500 hover:to-indigo-500 border border-cyan-400/60 hover:border-cyan-300 text-cyan-200 hover:text-black shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:shadow-[0_0_25px_rgba(6,182,212,0.8)] transition-all duration-200 cursor-pointer active:scale-95"
              title={language === 'pt' ? 'Voltar ao Hub Principal' : 'Return to Command Hub'}
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span>{language === 'pt' ? 'VOLTAR AO HUB' : 'RETURN TO HUB'}</span>
            </button>

            {/* Breadcrumb Tático */}
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-gray-400 pl-2 border-l border-gray-700/50">
              <span className="text-gray-500">HUB //</span>
              <span className="text-cyan-300 font-bold tracking-wide uppercase">
                {getActiveModuleLabel()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Centro: Dropdown Tático de Navegação Rápida entre Módulos */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => {
            playClick();
            setDropdownOpen(!dropdownOpen);
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
            dropdownOpen
              ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
              : 'bg-[#0b101c] border-[#1e2a47] text-gray-300 hover:border-cyan-500/50 hover:text-cyan-300'
          }`}
          title={language === 'pt' ? 'Ver todos os módulos' : 'View all modules'}
        >
          <Home className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">
            {language === 'pt' ? 'MÓDULOS' : 'MODULES'}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-cyan-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu Categorizado */}
        {dropdownOpen && (
          <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-72 sm:w-80 rounded-2xl bg-[#070b14]/95 backdrop-blur-2xl border border-cyan-500/40 shadow-[0_15px_40px_rgba(0,0,0,0.85)] p-3 space-y-3 z-50 animate-fadeIn">
            {navCategories.map((group, idx) => (
              <div key={idx} className="space-y-1">
                <div className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-cyan-400/80 px-2 py-0.5">
                  {group.category}
                </div>
                <div className="grid grid-cols-1 gap-0.5">
                  {group.items.map((item) => {
                    const isItemActive = activeTab === item.id && !selectedCharacter;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleQuickNav(item.id)}
                        data-testid={`nav-${item.id}`}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                          isItemActive
                            ? 'bg-cyan-500/20 text-cyan-200 border-l-2 border-cyan-400 font-bold'
                            : 'text-gray-300 hover:bg-[#111827] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={item.color}>{item.icon}</span>
                          <span>{item.label}</span>
                        </div>
                        {isItemActive && (
                          <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-cyan-400/20 text-cyan-300">
                            ATIVO
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Lado Direito: Telemetria, Cubos & Ações Rápidas */}
      <div className="flex items-center gap-2 sm:gap-3">
        
        {/* Status 100% Offline */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0a1120] border border-cyan-800/40 text-[10px] font-mono text-cyan-300">
          <Shield className="w-3 h-3 text-cyan-400" />
          <span className="font-semibold uppercase tracking-wider">100% OFFLINE</span>
        </div>

        {/* Contador de Cubos (clicável para ir para Gacha) */}
        <button
          onClick={() => handleQuickNav('gacha')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#120e24] border border-purple-800/40 hover:border-amber-400/60 text-[11px] font-mono text-amber-300 transition-colors cursor-pointer"
          title={language === 'pt' ? 'Abrir Simulador & Matriz Gacha' : 'Open Gacha Matrix'}
        >
          <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-bold">{currentCubes.toLocaleString()}</span>
        </button>

        {/* Lousa Tática (Scratchpad) */}
        <button
          onClick={() => {
            playClick();
            toggleScratchpad();
          }}
          className={`p-2 rounded-xl transition-all border cursor-pointer ${
            isScratchpadOpen
              ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
              : 'border-transparent text-gray-400 hover:bg-[#121726] hover:text-cyan-300'
          }`}
          title={t.nav.scratchpad}
        >
          <PenTool className="w-4 h-4" />
        </button>

        {/* Soundboard Modal */}
        <button
          onClick={() => {
            playClick();
            toggleSoundboard();
          }}
          className="p-2 rounded-xl border border-transparent text-gray-400 hover:bg-[#121726] hover:text-purple-300 transition-all cursor-pointer"
          title="Soundboard"
        >
          <Radio className="w-4 h-4" />
        </button>

        {/* Alternador de Áudio ON/OFF */}
        <button
          onClick={() => {
            playClick();
            toggleSound();
          }}
          className={`p-2 rounded-xl transition-all border cursor-pointer ${
            soundEnabled
              ? 'border-transparent text-cyan-400 hover:bg-[#121726]'
              : 'border-transparent text-gray-500 hover:bg-[#121726] hover:text-gray-300'
          }`}
          title={soundEnabled ? t.nav.soundDisable : t.nav.soundEnable}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Alternador de Idioma (PT / EN) */}
        <button
          onClick={() => {
            playClick();
            setLanguage(language === 'pt' ? 'en' : 'pt');
          }}
          className="px-2 py-1 rounded-lg text-xs font-mono font-black text-gray-300 hover:text-white bg-[#0b101c] hover:bg-[#141b2e] border border-gray-700/50 hover:border-cyan-500/50 transition-all cursor-pointer"
          title={language === 'pt' ? 'Mudar para Inglês' : 'Switch to Portuguese'}
        >
          {language === 'pt' ? 'PT' : 'EN'}
        </button>

        {/* Modal de Configurações */}
        <button
          onClick={() => {
            playClick();
            toggleSettings();
          }}
          className="p-2 rounded-xl border border-transparent text-gray-400 hover:bg-[#121726] hover:text-cyan-300 transition-all cursor-pointer"
          title={t.nav.settings}
        >
          <Settings className="w-4 h-4" />
        </button>

      </div>

    </header>
  );
};
