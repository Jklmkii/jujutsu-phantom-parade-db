import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  Zap, 
  Swords, 
  Coins, 
  Clock, 
  ScrollText, 
  ArrowRight,
  Sparkles,
  Shield,
  Activity
} from 'lucide-react';
import { playSelect, playTabSwitch } from '../utils/sound';
import { useJjkStore } from '../store/useJjkStore';
import { loadJujutsudleStats } from '../utils/jujutsudle';
import { useTranslation } from '../i18n';
import type { ActiveTab } from '../types';

interface TacticalHoloDeckProps {
  onNavigate: (tab: ActiveTab, search?: string) => void;
}

export const TacticalHoloDeck: React.FC<TacticalHoloDeckProps> = ({ onNavigate }) => {
  const { language } = useTranslation();
  const currentCubes = useJjkStore((state) => state.savingsPlan.currentCubes);
  const [activeIndex, setActiveIndex] = useState(0);

  // Carrega estatísticas do Jujutsudle
  const jujutsudleStats = useMemo(() => {
    try {
      return loadJujutsudleStats();
    } catch {
      return { currentStreak: 0, gamesWon: 0 };
    }
  }, []);

  // Cronômetro digital de contagem regressiva até o reset diário (00:00 local)
  const [timeUntilReset, setTimeUntilReset] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const nextReset = new Date(now);
      nextReset.setHours(24, 0, 0, 0); // Próxima meia-noite
      const diffMs = Math.max(0, nextReset.getTime() - now.getTime());

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      const millis = Math.floor((diffMs % 1000));

      const hStr = String(hours).padStart(2, '0');
      const mStr = String(minutes).padStart(2, '0');
      const sStr = String(seconds).padStart(2, '0');
      const msStr = String(millis).padStart(3, '0');

      setTimeUntilReset(`${hStr}:${mStr}:${sStr}.${msStr}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 67); // Atualização fluida (~15fps)
    return () => clearInterval(interval);
  }, []);

  // Definição dos 6 Cards Holográficos do Ecossistema JJKPPDB
  const cards = useMemo(() => [
    {
      id: 'jujutsudle',
      tab: 'jujutsudle' as ActiveTab,
      theme: 'cyan',
      frameClass: 'neon-frame-cyan',
      topBadge: language === 'pt' ? 'DESAFIO DIÁRIO' : 'DAILY TRIAL',
      statBadge: `${language === 'pt' ? 'STREAK' : 'STREAK'} 🔥 ${jujutsudleStats.currentStreak || 0}`,
      title: 'JUJUTSUDLE',
      subtitle: language === 'pt' ? 'ARENA DE ADIVINHAÇÃO TÁTICA' : 'TACTICAL GUESSING ARENA',
      tagline: language === 'pt' ? 'Adivinhe o feiticeiro secreto com dicas comparativas' : 'Identify the secret sorcerer using comparative clues',
      metricPrimary: '109',
      metricLabel: language === 'pt' ? 'Feiticeiros Catalogados' : 'Cataloged Sorcerers',
      actionText: language === 'pt' ? 'ENTRAR NO DOMÍNIO' : 'ENTER DOMAIN',
      renderArt: () => (
        <div className="relative w-40 h-40 flex items-center justify-center">
          {/* Cursed Flame Aura SVG */}
          <svg className="absolute inset-0 w-full h-full text-cyan-400 flame-aura-anim opacity-80" viewBox="0 0 100 100" fill="none">
            <path 
              d="M50 5 C62 25, 82 40, 80 65 C78 85, 60 95, 50 95 C40 95, 22 85, 20 65 C18 40, 38 25, 50 5 Z" 
              fill="url(#cyanFlameGrad)" 
              opacity="0.35" 
            />
            <path 
              d="M50 20 C58 35, 72 46, 70 65 C68 80, 56 87, 50 87 C44 87, 32 80, 30 65 C28 46, 42 35, 50 20 Z" 
              fill="url(#cyanFlameInner)" 
              opacity="0.5" 
            />
            <defs>
              <radialGradient id="cyanFlameGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                <stop offset="70%" stopColor="#0891b2" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#0891b2" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="cyanFlameInner" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#67e8f9" />
                <stop offset="100%" stopColor="#0e7490" stopOpacity="0.2" />
              </linearGradient>
            </defs>
          </svg>
          {/* Neon Hologram Skull Icon */}
          <div className="relative z-10 text-cyan-300 drop-shadow-[0_0_20px_rgba(6,182,212,0.9)] flex flex-col items-center justify-center">
            <svg className="w-24 h-24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="12" r="1.5" fill="currentColor" />
              <circle cx="15" cy="12" r="1.5" fill="currentColor" />
              <path d="M8 20v2h8v-2" />
              <path d="m12.5 17-.5-1-.5 1h1z" fill="currentColor" />
              <path d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20" />
            </svg>
            <span className="text-[10px] font-mono tracking-widest text-cyan-200 uppercase font-black mt-1">
              CURSED ENTITY
            </span>
          </div>
        </div>
      )
    },
    {
      id: 'raids',
      tab: 'raids' as ActiveTab,
      theme: 'crimson',
      frameClass: 'neon-frame-crimson',
      topBadge: language === 'pt' ? 'EXPEDIÇÃO DE CHEFE' : 'BOSS EXPEDITION',
      statBadge: 'DAGON & HANAMI',
      title: language === 'pt' ? 'BATALHA DE CHEFES' : 'RAID BOSS BATTLE',
      subtitle: language === 'pt' ? 'EXPEDIÇÕES TÁTICAS & EX-RAID' : 'TACTICAL EXPEDITIONS & EX-RAID',
      tagline: language === 'pt' ? 'Guias de fraqueza elemental e quebra de postura' : 'Elemental weaknesses and posture break strategies',
      metricPrimary: 'EX-03',
      metricLabel: language === 'pt' ? 'Grau Especial Ativo' : 'Active Special Grade',
      actionText: language === 'pt' ? 'DESAFIAR CHEFE' : 'CHALLENGE BOSS',
      renderArt: () => (
        <div className="relative w-40 h-40 flex items-center justify-center">
          {/* Crimson Flame Aura SVG */}
          <svg className="absolute inset-0 w-full h-full text-rose-500 flame-aura-anim opacity-80" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="38" stroke="url(#crimsonRing)" strokeWidth="1.5" strokeDasharray="4 3" />
            <path 
              d="M50 8 C65 25, 80 42, 78 68 C76 86, 62 94, 50 94 C38 94, 24 86, 22 68 C20 42, 35 25, 50 8 Z" 
              fill="url(#crimsonFlameGrad)" 
              opacity="0.35" 
            />
            <defs>
              <radialGradient id="crimsonFlameGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
                <stop offset="70%" stopColor="#be123c" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#be123c" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="crimsonRing" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fb7185" />
                <stop offset="100%" stopColor="#e11d48" />
              </linearGradient>
            </defs>
          </svg>
          {/* Neon Crossed Swords */}
          <div className="relative z-10 text-rose-400 drop-shadow-[0_0_22px_rgba(244,63,94,0.9)] flex flex-col items-center justify-center">
            <Swords className="w-24 h-24" strokeWidth={1.5} />
            <span className="text-[10px] font-mono tracking-widest text-rose-200 uppercase font-black mt-1">
              HOSTILE CURSE
            </span>
          </div>
        </div>
      )
    },
    {
      id: 'dps',
      tab: 'dps' as ActiveTab,
      theme: 'cyan',
      frameClass: 'neon-frame-cyan',
      topBadge: language === 'pt' ? '60s BLITZ' : '60s BLITZ',
      statBadge: 'KOKUSEN x 2.5',
      title: language === 'pt' ? 'SIMULADOR DE DPS' : 'DPS CALCULATOR',
      subtitle: language === 'pt' ? 'ROTAÇÕES & FLASH NEGRO' : 'ROTATIONS & BLACK FLASH',
      tagline: language === 'pt' ? 'Projete dano acumulado em tempo real com multiplicadores' : 'Simulate accumulated burst damage with critical scaling',
      metricPrimary: '60s',
      metricLabel: language === 'pt' ? 'Janela de Combate' : 'Combat Window',
      actionText: language === 'pt' ? 'CALCULAR DPS' : 'CALCULATE DPS',
      renderArt: () => (
        <div className="relative w-40 h-40 flex items-center justify-center">
          {/* Lightning Radial Burst */}
          <svg className="absolute inset-0 w-full h-full text-cyan-400 flame-aura-anim opacity-85" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="42" stroke="rgba(6,182,212,0.3)" strokeWidth="1" strokeDasharray="3 4" />
            <path d="M50 2 L50 15 M50 85 L50 98 M2 50 L15 50 M85 50 L98 50" stroke="#22d3ee" strokeWidth="1.5" />
          </svg>
          {/* Neon Triple Lightning Bolts (Quantora Style) */}
          <div className="relative z-10 text-cyan-300 drop-shadow-[0_0_24px_rgba(6,182,212,1)] flex items-center justify-center gap-1">
            <Zap className="w-12 h-20 -rotate-12 translate-y-1 opacity-70" strokeWidth={2} fill="currentColor" />
            <Zap className="w-16 h-24 z-10 scale-110" strokeWidth={2.2} fill="#67e8f9" />
            <Zap className="w-12 h-20 rotate-12 translate-y-1 opacity-70" strokeWidth={2} fill="currentColor" />
          </div>
        </div>
      )
    },
    {
      id: 'gacha',
      tab: 'gacha' as ActiveTab,
      theme: 'gold',
      frameClass: 'neon-frame-gold',
      topBadge: language === 'pt' ? 'MATRIZ DE PITY' : 'PITY MATRIX',
      statBadge: `${currentCubes.toLocaleString()} 💎`,
      title: language === 'pt' ? 'MATRIZ GACHA' : 'GACHA PROBABILITY',
      subtitle: language === 'pt' ? 'PROBABILIDADE & ECONOMIA' : 'PROBABILITY & ECONOMY',
      tagline: language === 'pt' ? 'Curva binomial de Bernoulli e projeção para 250 giros' : 'Bernoulli binomial curve and pity forecasts for 250 pulls',
      metricPrimary: `${Math.floor(currentCubes / 300)}`,
      metricLabel: language === 'pt' ? 'Giros Garantidos' : 'Current Pulls',
      actionText: language === 'pt' ? 'VER PROBABILIDADES' : 'VIEW ODDS',
      renderArt: () => (
        <div className="relative w-40 h-40 flex items-center justify-center">
          {/* Golden Cosmic Cube / Sacred Prism */}
          <svg className="absolute inset-0 w-full h-full text-amber-400 flame-aura-anim opacity-80" viewBox="0 0 100 100" fill="none">
            <polygon points="50,15 85,32 85,68 50,85 15,68 15,32" stroke="url(#goldGrad)" strokeWidth="1.5" fill="rgba(245,158,11,0.08)" />
            <line x1="50" y1="50" x2="50" y2="85" stroke="url(#goldGrad)" strokeWidth="1.5" />
            <line x1="50" y1="50" x2="85" y2="32" stroke="url(#goldGrad)" strokeWidth="1.5" />
            <line x1="50" y1="50" x2="15" y2="32" stroke="url(#goldGrad)" strokeWidth="1.5" />
            <defs>
              <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
            </defs>
          </svg>
          <div className="relative z-10 text-amber-300 drop-shadow-[0_0_22px_rgba(245,158,11,0.95)] flex flex-col items-center">
            <Coins className="w-16 h-16" strokeWidth={1.8} />
            <span className="text-[10px] font-mono tracking-widest text-amber-200 uppercase font-black mt-2">
              CURSED CUBES
            </span>
          </div>
        </div>
      )
    },
    {
      id: 'planner',
      tab: 'planner' as ActiveTab,
      theme: 'emerald',
      frameClass: 'neon-frame-emerald',
      topBadge: language === 'pt' ? 'PROGRESSÃO' : 'PROGRESSION',
      statBadge: 'LV 1 → 100',
      title: language === 'pt' ? 'PLANEJADOR DE FARM' : 'ASCENSION PLANNER',
      subtitle: language === 'pt' ? 'MATERIAIS & ASCENSÃO' : 'MATERIALS & ASCENSION',
      tagline: language === 'pt' ? 'Cálculo exato de ouro, orbes de XP e cristais elementais' : 'Precise calculation of gold, XP orbs and grade crystals',
      metricPrimary: '100%',
      metricLabel: language === 'pt' ? 'Eficiência de Recursos' : 'Resource Efficiency',
      actionText: language === 'pt' ? 'PLANEJAR MATERIAIS' : 'PLAN MATERIALS',
      renderArt: () => (
        <div className="relative w-40 h-40 flex items-center justify-center">
          {/* Emerald Hexagram & Seal */}
          <svg className="absolute inset-0 w-full h-full text-emerald-400 flame-aura-anim opacity-80" viewBox="0 0 100 100" fill="none">
            <polygon points="50,12 88,75 12,75" stroke="#34d399" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.6" />
            <polygon points="50,88 88,25 12,25" stroke="#34d399" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.6" />
          </svg>
          <div className="relative z-10 text-emerald-300 drop-shadow-[0_0_20px_rgba(16,185,129,0.9)] flex flex-col items-center">
            <ScrollText className="w-20 h-20" strokeWidth={1.6} />
            <span className="text-[10px] font-mono tracking-widest text-emerald-200 uppercase font-black mt-1">
              ANCIENT SEAL
            </span>
          </div>
        </div>
      )
    },
    {
      id: 'stamina',
      tab: 'stamina' as ActiveTab,
      theme: 'purple',
      frameClass: 'neon-frame-purple',
      topBadge: language === 'pt' ? 'TEMPO REAL' : 'REAL-TIME',
      statBadge: '1 AP / 3 MIN',
      title: language === 'pt' ? 'STAMINA & ROTINA' : 'AP & ROUTINE',
      subtitle: language === 'pt' ? 'RECUPERAÇÃO & CHECKLIST' : 'RECHARGE & CHECKLIST',
      tagline: language === 'pt' ? 'Previsão de AP 100% cheio e checklist de bônus diários' : 'Full AP cap prediction and daily rewards checklist',
      metricPrimary: '180 AP',
      metricLabel: language === 'pt' ? 'Capacidade Máxima' : 'Max AP Capacity',
      actionText: language === 'pt' ? 'SINCRONIZAR AP' : 'SYNC AP',
      renderArt: () => (
        <div className="relative w-40 h-40 flex items-center justify-center">
          {/* Violet Dial SVG */}
          <svg className="absolute inset-0 w-full h-full text-purple-400 flame-aura-anim opacity-80" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="40" stroke="rgba(168,85,247,0.3)" strokeWidth="1.5" />
            <circle cx="50" cy="50" r="44" stroke="#c084fc" strokeWidth="1.5" strokeDasharray="6 8" />
          </svg>
          <div className="relative z-10 text-purple-300 drop-shadow-[0_0_22px_rgba(168,85,247,0.9)] flex flex-col items-center">
            <Clock className="w-20 h-20" strokeWidth={1.6} />
            <span className="text-[10px] font-mono tracking-widest text-purple-200 uppercase font-black mt-1">
              CHRONO MATRIX
            </span>
          </div>
        </div>
      )
    }
  ], [language, jujutsudleStats, currentCubes]);

  // Navegação do carrossel
  const handleNext = useCallback(() => {
    playTabSwitch();
    setActiveIndex((prev) => (prev + 1) % cards.length);
  }, [cards.length]);

  const handlePrev = useCallback(() => {
    playTabSwitch();
    setActiveIndex((prev) => (prev - 1 + cards.length) % cards.length);
  }, [cards.length]);

  const handleCardClick = (index: number) => {
    if (index === activeIndex) {
      playSelect();
      onNavigate(cards[index].tab);
    } else {
      playTabSwitch();
      setActiveIndex(index);
    }
  };

  const currentCard = cards[activeIndex];
  const prevIndex = (activeIndex - 1 + cards.length) % cards.length;
  const nextIndex = (activeIndex + 1) % cards.length;

  return (
    <div className="relative w-full overflow-hidden rounded-3xl bg-[#030509] border border-cyan-900/30 shadow-2xl p-4 sm:p-6 md:p-8">
      
      {/* 1. Constellation Star Chart Background (Procedural SVG) */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {/* Subtle connecting lines */}
          <line x1="12%" y1="20%" x2="28%" y2="35%" stroke="#06b6d4" strokeWidth="0.7" opacity="0.4" />
          <line x1="28%" y1="35%" x2="45%" y2="15%" stroke="#06b6d4" strokeWidth="0.7" opacity="0.3" />
          <line x1="45%" y1="15%" x2="72%" y2="28%" stroke="#8b5cf6" strokeWidth="0.7" opacity="0.4" />
          <line x1="72%" y1="28%" x2="88%" y2="18%" stroke="#06b6d4" strokeWidth="0.7" opacity="0.3" />
          <line x1="88%" y1="18%" x2="92%" y2="60%" stroke="#8b5cf6" strokeWidth="0.7" opacity="0.4" />
          <line x1="15%" y1="70%" x2="35%" y2="82%" stroke="#06b6d4" strokeWidth="0.7" opacity="0.3" />
          <line x1="35%" y1="82%" x2="65%" y2="75%" stroke="#8b5cf6" strokeWidth="0.7" opacity="0.3" />
          <line x1="65%" y1="75%" x2="85%" y2="85%" stroke="#06b6d4" strokeWidth="0.7" opacity="0.4" />

          {/* Star nodes */}
          <circle cx="12%" cy="20%" r="2" fill="#22d3ee" className="animate-pulse" />
          <circle cx="28%" cy="35%" r="2.5" fill="#67e8f9" />
          <circle cx="45%" cy="15%" r="2" fill="#c084fc" />
          <circle cx="72%" cy="28%" r="3" fill="#22d3ee" className="animate-pulse" />
          <circle cx="88%" cy="18%" r="2" fill="#e879f9" />
          <circle cx="92%" cy="60%" r="2.5" fill="#22d3ee" />
          <circle cx="15%" cy="70%" r="2" fill="#38bdf8" />
          <circle cx="35%" cy="82%" r="2.5" fill="#818cf8" />
          <circle cx="65%" cy="75%" r="2" fill="#c084fc" className="animate-pulse" />
          <circle cx="85%" cy="85%" r="3" fill="#22d3ee" />
        </svg>
        {/* Soft background ambient radial glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. Top Status Bar (HUD Header) */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#172036]">
        
        {/* Left: Domain Crest */}
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 p-[1.5px] shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            <div className="w-full h-full rounded-[10px] bg-[#070b14] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono tracking-widest text-cyan-400 font-extrabold uppercase">
                JJKPP COMMAND HUB
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <h2 className="text-sm font-black text-white tracking-wider font-mono">
              QUANTORA TACTICAL HOLO-DECK
            </h2>
          </div>
        </div>

        {/* Right: Telemetry & Status Badges */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0a1120] border border-cyan-800/40 text-[11px] font-mono text-cyan-300">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold uppercase tracking-wider">100% OFFLINE</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#120e24] border border-purple-800/40 text-[11px] font-mono text-purple-300">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold tracking-wider">{currentCubes.toLocaleString()} CUBOS</span>
          </div>
        </div>
      </div>

      {/* 3. The 3D Coverflow Holo-Deck Centerpiece */}
      <div className="relative z-10 py-8 px-2 md:px-6 holo-perspective flex items-center justify-center min-h-[460px]">
        
        {/* Previous Card (Left Flank) */}
        <div 
          onClick={() => handleCardClick(prevIndex)}
          className="hidden lg:block absolute left-2 xl:left-8 w-[320px] h-[410px] rounded-3xl cursor-pointer transition-all duration-500 ease-out select-none [transform:rotateY(20deg)_scale(0.85)] opacity-40 hover:opacity-75 z-10"
        >
          <div className="relative w-full h-full rounded-3xl bg-[#090d18]/85 backdrop-blur-xl border border-gray-700/40 p-6 flex flex-col justify-between overflow-hidden shadow-2xl">
            <div className="glass-specular absolute inset-x-0 top-0 h-1/2 rounded-t-3xl pointer-events-none" />
            <div className="flex items-center justify-between text-xs font-mono text-gray-400">
              <span className="uppercase tracking-wider">{cards[prevIndex].topBadge}</span>
              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">{cards[prevIndex].statBadge}</span>
            </div>
            <div className="my-auto flex flex-col items-center justify-center">
              <div className="scale-75 opacity-70">
                {cards[prevIndex].renderArt()}
              </div>
              <h3 className="text-lg font-black text-gray-300 font-mono tracking-wider mt-2 text-center">
                {cards[prevIndex].title}
              </h3>
              <p className="text-[11px] text-gray-500 font-mono text-center mt-1">
                {cards[prevIndex].subtitle}
              </p>
            </div>
            <div className="text-center">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
                {language === 'pt' ? '« CLIQUE PARA GIRAR' : '« CLICK TO ROTATE'}
              </span>
            </div>
          </div>
        </div>

        {/* Active Center Card (High Holographic Fidelity) */}
        <div 
          key={currentCard.id}
          className={`relative w-full max-w-[420px] h-[450px] md:h-[460px] rounded-3xl bg-[#070b14]/90 backdrop-blur-2xl ${currentCard.frameClass} p-6 md:p-7 flex flex-col justify-between overflow-hidden transition-all duration-500 ease-out z-30 select-none shadow-[0_20px_50px_rgba(0,0,0,0.8)]`}
        >
          {/* Specular Curved Gloss (Top Half Highlight) */}
          <div className="glass-specular absolute inset-x-0 top-0 h-2/5 rounded-t-3xl pointer-events-none" />
          
          {/* Floating Subtle Ambient Corner Glyphs */}
          <div className="absolute top-3 right-3 text-[9px] font-mono text-cyan-500/40 tracking-widest pointer-events-none">
            SYS_LOC // 0{activeIndex + 1}
          </div>

          {/* Card Header */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-widest bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
              {currentCard.topBadge}
            </span>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-[#11192e] text-amber-300 border border-amber-500/30">
              <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>{currentCard.statBadge}</span>
            </div>
          </div>

          {/* Card Hero Illustration with Procedural Cursed Aura */}
          <div className="relative z-10 my-auto flex flex-col items-center justify-center pt-1">
            <div className="cosmic-float">
              {currentCard.renderArt()}
            </div>
            
            <div className="text-center mt-3 space-y-1">
              <h3 className="text-2xl md:text-3xl font-black text-white font-mono tracking-tight drop-shadow-[0_2px_12px_rgba(255,255,255,0.4)]">
                {currentCard.title}
              </h3>
              <p className="text-xs font-bold text-cyan-300 font-mono tracking-wider uppercase">
                {currentCard.subtitle}
              </p>
              <p className="text-[11px] text-gray-400 max-w-[320px] mx-auto leading-relaxed pt-0.5">
                {currentCard.tagline}
              </p>
            </div>
          </div>

          {/* Card Footer: Segmented Bar & Neon Pill Button */}
          <div className="relative z-10 space-y-4 pt-2">
            
            {/* Segmented Dash Progression Indicator (Quantora Style) */}
            <div className="flex items-center justify-center gap-1.5">
              {cards.map((_, i) => (
                <div 
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === activeIndex 
                      ? 'w-8 bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.9)]' 
                      : 'w-3 bg-gray-700/60'
                  }`}
                />
              ))}
            </div>

            {/* Neon Pill Action Button */}
            <button
              onClick={() => {
                playSelect();
                onNavigate(currentCard.tab);
              }}
              className="w-full py-3.5 px-6 rounded-full font-black text-xs md:text-sm font-mono tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border-2 border-cyan-400 bg-cyan-500/20 text-cyan-200 hover:bg-cyan-400 hover:text-black hover:shadow-[0_0_30px_rgba(6,182,212,0.9)] active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            >
              <span>{currentCard.actionText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Next Card (Right Flank) */}
        <div 
          onClick={() => handleCardClick(nextIndex)}
          className="hidden lg:block absolute right-2 xl:right-8 w-[320px] h-[410px] rounded-3xl cursor-pointer transition-all duration-500 ease-out select-none [transform:rotateY(-20deg)_scale(0.85)] opacity-40 hover:opacity-75 z-10"
        >
          <div className="relative w-full h-full rounded-3xl bg-[#090d18]/85 backdrop-blur-xl border border-gray-700/40 p-6 flex flex-col justify-between overflow-hidden shadow-2xl">
            <div className="glass-specular absolute inset-x-0 top-0 h-1/2 rounded-t-3xl pointer-events-none" />
            <div className="flex items-center justify-between text-xs font-mono text-gray-400">
              <span className="uppercase tracking-wider">{cards[nextIndex].topBadge}</span>
              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">{cards[nextIndex].statBadge}</span>
            </div>
            <div className="my-auto flex flex-col items-center justify-center">
              <div className="scale-75 opacity-70">
                {cards[nextIndex].renderArt()}
              </div>
              <h3 className="text-lg font-black text-gray-300 font-mono tracking-wider mt-2 text-center">
                {cards[nextIndex].title}
              </h3>
              <p className="text-[11px] text-gray-500 font-mono text-center mt-1">
                {cards[nextIndex].subtitle}
              </p>
            </div>
            <div className="text-center">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
                {language === 'pt' ? 'CLIQUE PARA GIRAR »' : 'CLICK TO ROTATE »'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 4. Bottom HUD Controller (Digital Readout & Frosted Navigation Buttons) */}
      <div className="relative z-10 flex items-center justify-between pt-4 border-t border-[#172036]">
        
        {/* Left Arrow Button (Circular Glass) */}
        <button
          onClick={handlePrev}
          title="Anterior"
          className="w-11 h-11 rounded-full bg-[#0a1120]/90 hover:bg-cyan-950/80 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white flex items-center justify-center transition-all duration-200 shadow-[0_0_12px_rgba(6,182,212,0.2)] hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] cursor-pointer active:scale-90"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Center Digital Telemetry Display */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 font-mono text-center">
          
          {/* Card Counter */}
          <div className="flex items-center gap-1.5 text-xs text-cyan-300 bg-[#070c17] px-3 py-1 rounded-lg border border-cyan-800/40">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold tracking-wider">
              [ 0{activeIndex + 1} / 0{cards.length} ]
            </span>
          </div>

          {/* Real-Time Daily Reset Countdown */}
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <span className="text-[11px] uppercase tracking-widest text-gray-400">
              {language === 'pt' ? 'RESET DIÁRIO:' : 'DAILY RESET:'}
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-[#0a1120] border border-cyan-900/60 font-bold text-cyan-300 font-mono tracking-wider shadow-inner">
              {timeUntilReset || '00:00:00.000'}
            </span>
          </div>
        </div>

        {/* Right Arrow Button (Circular Glass) */}
        <button
          onClick={handleNext}
          title="Próximo"
          className="w-11 h-11 rounded-full bg-[#0a1120]/90 hover:bg-cyan-950/80 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white flex items-center justify-center transition-all duration-200 shadow-[0_0_12px_rgba(6,182,212,0.2)] hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] cursor-pointer active:scale-90"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
};
