import React, { useState, useEffect, useMemo } from 'react';
import type { Character, ActiveTab } from '../types';
import { ElementBadge, RarityBadge } from './Badges';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Sparkles, 
  Users, 
  Calendar, 
  ArrowRight,
  HelpCircle,
  ChevronDown,
  ShieldCheck,
  Scale,
  Zap,
  Award,
  Dices,
  Skull,
  Gamepad2,
  Clock,
  Package,
  PenTool,
  Radio
} from 'lucide-react';
import { getAssetUrl } from '../utils/assets';
import { useTranslation, translateRole, translateFocus } from '../i18n';
import { TacticalHoloDeck } from './TacticalHoloDeck';
import { playSelect, playClick } from '../utils/sound';
import { useJjkStore } from '../store/useJjkStore';

interface HomePageProps {
  characters: Character[];
  onSelectCharacter: (char: Character) => void;
  onNavigate: (tab: ActiveTab, search?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ 
  characters, 
  onSelectCharacter,
  onNavigate 
}) => {
  const { language } = useTranslation();

  // Helper to parse DD-MM-YYYY or DD/MM/YYYY into timestamp
  const parseDate = (str?: string): number => {
    if (!str) return 0;
    const parts = str.replace(/\//g, '-').split('-');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      return new Date(y, m, d).getTime();
    }
    return 0;
  };

  // Select top 8 most recently released characters in JP
  const featuredUnits = React.useMemo(() => {
    return [...characters]
      .sort((a, b) => parseDate(b.release_date) - parseDate(a.release_date))
      .slice(0, 8);
  }, [characters]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [quickSearch, setQuickSearch] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Auto slide carousel every 6s
  useEffect(() => {
    if (featuredUnits.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredUnits.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [featuredUnits]);

  const currentUnit = featuredUnits[currentIndex] || characters[0];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      onNavigate('characters', quickSearch.trim());
    }
  };

  const faqs = language === 'pt' ? [
    {
      q: "Quais são as melhores unidades atuais em Phantom Parade?",
      a: "Unidades com alta autossuficiência, aumento maciço de dano para a equipe e quebra rápida de postura (Break) lideram o meta. Personagens como Satoru Gojo (0.2s / Hollow Purple), Yuta Okkotsu, Yuji Itadori (Zone) e Toji Fushiguro mantêm utilidade excepcional em combates de alto nível."
    },
    {
      q: "Como funcionam as habilidades que mudam na batalha (Base / Mudado)?",
      a: "Certos personagens entram em estados especiais (como o Estilo Feroz do Yuji Vermelho, a Expansão de Domínio do Megumi ou o Corpo Espiritual do Mahito). Durante essa transformação, seus custos de Energia Amaldiçoada e efeitos de habilidade são completamente alterados."
    },
    {
      q: "Como a Linha do Tempo calcula as previsões para o Global?",
      a: "O servidor Global foi acelerado para diminuir a distância com a versão japonesa. Atualmente, o atraso real (lag) está calibrado em exatamente 79 dias (marco oficial do evento de Kiyotaka Ijichi lançado em 17/09/2026 às 12:00), permitindo prever a chegada exata dos próximos banners."
    }
  ] : [
    {
      q: "What are the top tier units currently in Phantom Parade?",
      a: "Units with high self-sufficiency, massive team-wide damage amplification, and swift posture break lead the meta. Characters like Satoru Gojo (0.2s / Hollow Purple), Yuta Okkotsu, Yuji Itadori (Zone), and Toji Fushiguro maintain top-tier utility in endgame battles."
    },
    {
      q: "How do transformed combat abilities work (Base / Changed Mode)?",
      a: "Certain sorcerers enter special forms (such as Red Yuji's Ferocious Mode, Megumi's Domain Expansion, or Mahito's True Form). During transformation, their Cursed Energy costs and skill effects are completely altered."
    },
    {
      q: "How does the Timeline calculate Global version forecasts?",
      a: "The Global server is accelerated to catch up with the JP timeline. Currently, the actual delay (lag) is calibrated to exactly 79 days (official event benchmark: Kiyotaka Ijichi event released on 09/17/2026 at 12:00), projecting accurate upcoming banner releases."
    }
  ];

  const { toggleScratchpad, openSoundboard } = useJjkStore();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'combat' | 'data' | 'tools'>('all');

  const operationsModules = useMemo(() => [
    // 1. Setor Combate & Batalha
    {
      id: 'raids' as ActiveTab,
      category: 'combat',
      title: language === 'pt' ? 'Batalhas de Chefe' : 'Raid Boss Battles',
      subtitle: language === 'pt' ? 'Expedições & EX-Raid' : 'Expeditions & EX-Raid',
      desc: language === 'pt' ? 'Guias táticos de Dagon, Hanami e chefes de Grau Especial com fraquezas elementais.' : 'Tactical guides for Dagon, Hanami and Special Grade curses with elemental counters.',
      badge: 'EX-RAID',
      colorText: 'text-rose-400',
      borderGlow: 'hover:border-rose-500/60 hover:shadow-[0_0_25px_rgba(244,63,94,0.3)]',
      iconBg: 'bg-rose-950/60 text-rose-400 border-rose-500/40',
      badgeBg: 'bg-rose-950/80 text-rose-300 border-rose-500/30',
      icon: <Skull className="w-5 h-5" />
    },
    {
      id: 'dps' as ActiveTab,
      category: 'combat',
      title: language === 'pt' ? 'Simulador de DPS' : 'DPS Calculator',
      subtitle: language === 'pt' ? '60s Blitz & Kokusen' : '60s Blitz & Black Flash',
      desc: language === 'pt' ? 'Projeção de dano acumulado em tempo real com multiplicadores e rotações de combate.' : 'Real-time accumulated damage projections with scaling multipliers and combat rotations.',
      badge: 'KOKUSEN x2.5',
      colorText: 'text-cyan-400',
      borderGlow: 'hover:border-cyan-400/60 hover:shadow-[0_0_25px_rgba(6,182,212,0.3)]',
      iconBg: 'bg-cyan-950/60 text-cyan-400 border-cyan-500/40',
      badgeBg: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/30',
      icon: <Zap className="w-5 h-5" />
    },
    {
      id: 'teams' as ActiveTab,
      category: 'combat',
      title: language === 'pt' ? 'Melhores Times' : 'Best Teams',
      subtitle: language === 'pt' ? 'Formações & Sinergias' : 'Team Comps & Meta',
      desc: language === 'pt' ? 'Composições táticas recomendadas, formações mono-elementais e kits complementares.' : 'Recommended tactical lineups, mono-element comps and high-synergy kits.',
      badge: language === 'pt' ? 'META ATUAL' : 'CURRENT META',
      colorText: 'text-indigo-400',
      borderGlow: 'hover:border-indigo-400/60 hover:shadow-[0_0_25px_rgba(99,102,241,0.3)]',
      iconBg: 'bg-indigo-950/60 text-indigo-400 border-indigo-500/40',
      badgeBg: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/30',
      icon: <ShieldCheck className="w-5 h-5" />
    },
    {
      id: 'compare' as ActiveTab,
      category: 'combat',
      title: language === 'pt' ? 'Comparador de Feiticeiros' : 'Character Compare',
      subtitle: language === 'pt' ? 'Confronto Direto' : 'Side-by-Side',
      desc: language === 'pt' ? 'Comparação direta de atributos máximos, escalonamento Lv 1 ↔ 10 e kits de combate.' : 'Direct side-by-side comparison of max stats, Lv 1 ↔ 10 scaling and combat passives.',
      badge: language === 'pt' ? 'LADO A LADO' : 'HEAD TO HEAD',
      colorText: 'text-sky-400',
      borderGlow: 'hover:border-sky-400/60 hover:shadow-[0_0_25px_rgba(56,189,248,0.3)]',
      iconBg: 'bg-sky-950/60 text-sky-400 border-sky-500/40',
      badgeBg: 'bg-sky-950/80 text-sky-300 border-sky-500/30',
      icon: <Scale className="w-5 h-5" />
    },
    {
      id: 'buffs' as ActiveTab,
      category: 'combat',
      title: language === 'pt' ? 'Rankings de Buffs' : 'Buffs & Debuffs',
      subtitle: language === 'pt' ? 'Amplificadores & Quebra' : 'Amps & Posture Break',
      desc: language === 'pt' ? 'Rankings dos melhores buffers da equipe, desestabilizadores de defesa e quebra de postura.' : 'Rankings of top team buffers, defense debuffers and rapid posture break sorcerers.',
      badge: 'TOP BUFFERS',
      colorText: 'text-amber-400',
      borderGlow: 'hover:border-amber-400/60 hover:shadow-[0_0_25px_rgba(245,158,11,0.3)]',
      iconBg: 'bg-amber-950/60 text-amber-400 border-amber-500/40',
      badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-500/30',
      icon: <Sparkles className="w-5 h-5" />
    },

    // 2. Setor Catálogo & Base de Dados
    {
      id: 'characters' as ActiveTab,
      category: 'data',
      title: language === 'pt' ? 'Catálogo de Feiticeiros' : 'Sorcerer Database',
      subtitle: language === 'pt' ? '109 Fichas Técnicas' : '109 Full Profiles',
      desc: language === 'pt' ? 'Fichas completas com escalonamento Lv 1 → Lv 10, modos [Base]/[Mudado] e artes oficiais.' : 'Complete sheets with Lv 1 → Lv 10 scaling, [Base]/[Changed] forms and official art.',
      badge: '109 UNIDADES',
      colorText: 'text-cyan-400',
      borderGlow: 'hover:border-cyan-400/60 hover:shadow-[0_0_25px_rgba(6,182,212,0.3)]',
      iconBg: 'bg-cyan-950/60 text-cyan-400 border-cyan-500/40',
      badgeBg: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/30',
      icon: <Users className="w-5 h-5" />
    },
    {
      id: 'memories' as ActiveTab,
      category: 'data',
      title: language === 'pt' ? 'Cartas de Memória' : 'Rec. Bits (Memories)',
      subtitle: language === 'pt' ? '241 Lembranças' : '241 Memory Cards',
      desc: language === 'pt' ? 'Atributos máximos de Taijutsu/Jujutsu, tempos de recarga de habilidades ativas e passivas.' : 'Max Taijutsu/Jujutsu attributes, active skill cooldowns and passive boosts.',
      badge: '241 CARTAS',
      colorText: 'text-amber-400',
      borderGlow: 'hover:border-amber-400/60 hover:shadow-[0_0_25px_rgba(245,158,11,0.3)]',
      iconBg: 'bg-amber-950/60 text-amber-400 border-amber-500/40',
      badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-500/30',
      icon: <Sparkles className="w-5 h-5" />
    },
    {
      id: 'timeline' as ActiveTab,
      category: 'data',
      title: language === 'pt' ? 'Cronograma & Linha do Tempo' : 'Release Timeline',
      subtitle: language === 'pt' ? 'JP & Previsão Global' : 'JP & Global Forecast',
      desc: language === 'pt' ? '179 banners e eventos japoneses com previsão calibrada em tempo real para o Global.' : '179 Japanese banners and events with real-time calibrated lag prediction for Global.',
      badge: '179 EVENTOS',
      colorText: 'text-blue-400',
      borderGlow: 'hover:border-blue-400/60 hover:shadow-[0_0_25px_rgba(59,130,246,0.3)]',
      iconBg: 'bg-blue-950/60 text-blue-400 border-blue-500/40',
      badgeBg: 'bg-blue-950/80 text-blue-300 border-blue-500/30',
      icon: <Calendar className="w-5 h-5" />
    },
    {
      id: 'tierlist' as ActiveTab,
      category: 'data',
      title: language === 'pt' ? 'Tierlists do Meta' : 'Meta Tierlists',
      subtitle: language === 'pt' ? 'Oficial & Criador Custom' : 'Official & Custom Maker',
      desc: language === 'pt' ? 'Classificação competitiva atualizada e ferramenta para criar e exportar sua própria tierlist.' : 'Updated competitive tier lists and interactive tool to build and save custom tierlists.',
      badge: 'TIER S+ A C',
      colorText: 'text-yellow-400',
      borderGlow: 'hover:border-yellow-400/60 hover:shadow-[0_0_25px_rgba(234,179,8,0.3)]',
      iconBg: 'bg-yellow-950/60 text-yellow-400 border-yellow-500/40',
      badgeBg: 'bg-yellow-950/80 text-yellow-300 border-yellow-500/30',
      icon: <Award className="w-5 h-5" />
    },

    // 3. Setor Estratégia & Ferramentas
    {
      id: 'jujutsudle' as ActiveTab,
      category: 'tools',
      title: 'Jujutsudle',
      subtitle: language === 'pt' ? 'Arena Diária de Adivinhação' : 'Daily Guessing Arena',
      desc: language === 'pt' ? 'Mini-game diário estilo Wordle 100% offline com pistas comparativas, silhueta e áudio.' : 'Offline daily Wordle-style challenge with comparative hints, silhouette and sound cues.',
      badge: language === 'pt' ? 'DESAFIO HOJE' : 'TODAY TRIAL',
      colorText: 'text-purple-400',
      borderGlow: 'hover:border-purple-400/60 hover:shadow-[0_0_25px_rgba(168,85,247,0.3)]',
      iconBg: 'bg-purple-950/60 text-purple-400 border-purple-500/40',
      badgeBg: 'bg-purple-950/80 text-purple-300 border-purple-500/30',
      icon: <Gamepad2 className="w-5 h-5" />
    },
    {
      id: 'gacha' as ActiveTab,
      category: 'tools',
      title: language === 'pt' ? 'Matriz & Simulador Gacha' : 'Gacha Probability Matrix',
      subtitle: language === 'pt' ? 'Economia & Pity 250' : 'Economy & 250 Pity',
      desc: language === 'pt' ? 'Cálculo de probabilidade binomial de Bernoulli, economia de cubos e metas de banner.' : 'Bernoulli binomial probability calculator, cube savings tracker and banner pity targets.',
      badge: 'PROBABILIDADE',
      colorText: 'text-amber-400',
      borderGlow: 'hover:border-amber-400/60 hover:shadow-[0_0_25px_rgba(245,158,11,0.3)]',
      iconBg: 'bg-amber-950/60 text-amber-400 border-amber-500/40',
      badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-500/30',
      icon: <Dices className="w-5 h-5" />
    },
    {
      id: 'planner' as ActiveTab,
      category: 'tools',
      title: language === 'pt' ? 'Planejador de Ascensão' : 'Ascension Planner',
      subtitle: language === 'pt' ? 'Materiais Lv 1 → 100' : 'Materials Lv 1 → 100',
      desc: language === 'pt' ? 'Calculadora oficial de requisitos de ouro, orbes de XP e cristais elementais por grau.' : 'Official cost calculator for gold, XP orbs and elemental grade crystals.',
      badge: 'FARM MATRIX',
      colorText: 'text-emerald-400',
      borderGlow: 'hover:border-emerald-400/60 hover:shadow-[0_0_25px_rgba(16,185,129,0.3)]',
      iconBg: 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40',
      badgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30',
      icon: <Package className="w-5 h-5" />
    },
    {
      id: 'stamina' as ActiveTab,
      category: 'tools',
      title: language === 'pt' ? 'Stamina & Rotina' : 'AP & Daily Routine',
      subtitle: language === 'pt' ? 'Monitor em Tempo Real' : 'Real-Time AP Monitor',
      desc: language === 'pt' ? 'Previsão de recarga de 1 AP / 3 min, notificação de cap e checklist diário de missões.' : '1 AP / 3 min recharge timer, cap overflow alerts and interactive daily routine checklist.',
      badge: '1 AP / 3 MIN',
      colorText: 'text-purple-400',
      borderGlow: 'hover:border-purple-400/60 hover:shadow-[0_0_25px_rgba(168,85,247,0.3)]',
      iconBg: 'bg-purple-950/60 text-purple-400 border-purple-500/40',
      badgeBg: 'bg-purple-950/80 text-purple-300 border-purple-500/30',
      icon: <Clock className="w-5 h-5" />
    }
  ], [language]);

  const filteredModules = useMemo(() => {
    if (selectedCategory === 'all') return operationsModules;
    return operationsModules.filter(m => m.category === selectedCategory);
  }, [operationsModules, selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-6 md:py-8 space-y-12 animate-fadeIn">
      
      {/* 1. Tactical Holo-Deck 3D (Quantora Style Centerpiece) */}
      <TacticalHoloDeck onNavigate={onNavigate} />

      {/* 2. Tactical Operations Matrix - All Modules & Tabs Gateway */}
      <div className="space-y-6">
        
        {/* Section Header with Category Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-3 border-b border-[#1c2842]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-black uppercase tracking-wider bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
                {language === 'pt' ? 'CENTRO DE OPERAÇÕES // MATRIZ TOTAL' : 'TACTICAL OPERATIONS // FULL MATRIX'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white font-mono tracking-tight">
              {language === 'pt' ? 'TODOS OS MÓDULOS DO APLICATIVO' : 'ALL APPLICATION MODULES'}
            </h2>
            <p className="text-xs text-gray-400 font-mono">
              {language === 'pt' ? 'Acesse qualquer base de dados, calculadora ou ferramenta tática diretamente pelo Hub' : 'Launch any database, combat calculator or tactical tool directly from the Hub'}
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#090d18] border border-[#1b2640] self-start md:self-auto overflow-x-auto max-w-full">
            <button
              onClick={() => {
                playClick();
                setSelectedCategory('all');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.6)] font-black'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {language === 'pt' ? 'Todos (13)' : 'All (13)'}
            </button>
            <button
              onClick={() => {
                playClick();
                setSelectedCategory('combat');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === 'combat'
                  ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.6)] font-black'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {language === 'pt' ? 'Combate (5)' : 'Combat (5)'}
            </button>
            <button
              onClick={() => {
                playClick();
                setSelectedCategory('data');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === 'data'
                  ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.6)] font-black'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {language === 'pt' ? 'Catálogo & Dados (4)' : 'Catalog (4)'}
            </button>
            <button
              onClick={() => {
                playClick();
                setSelectedCategory('tools');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === 'tools'
                  ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.6)] font-black'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {language === 'pt' ? 'Estratégia (4)' : 'Strategy (4)'}
            </button>
          </div>
        </div>

        {/* The Grid of Operational Module Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredModules.map((mod) => (
            <div
              key={mod.id}
              onClick={() => {
                playSelect();
                onNavigate(mod.id);
              }}
              className={`relative rounded-2xl bg-[#080c16]/90 border border-[#1b2640] ${mod.borderGlow} p-5 flex flex-col justify-between overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group`}
            >
              {/* Specular Top Sheen */}
              <div className="glass-specular absolute inset-x-0 top-0 h-1/3 rounded-t-2xl pointer-events-none opacity-60" />

              <div className="space-y-3 relative z-10">
                {/* Header Row: Icon + Badge */}
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl border ${mod.iconBg} group-hover:scale-110 transition-transform`}>
                    {mod.icon}
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase tracking-wider border ${mod.badgeBg}`}>
                    {mod.badge}
                  </span>
                </div>

                {/* Title & Subtitle */}
                <div>
                  <h3 className="text-base font-black text-white font-mono tracking-tight group-hover:text-cyan-300 transition-colors">
                    {mod.title}
                  </h3>
                  <p className={`text-[11px] font-bold font-mono tracking-wide uppercase ${mod.colorText}`}>
                    {mod.subtitle}
                  </p>
                </div>

                {/* Technical Description */}
                <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                  {mod.desc}
                </p>
              </div>

              {/* Action Link Footer */}
              <div className="pt-4 border-t border-[#141d33] mt-4 flex items-center justify-between relative z-10">
                <span className="text-[11px] font-mono font-bold tracking-wider text-gray-400 group-hover:text-cyan-300 transition-colors">
                  {language === 'pt' ? 'INICIALIZAR MÓDULO' : 'LAUNCH MODULE'}
                </span>
                <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))}

          {/* Quick Launch Cards for Floating Tools (Scratchpad & Soundboard) */}
          {(selectedCategory === 'all' || selectedCategory === 'tools') && (
            <>
              {/* Lousa Tática Card */}
              <div
                onClick={() => {
                  playSelect();
                  toggleScratchpad();
                }}
                className="relative rounded-2xl bg-[#080c16]/90 border border-cyan-800/40 hover:border-cyan-400/80 hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] p-5 flex flex-col justify-between overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
              >
                <div className="glass-specular absolute inset-x-0 top-0 h-1/3 rounded-t-2xl pointer-events-none opacity-60" />
                <div className="space-y-3 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl border bg-cyan-950/60 text-cyan-300 border-cyan-500/40 group-hover:scale-110 transition-transform">
                      <PenTool className="w-5 h-5" />
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase tracking-wider border bg-cyan-950/80 text-cyan-300 border-cyan-500/30">
                      OVERLAY HUD
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white font-mono tracking-tight group-hover:text-cyan-300 transition-colors">
                      {language === 'pt' ? 'Lousa Tática' : 'Tactical Scratchpad'}
                    </h3>
                    <p className="text-[11px] font-bold font-mono tracking-wide uppercase text-cyan-400">
                      {language === 'pt' ? 'Quadro de Desenho' : 'Canvas Whiteboard'}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                    {language === 'pt' ? 'Lousa flutuante transparente com 6 cores e 3 espessuras para desenhar táticas sobre qualquer tela.' : 'Transparent floating canvas with 6 colors and 3 brush sizes for tactical in-game drawings.'}
                  </p>
                </div>
                <div className="pt-4 border-t border-[#141d33] mt-4 flex items-center justify-between relative z-10">
                  <span className="text-[11px] font-mono font-bold tracking-wider text-gray-400 group-hover:text-cyan-300 transition-colors">
                    {language === 'pt' ? 'ABRIR LOUSA' : 'OPEN CANVAS'}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>

              {/* Soundboard Card */}
              <div
                onClick={() => {
                  playSelect();
                  openSoundboard();
                }}
                className="relative rounded-2xl bg-[#080c16]/90 border border-purple-800/40 hover:border-purple-400/80 hover:shadow-[0_0_25px_rgba(168,85,247,0.3)] p-5 flex flex-col justify-between overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
              >
                <div className="glass-specular absolute inset-x-0 top-0 h-1/3 rounded-t-2xl pointer-events-none opacity-60" />
                <div className="space-y-3 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl border bg-purple-950/60 text-purple-300 border-purple-500/40 group-hover:scale-110 transition-transform">
                      <Radio className="w-5 h-5" />
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase tracking-wider border bg-purple-950/80 text-purple-300 border-purple-500/30">
                      SFX SYNTH
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white font-mono tracking-tight group-hover:text-purple-300 transition-colors">
                      {language === 'pt' ? 'Soundboard Tático' : 'Tactical Soundboard'}
                    </h3>
                    <p className="text-[11px] font-bold font-mono tracking-wide uppercase text-purple-400">
                      {language === 'pt' ? 'Efeitos & Magia' : 'Audio SFX Board'}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                    {language === 'pt' ? 'Efeitos sonoros procedurais de manipulação de energia amaldiçoada, kokusen e invocações.' : 'Procedural sound effects of cursed energy surges, black flash and celestial chimes.'}
                  </p>
                </div>
                <div className="pt-4 border-t border-[#141d33] mt-4 flex items-center justify-between relative z-10">
                  <span className="text-[11px] font-mono font-bold tracking-wider text-gray-400 group-hover:text-purple-300 transition-colors">
                    {language === 'pt' ? 'ABRIR SOUNDBOARD' : 'OPEN SOUNDBOARD'}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 3. Hero Carousel - Recent JP Releases */}
      {currentUnit && (
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#0d111d] via-[#101626] to-[#070b14] border border-[#1f2942] shadow-2xl p-6 md:p-10">
          <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-8">
            
            {/* Left Info */}
            <div className="space-y-4 max-w-xl z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-black uppercase tracking-wider bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
                    {language === 'pt' ? `Recente JP #${currentIndex + 1}` : `Latest JP #${currentIndex + 1}`}
                  </span>
                  {currentUnit.epithet && (
                    <p className="text-xs md:text-sm font-bold tracking-wider uppercase text-red-400">
                      {currentUnit.epithet}
                    </p>
                  )}
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-white font-serif tracking-tight drop-shadow-lg">
                  {currentUnit.name.toUpperCase()}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <RarityBadge rarity={currentUnit.rarity} />
                <ElementBadge element={currentUnit.element} />
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#1e1638] text-purple-300 border border-purple-800/40">
                  {translateFocus(currentUnit.focus, language)}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#1e1638] text-gray-300 border border-purple-800/40">
                  {translateRole(currentUnit.role, language)}
                </span>
              </div>

              {currentUnit.release_date && currentUnit.release_date !== 'N/A' && (
                <p className="text-xs text-gray-400">
                  {language === 'pt' ? 'Lançamento no Japão:' : 'Release in Japan:'}{' '}
                  <span className="text-gray-200 font-semibold">{currentUnit.release_date}</span>
                </p>
              )}

              <div className="pt-3">
                <button
                  onClick={() => onSelectCharacter(currentUnit)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-lg shadow-cyan-950/50 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <span>{language === 'pt' ? 'Ver personagem' : 'View character'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Banner Art */}
            <div className="relative w-full max-w-md aspect-[16/10] rounded-2xl overflow-hidden border-2 border-cyan-500/40 shadow-2xl shadow-cyan-950/40 bg-[#070b14] group">
              <img
                src={getAssetUrl(currentUnit.image)}
                alt={currentUnit.title}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getAssetUrl();
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-transparent to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Carousel Arrows */}
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + featuredUnits.length) % featuredUnits.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-cyan-950/80 text-white border border-cyan-500/40 transition-all z-20 cursor-pointer"
            title="Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % featuredUnits.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-cyan-950/80 text-white border border-cyan-500/40 transition-all z-20 cursor-pointer"
            title="Próximo"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Carousel Dots Indicator */}
          <div className="flex justify-center items-center gap-2 pt-6">
            {featuredUnits.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  currentIndex === idx ? 'w-8 bg-cyan-400 shadow-sm shadow-cyan-400' : 'w-2 bg-gray-700 hover:bg-gray-500'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* 3. What's New Card */}
      <div className="bg-[#090d18]/90 border border-[#1b2640] rounded-2xl p-5 shadow-lg flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-600/40 text-cyan-300">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-cyan-400 font-mono">
              {language === 'pt' ? 'O que há de novo na base de dados (Offline)' : "What's New in the Offline Database"}
            </h3>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">
            {language === 'pt' ? (
              <>
                • <strong>Centro de Comando Tático Holográfico:</strong> Carrossel 3D interativo para navegação ultrarrápida entre os principais módulos táticos do app.<br />
                • <strong>Habilidades com Estados Dinâmicos:</strong> Suporte completo para alternância entre modo <em>Base</em> e modo <em>Mudado</em> (Estilo Feroz do Yuji, Domínio do Megumi e Forma Espiritual do Mahito).<br />
                • <strong>Progressão Nível 1 ↔ Nível 10:</strong> Multiplicadores de combate escalando em tempo real com badges de Taxa Crítica e Flash Negro.
              </>
            ) : (
              <>
                • <strong>Tactical Holographic Command Center:</strong> Interactive 3D coverflow carousel for swift navigation across the database's premier modules.<br />
                • <strong>Dynamic Skill States:</strong> Complete support for switching between <em>Base</em> and <em>Changed</em> mode (Ferocious Yuji, Megumi Domain, True Form Mahito).<br />
                • <strong>Level 1 ↔ Level 10 Progression:</strong> Real-time scaling combat multipliers with Critical Rate and Black Flash badges.
              </>
            )}
          </p>
        </div>
      </div>

      {/* 4. Find a Character Search Box */}
      <div className="text-center space-y-4 max-w-2xl mx-auto pt-4">
        <h2 className="text-2xl font-bold text-white font-serif tracking-wide">
          {language === 'pt' ? 'BUSCAR UM FEITICEIRO' : 'SEARCH A SORCERER'}
        </h2>
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
          <input
            type="text"
            placeholder={language === 'pt' ? "Digite o nome ou epíteto (ex: Satoru Gojo, Yuji, Sukuna)..." : "Type sorcerer name or epithet (e.g. Satoru Gojo, Yuji, Sukuna)..."}
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            className="w-full bg-[#070b14] border-2 border-[#1c2842] focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(6,182,212,0.3)] rounded-2xl pl-12 pr-28 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none transition-all shadow-xl"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs transition-all shadow-md cursor-pointer active:scale-95"
          >
            {language === 'pt' ? 'Buscar' : 'Search'}
          </button>
        </form>
      </div>

      {/* 5. Global Database Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          onClick={() => onNavigate('characters')}
          className="bg-[#090d18]/90 border border-[#1b2640] hover:border-cyan-500/50 rounded-2xl p-6 text-center cursor-pointer transition-all hover:-translate-y-1 shadow-lg group hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]"
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-cyan-950/60 border border-cyan-600/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6" />
          </div>
          <div className="text-4xl font-black text-white font-mono tracking-tight">109</div>
          <div className="text-xs uppercase font-bold tracking-wider text-cyan-300 mt-1">
            {language === 'pt' ? 'Personagens Catalogados' : 'Cataloged Characters'}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {language === 'pt' ? 'Fichas completas com escalonamento Lv 1 → Lv 10 e artes.' : 'Complete profiles with Lv 1 → Lv 10 scaling and art assets.'}
          </p>
        </div>

        <div 
          onClick={() => onNavigate('memories')}
          className="bg-[#090d18]/90 border border-[#1b2640] hover:border-amber-500/50 rounded-2xl p-6 text-center cursor-pointer transition-all hover:-translate-y-1 shadow-lg group hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]"
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-amber-950/60 border border-amber-600/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="text-4xl font-black text-white font-mono tracking-tight">241</div>
          <div className="text-xs uppercase font-bold tracking-wider text-amber-300 mt-1">
            {language === 'pt' ? 'Cartas de Memória (Rec. Bits)' : 'Memory Bits (Rec. Bits)'}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {language === 'pt' ? 'Atributos máximos, recargas (CD), habilidades ativas e passivas.' : 'Max stats, cooldowns (CD), active skills and passives.'}
          </p>
        </div>

        <div 
          onClick={() => onNavigate('timeline')}
          className="bg-[#090d18]/90 border border-[#1b2640] hover:border-blue-500/50 rounded-2xl p-6 text-center cursor-pointer transition-all hover:-translate-y-1 shadow-lg group hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]"
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-blue-950/60 border border-blue-600/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="text-4xl font-black text-white font-mono tracking-tight">179</div>
          <div className="text-xs uppercase font-bold tracking-wider text-blue-300 mt-1">
            {language === 'pt' ? 'Eventos e Banners Oficiais' : 'Official Events & Banners'}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {language === 'pt' ? 'Cronologia japonesa e previsão calibrada para a versão Global.' : 'Japanese release chronology and calibrated Global schedule.'}
          </p>
        </div>
      </div>

      {/* 6. FAQ Section */}
      <div className="max-w-3xl mx-auto space-y-4 pt-6">
        <h2 className="text-xl font-bold text-white font-serif tracking-wide text-center flex items-center justify-center gap-2">
          <HelpCircle className="w-5 h-5 text-cyan-400" />
          {language === 'pt' ? 'PERGUNTAS FREQUENTES (FAQ)' : 'FREQUENTLY ASKED QUESTIONS (FAQ)'}
        </h2>

        <div className="space-y-2.5">
          {faqs.map((faq, idx) => (
            <div 
              key={idx}
              className="bg-[#090d18]/90 border border-[#1b2640] rounded-xl overflow-hidden transition-colors"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between p-4 text-left font-bold text-sm text-gray-200 hover:text-cyan-300 transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-cyan-400 transition-transform duration-200 ${openFaq === idx ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === idx && (
                <div className="p-4 pt-0 text-xs text-gray-300 leading-relaxed border-t border-[#141d33]">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
