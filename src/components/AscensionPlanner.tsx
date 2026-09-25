import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Coins, 
  Search, 
  Sliders, 
  BookOpen, 
  RotateCcw, 
  CheckCircle2, 
  ArrowRight, 
  Check, 
  Filter,
  Package,
  Award,
  CircleDollarSign,
  TrendingUp,
  X
} from 'lucide-react';
import type { Character } from '../types';
import charactersDataRaw from '../data/characters.json';
import { useTranslation } from '../i18n';
import { 
  getAssetUrl, 
  getStaticThumbUrl 
} from '../utils/assets';
import { 
  calculateAscensionCost, 
  formatResourceNumber, 
  getElementMeta,
  type ResourceDetail 
} from '../utils/ascensionCosts';
import { 
  playClick, 
  playLevelUp, 
  playElementalTone, 
  playSuccessFanfare,
  playTrashDelete
} from '../utils/sound';

const charactersData = charactersDataRaw as Character[];

const LOCAL_STORAGE_KEY = 'jjkppdb_ascension_planner_v1';

interface SavedPlannerState {
  characterId: string;
  startLevel: number;
  targetLevel: number;
  startSkillLevel: number;
  targetSkillLevel: number;
  includeUltimate: boolean;
  inventory: Record<string, number>;
  checkedItems: Record<string, boolean>;
}

export interface AscensionPlannerProps {
  initialCharacterId?: string;
  onSelectCharacter?: (char: Character) => void;
}

export const AscensionPlanner: React.FC<AscensionPlannerProps> = ({
  initialCharacterId,
  onSelectCharacter
}) => {
  const { language } = useTranslation();
  const isEn = language === 'en';

  // 1. Carrega dados salvos ou define padrão inicial
  const defaultCharId = initialCharacterId || charactersData[0]?.id || '';
  
  const [selectedCharId, setSelectedCharId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed: SavedPlannerState = JSON.parse(saved);
        if (parsed.characterId && charactersData.some(c => c.id === parsed.characterId)) {
          return parsed.characterId;
        }
      }
    } catch {
      // Ignora erro de JSON
    }
    return defaultCharId;
  });

  const [startLevel, setStartLevel] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) return JSON.parse(saved).startLevel ?? 1;
    } catch { /* empty */ }
    return 1;
  });

  const [targetLevel, setTargetLevel] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) return JSON.parse(saved).targetLevel ?? 80;
    } catch { /* empty */ }
    return 80;
  });

  const [startSkillLevel, setStartSkillLevel] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) return JSON.parse(saved).startSkillLevel ?? 1;
    } catch { /* empty */ }
    return 1;
  });

  const [targetSkillLevel, setTargetSkillLevel] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) return JSON.parse(saved).targetSkillLevel ?? 10;
    } catch { /* empty */ }
    return 10;
  });

  const [includeUltimate, setIncludeUltimate] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) return JSON.parse(saved).includeUltimate ?? true;
    } catch { /* empty */ }
    return true;
  });

  // Inventário do usuário: id do recurso -> quantidade que possui
  const [inventory, setInventory] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) return JSON.parse(saved).inventory ?? {};
    } catch { /* empty */ }
    return {};
  });

  // Itens checados / marcados como 100% prontos no checklist
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) return JSON.parse(saved).checkedItems ?? {};
    } catch { /* empty */ }
    return {};
  });

  // Modal de busca rápida de personagem
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [charSearch, setCharSearch] = useState('');
  const [selectedElementFilter, setSelectedElementFilter] = useState<string>('All');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Personagem atualmente selecionado
  const activeChar = useMemo(() => {
    return charactersData.find(c => c.id === selectedCharId) || charactersData[0];
  }, [selectedCharId]);

  // Salvar no localStorage sempre que o estado mudar
  useEffect(() => {
    const stateToSave: SavedPlannerState = {
      characterId: selectedCharId,
      startLevel,
      targetLevel,
      startSkillLevel,
      targetSkillLevel,
      includeUltimate,
      inventory,
      checkedItems,
    };
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (err) {
      console.warn('Erro ao salvar planejamento no localStorage:', err);
    }
  }, [selectedCharId, startLevel, targetLevel, startSkillLevel, targetSkillLevel, includeUltimate, inventory, checkedItems]);

  // Se o prop initialCharacterId mudar externamente
  const [prevInitialId, setPrevInitialId] = useState(initialCharacterId);
  if (initialCharacterId && initialCharacterId !== prevInitialId) {
    setPrevInitialId(initialCharacterId);
    if (charactersData.some(c => c.id === initialCharacterId)) {
      setSelectedCharId(initialCharacterId);
    }
  }

  // Foco no input de busca ao abrir picker
  useEffect(() => {
    if (isPickerOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isPickerOpen]);

  // Cálculo detalhado de custos
  const costResult = useMemo(() => {
    return calculateAscensionCost(
      startLevel,
      targetLevel,
      activeChar?.element || 'Yellow',
      startSkillLevel,
      targetSkillLevel,
      { numSkills: 3, includeUltimate }
    );
  }, [startLevel, targetLevel, activeChar?.element, startSkillLevel, targetSkillLevel, includeUltimate]);

  // Progresso do Checklist de Farm
  const farmProgress = useMemo(() => {
    const list = costResult.resourcesList.filter(r => r.amount > 0);
    if (list.length === 0) return { percent: 100, completedCount: 0, totalCount: 0 };

    let totalWeight = 0;
    let accumulatedWeight = 0;
    let completedCount = 0;

    for (const item of list) {
      totalWeight += 1;
      const isChecked = checkedItems[item.id];
      const owned = inventory[item.id] || 0;

      if (isChecked || owned >= item.amount) {
        accumulatedWeight += 1;
        completedCount += 1;
      } else {
        accumulatedWeight += Math.min(1, Math.max(0, owned / item.amount));
      }
    }

    const percent = Math.min(100, Math.round((accumulatedWeight / totalWeight) * 100));
    return {
      percent,
      completedCount,
      totalCount: list.length,
    };
  }, [costResult.resourcesList, checkedItems, inventory]);

  // Disparar efeito sonoro quando alcançar 100% de conclusão
  const prevPercentRef = useRef(farmProgress.percent);
  useEffect(() => {
    if (farmProgress.percent === 100 && prevPercentRef.current < 100) {
      playSuccessFanfare();
    }
    prevPercentRef.current = farmProgress.percent;
  }, [farmProgress.percent]);

  // Ações do Usuário
  const handleSelectChar = (char: Character) => {
    playElementalTone(char.element);
    setSelectedCharId(char.id);
    setIsPickerOpen(false);
    if (onSelectCharacter) {
      onSelectCharacter(char);
    }
  };

  const handleStartLevelChange = (val: number) => {
    const n = Math.max(1, Math.min(100, val));
    playClick();
    setStartLevel(n);
    if (n > targetLevel) {
      setTargetLevel(n);
    }
  };

  const handleTargetLevelChange = (val: number) => {
    const n = Math.max(1, Math.min(100, val));
    if (n === 100) {
      playLevelUp();
    } else {
      playClick();
    }
    setTargetLevel(n);
    if (n < startLevel) {
      setStartLevel(n);
    }
  };

  const handleStartSkillChange = (val: number) => {
    const n = Math.max(1, Math.min(10, val));
    playClick();
    setStartSkillLevel(n);
    if (n > targetSkillLevel) {
      setTargetSkillLevel(n);
    }
  };

  const handleTargetSkillChange = (val: number) => {
    const n = Math.max(1, Math.min(10, val));
    playClick();
    setTargetSkillLevel(n);
    if (n < startSkillLevel) {
      setStartSkillLevel(n);
    }
  };

  const handleToggleItemCheck = (id: string, requiredAmount: number) => {
    playClick();
    setCheckedItems(prev => {
      const nextChecked = !prev[id];
      if (nextChecked) {
        // Preenche estoque correspondente se estiver checado
        setInventory(inv => ({ ...inv, [id]: requiredAmount }));
      }
      return { ...prev, [id]: nextChecked };
    });
  };

  const handleInventoryChange = (id: string, val: string, requiredAmount: number) => {
    const parsed = parseInt(val, 10);
    const amount = isNaN(parsed) ? 0 : Math.max(0, parsed);
    setInventory(prev => ({ ...prev, [id]: amount }));
    if (amount >= requiredAmount) {
      setCheckedItems(prev => ({ ...prev, [id]: true }));
    } else {
      setCheckedItems(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleCheckAll = () => {
    playSuccessFanfare();
    const newChecked: Record<string, boolean> = {};
    const newInv: Record<string, number> = { ...inventory };
    for (const item of costResult.resourcesList) {
      newChecked[item.id] = true;
      newInv[item.id] = item.amount;
    }
    setCheckedItems(newChecked);
    setInventory(newInv);
  };

  const handleResetFarm = () => {
    playTrashDelete();
    setCheckedItems({});
    setInventory({});
  };

  // Filtragem na modal de personagens
  const filteredChars = useMemo(() => {
    const q = charSearch.trim().toLowerCase();
    return charactersData.filter(c => {
      const matchesSearch = !q || 
        c.name.toLowerCase().includes(q) || 
        c.title.toLowerCase().includes(q) || 
        c.epithet.toLowerCase().includes(q);
      const matchesElement = selectedElementFilter === 'All' || c.element === selectedElementFilter;
      return matchesSearch && matchesElement;
    });
  }, [charSearch, selectedElementFilter]);

  const elemMeta = getElementMeta(activeChar?.element || 'Yellow');

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* 1. Header do Módulo */}
      <div className="bg-gradient-to-r from-[#140e24] via-[#1a1330] to-[#0f0b1b] border border-purple-900/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/40 border border-purple-700/40 text-purple-300 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              {isEn ? 'Ascension & Skill Progression Engine' : 'Planejador Tático de Ascensão & Nível'}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              {isEn ? 'Ascension Materials Planner' : 'Planejador de Materiais de Ascensão'}
            </h1>
            <p className="text-gray-400 text-sm max-w-2xl">
              {isEn 
                ? 'Calculate exact gold, cursed XP orbs, elemental grade crystals, and technique scrolls required to ascend your sorcerers to Grade 1 / Special Grade.' 
                : 'Calcule com precisão os requisitos de JP, orbes de XP, cristais de ascensão elementais e pergaminhos de técnica do Nível 1 ao 100.'}
            </p>
          </div>

          {/* Botão de Troca Rápida de Feiticeiro */}
          <button
            onClick={() => {
              playClick();
              setIsPickerOpen(true);
            }}
            className="flex items-center gap-3 px-4 py-3 bg-[#1e1638] hover:bg-[#281e4a] border border-purple-600/40 hover:border-purple-500 rounded-xl transition-all shadow-md group cursor-pointer"
          >
            <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-purple-500/40 bg-black/40 shrink-0">
              <img
                src={getStaticThumbUrl(activeChar.image)}
                alt={activeChar.name}
                className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.src = getAssetUrl(activeChar.image);
                }}
              />
              <span className={`absolute bottom-0 right-0 text-[9px] font-black px-1 rounded-tl ${
                activeChar.rarity === 'SSR' ? 'bg-amber-500 text-black' : 'bg-purple-600 text-white'
              }`}>
                {activeChar.rarity}
              </span>
            </div>
            <div className="text-left">
              <span className="text-[11px] text-gray-400 font-medium block uppercase tracking-wider">
                {isEn ? 'Target Sorcerer' : 'Feiticeiro Selecionado'}
              </span>
              <span className="text-white font-bold text-sm block truncate max-w-[160px]">
                {activeChar.name}
              </span>
              <span className="text-xs text-purple-300 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: elemMeta.colorHex }} />
                {isEn ? elemMeta.nameEn : elemMeta.namePt}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Grid de Controles Interativos (Nível & Habilidades) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel A: Nível de Feiticeiro (1 a 100) */}
        <div className="bg-[#110c20] border border-[#23193d] rounded-2xl p-5 shadow-lg space-y-5">
          <div className="flex items-center justify-between border-b border-[#201838] pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-purple-400" />
              <h2 className="text-base font-bold text-white">
                {isEn ? 'Character Level Range' : 'Faixa de Nível do Feiticeiro'}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-md bg-purple-950/60 border border-purple-800/40 text-purple-300">
              Lv {startLevel} <ArrowRight className="w-3 h-3 text-purple-400" /> Lv {targetLevel}
            </div>
          </div>

          {/* Sliders de Nível Atual e Nível Alvo */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-medium">{isEn ? 'Current Level:' : 'Nível Atual:'}</span>
                <span className="text-white font-bold bg-[#1a1230] px-2 py-0.5 rounded border border-purple-900/40">
                  Lv {startLevel}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={startLevel}
                onChange={(e) => handleStartLevelChange(Number(e.target.value))}
                className="w-full accent-purple-500 bg-[#1c1533] h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                <span>Lv 1</span>
                <span>Lv 20</span>
                <span>Lv 40</span>
                <span>Lv 60</span>
                <span>Lv 80</span>
                <span>Lv 100</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-purple-300 font-medium">{isEn ? 'Target Level:' : 'Nível Almejado:'}</span>
                <span className="text-purple-300 font-bold bg-purple-950/60 px-2 py-0.5 rounded border border-purple-700/50">
                  Lv {targetLevel}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={targetLevel}
                onChange={(e) => handleTargetLevelChange(Number(e.target.value))}
                className="w-full accent-purple-400 bg-[#1c1533] h-2 rounded-lg cursor-pointer"
              />
            </div>

            {/* Presets Rápidos de Ascensão de Grau */}
            <div className="pt-2">
              <span className="text-[11px] text-gray-400 uppercase tracking-wider block mb-2 font-medium">
                {isEn ? 'Quick Ascension Presets:' : 'Marcos Rápidos de Ascensão:'}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Lv 1 → 40', s: 1, t: 40, hint: 'Grau 2' },
                  { label: 'Lv 1 → 60', s: 1, t: 60, hint: 'Semi-1' },
                  { label: 'Lv 60 → 80', s: 60, t: 80, hint: 'Grau 1' },
                  { label: 'Lv 1 → 100', s: 1, t: 100, hint: 'Máximo' },
                ].map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      playLevelUp();
                      setStartLevel(p.s);
                      setTargetLevel(p.t);
                    }}
                    className={`px-2 py-1.5 rounded-lg border text-xs text-center transition-all cursor-pointer ${
                      startLevel === p.s && targetLevel === p.t
                        ? 'bg-purple-600 border-purple-400 text-white font-bold shadow-md shadow-purple-900/30'
                        : 'bg-[#18112c] border-[#291e47] text-gray-300 hover:bg-[#22183e] hover:border-purple-600/40'
                    }`}
                  >
                    <div className="font-semibold">{p.label}</div>
                    <div className="text-[10px] text-purple-300/80">{p.hint}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Painel B: Nível de Habilidades & Suprema */}
        <div className="bg-[#110c20] border border-[#23193d] rounded-2xl p-5 shadow-lg space-y-5">
          <div className="flex items-center justify-between border-b border-[#201838] pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">
                {isEn ? 'Technique & Skill Level Range' : 'Faixa de Habilidades & Suprema'}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-950/40 border border-amber-800/40 text-amber-300">
              Lv {startSkillLevel} <ArrowRight className="w-3 h-3 text-amber-400" /> Lv {targetSkillLevel}
            </div>
          </div>

          {/* Sliders de Habilidades */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-medium">{isEn ? 'Current Skill Level:' : 'Nível Inicial das Técnicas:'}</span>
                <span className="text-white font-bold bg-[#1a1230] px-2 py-0.5 rounded border border-purple-900/40">
                  Lv {startSkillLevel}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={startSkillLevel}
                onChange={(e) => handleStartSkillChange(Number(e.target.value))}
                className="w-full accent-amber-500 bg-[#1c1533] h-2 rounded-lg cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-amber-300 font-medium">{isEn ? 'Target Skill Level:' : 'Nível Almejado das Técnicas:'}</span>
                <span className="text-amber-300 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-700/50">
                  Lv {targetSkillLevel}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={targetSkillLevel}
                onChange={(e) => handleTargetSkillChange(Number(e.target.value))}
                className="w-full accent-amber-400 bg-[#1c1533] h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                <span>Lv 1 (Base)</span>
                <span>Lv 5</span>
                <span>Lv 7 (Shards)</span>
                <span>Lv 10 (Max)</span>
              </div>
            </div>

            {/* Toggle de Técnica Suprema */}
            <div className="pt-2 flex items-center justify-between p-3 rounded-xl bg-[#160f2b] border border-[#271b48]">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  {isEn ? 'Include Ultimate Technique' : 'Incluir Técnica Suprema no Cálculo'}
                </div>
                <div className="text-[11px] text-gray-400">
                  {isEn ? 'Calculates costs for 3 Active Skills + 1 Ultimate' : 'Calcula 3 Habilidades Ativas + 1 Habilidade Suprema'}
                </div>
              </div>
              <button
                onClick={() => {
                  playClick();
                  setIncludeUltimate(!includeUltimate);
                }}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  includeUltimate ? 'bg-amber-500 justify-end' : 'bg-gray-700 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md transform transition" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Resumo Visual Consolidado de Recursos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-bold text-white">
              {isEn ? 'Consolidated Material Requirements' : 'Resumo Consolidado de Recursos Necessários'}
            </h2>
          </div>
          <div className="text-xs text-gray-400 font-medium">
            {costResult.milestonesPassed.length > 0 && (
              <span className="text-purple-300">
                {costResult.milestonesPassed.length} {isEn ? 'Ascensions passed' : 'Marcos de Ascensão'}
              </span>
            )}
          </div>
        </div>

        {/* 4 Grandes Cards de Recursos Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Ouro Total (JP Currency) */}
          <div className="bg-[#120d24] border border-amber-500/30 rounded-2xl p-4 shadow-lg flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/50 transition-all">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <CircleDollarSign className="w-4 h-4 text-amber-400" />
                {isEn ? 'Gold (JP)' : 'Ouro (JP)'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800/40 text-amber-300">
                JP Currency
              </span>
            </div>
            <div>
              <div className="text-2xl font-black text-amber-400 tracking-tight">
                {formatResourceNumber(costResult.totalJp)}
              </div>
              <div className="text-[11px] text-gray-400 mt-1 space-y-0.5">
                <div className="flex justify-between">
                  <span>{isEn ? 'Level XP:' : 'Nivelamento:'}</span>
                  <span className="text-gray-300">{formatResourceNumber(costResult.levelingJp)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isEn ? 'Ascension Milestones:' : 'Marcos de Ascensão:'}</span>
                  <span className="text-gray-300">{formatResourceNumber(costResult.ascensionJp)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isEn ? 'Skills Upgrades:' : 'Habilidades:'}</span>
                  <span className="text-gray-300">{formatResourceNumber(costResult.skillJp)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Experiência Total & Orbes */}
          <div className="bg-[#120d24] border border-purple-500/30 rounded-2xl p-4 shadow-lg flex flex-col justify-between relative overflow-hidden group hover:border-purple-500/50 transition-all">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                {isEn ? 'Cursed XP & Orbs' : 'XP Total & Orbes'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800/40 text-purple-300 font-mono">
                修練の燈
              </span>
            </div>
            <div>
              <div className="text-2xl font-black text-purple-300 tracking-tight">
                {formatResourceNumber(costResult.totalXp)} <span className="text-sm font-medium text-gray-400">XP</span>
              </div>
              <div className="text-[11px] text-gray-400 mt-1 space-y-0.5">
                <div className="flex justify-between">
                  <span>{isEn ? 'Large Orbs (10k):' : 'Orbe Grande (10k):'}</span>
                  <span className="text-purple-300 font-semibold">{formatResourceNumber(costResult.xpOrbs.large)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isEn ? 'Medium Orbs (1k):' : 'Orbe Médio (1k):'}</span>
                  <span className="text-purple-300 font-semibold">{formatResourceNumber(costResult.xpOrbs.medium)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isEn ? 'Small Orbs (100):' : 'Orbe Pequeno (100):'}</span>
                  <span className="text-purple-300 font-semibold">{formatResourceNumber(costResult.xpOrbs.small)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Cristais de Ascensão de Grau Elementais */}
          <div className="bg-[#120d24] border border-cyan-500/30 rounded-2xl p-4 shadow-lg flex flex-col justify-between relative overflow-hidden group hover:border-cyan-500/50 transition-all">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-cyan-400" />
                {isEn ? 'Elemental Crystals' : 'Cristais Elementais'}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded border ${elemMeta.badgeClass}`}>
                {isEn ? elemMeta.nameEn : elemMeta.namePt}
              </span>
            </div>
            <div>
              <div className="text-2xl font-black text-cyan-300 tracking-tight">
                {formatResourceNumber(
                  costResult.elementalCrystals.grade4 +
                  costResult.elementalCrystals.grade3 +
                  costResult.elementalCrystals.grade2 +
                  costResult.elementalCrystals.semiGrade1 +
                  costResult.elementalCrystals.grade1 +
                  costResult.elementalCrystals.specialGrade
                )} <span className="text-sm font-medium text-gray-400">{isEn ? 'total' : 'cristais'}</span>
              </div>
              <div className="text-[11px] text-gray-400 mt-1 space-y-0.5">
                <div className="flex justify-between">
                  <span>Grau 4 & 3:</span>
                  <span className="text-gray-200">{costResult.elementalCrystals.grade4 + costResult.elementalCrystals.grade3}</span>
                </div>
                <div className="flex justify-between">
                  <span>Grau 2 & Semi-1:</span>
                  <span className="text-gray-200">{costResult.elementalCrystals.grade2 + costResult.elementalCrystals.semiGrade1}</span>
                </div>
                <div className="flex justify-between">
                  <span>Grau 1 & Especial:</span>
                  <span className="text-cyan-300 font-semibold">{costResult.elementalCrystals.grade1 + costResult.elementalCrystals.specialGrade}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Pergaminhos de Técnica & Domínio */}
          <div className="bg-[#120d24] border border-emerald-500/30 rounded-2xl p-4 shadow-lg flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/50 transition-all">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                {isEn ? 'Skill Scrolls' : 'Pergaminhos & Shards'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/40 text-emerald-300">
                Lv {startSkillLevel} → {targetSkillLevel}
              </span>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-300 tracking-tight">
                {formatResourceNumber(
                  costResult.skillMaterials.scrollTier1 +
                  costResult.skillMaterials.scrollTier2 +
                  costResult.skillMaterials.scrollTier3
                )} <span className="text-sm font-medium text-gray-400">{isEn ? 'scrolls' : 'pergaminhos'}</span>
              </div>
              <div className="text-[11px] text-gray-400 mt-1 space-y-0.5">
                <div className="flex justify-between">
                  <span>{isEn ? 'Tier I / II:' : 'Pergaminho I & II:'}</span>
                  <span className="text-gray-200">{costResult.skillMaterials.scrollTier1 + costResult.skillMaterials.scrollTier2}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isEn ? 'Tier III (Advanced):' : 'Pergaminho III (Avançado):'}</span>
                  <span className="text-emerald-300 font-semibold">{costResult.skillMaterials.scrollTier3}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isEn ? 'Domain Shards:' : 'Fragmentos de Domínio:'}</span>
                  <span className="text-amber-400 font-bold">{costResult.skillMaterials.domainShards}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Checklist Interativo de Farm com Barra de Conclusão */}
      <div className="bg-[#110c20] border border-[#23193d] rounded-2xl p-5 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#201838] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">
                {isEn ? 'Interactive Farm Checklist & Stock' : 'Checklist Interativo de Farm & Estoque'}
              </h2>
            </div>
            <p className="text-xs text-gray-400">
              {isEn 
                ? 'Check items off or enter current inventory to calculate your overall farming readiness.' 
                : 'Marque os itens que já possui ou preencha a quantidade em estoque para acompanhar sua prontidão.'}
            </p>
          </div>

          {/* Botões de Ação do Checklist */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCheckAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-700/50 text-emerald-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              {isEn ? 'Complete All' : 'Marcar Todos'}
            </button>
            <button
              onClick={handleResetFarm}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/40 text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {isEn ? 'Reset' : 'Limpar'}
            </button>
          </div>
        </div>

        {/* Barra de Progresso Geral */}
        <div className="bg-[#160f2a] border border-[#291e47] rounded-xl p-4 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-gray-300 flex items-center gap-2">
              <Package className="w-4 h-4 text-purple-400" />
              {isEn ? 'Farming Readiness:' : 'Prontidão de Materiais:'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-mono">
                {farmProgress.completedCount} / {farmProgress.totalCount} {isEn ? 'ready' : 'prontos'}
              </span>
              <span className={`font-black text-sm px-2 py-0.5 rounded ${
                farmProgress.percent === 100 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : farmProgress.percent >= 50
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {farmProgress.percent}%
              </span>
            </div>
          </div>

          <div className="w-full bg-[#0d0918] h-3 rounded-full overflow-hidden p-0.5 border border-[#291e47]">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                farmProgress.percent === 100 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-md shadow-emerald-500/40' 
                  : 'bg-gradient-to-r from-purple-600 via-indigo-500 to-amber-400'
              }`}
              style={{ width: `${farmProgress.percent}%` }}
            />
          </div>
        </div>

        {/* Tabela / Lista de Itens do Farm */}
        <div className="divide-y divide-[#201838]">
          {costResult.resourcesList.filter(r => r.amount > 0).map((item: ResourceDetail) => {
            const isChecked = !!checkedItems[item.id];
            const ownedAmount = inventory[item.id] || 0;
            const itemPercent = isChecked || ownedAmount >= item.amount 
              ? 100 
              : Math.min(100, Math.round((ownedAmount / item.amount) * 100));

            return (
              <div 
                key={item.id}
                className={`py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl transition-colors ${
                  isChecked || itemPercent >= 100 ? 'bg-emerald-950/10' : 'hover:bg-[#160f29]'
                }`}
              >
                {/* Lado Esquerdo: Checkbox + Nome do Item */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleItemCheck(item.id, item.amount)}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                      isChecked || itemPercent >= 100
                        ? 'bg-emerald-500 border-emerald-400 text-black shadow-sm shadow-emerald-500/30'
                        : 'bg-[#18112c] border-[#36275c] text-transparent hover:border-purple-500'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${
                        isChecked || itemPercent >= 100 ? 'text-gray-300 line-through opacity-70' : 'text-white'
                      }`}>
                        {isEn ? item.nameEn : item.namePt}
                      </span>
                      {item.rarity && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#20173b] text-purple-300 border border-purple-800/40">
                          {item.rarity}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {isEn ? item.subtextEn : item.subtextPt}
                    </div>
                  </div>
                </div>

                {/* Lado Direito: Input de Estoque + Quantidade Necessária */}
                <div className="flex items-center gap-3 pl-9 sm:pl-0">
                  <div className="flex items-center gap-1.5 bg-[#170f2b] px-2.5 py-1 rounded-lg border border-[#2b1f4c]">
                    <span className="text-[11px] text-gray-400 font-medium">
                      {isEn ? 'Stock:' : 'Tenho:'}
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={inventory[item.id] !== undefined ? inventory[item.id] : ''}
                      placeholder="0"
                      onChange={(e) => handleInventoryChange(item.id, e.target.value, item.amount)}
                      className="w-16 bg-black/40 text-right text-xs font-bold text-white px-1.5 py-0.5 rounded border border-[#3b2a63] focus:border-purple-500 focus:outline-none"
                    />
                    <span className="text-xs text-gray-500">/</span>
                    <span className="text-xs font-bold text-purple-300">
                      {formatResourceNumber(item.amount)}
                    </span>
                  </div>

                  <div className={`text-xs font-mono font-bold w-12 text-right ${
                    itemPercent >= 100 ? 'text-emerald-400' : 'text-gray-400'
                  }`}>
                    {itemPercent}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Modal de Seleção Rápida de Feiticeiro */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#110c20] border border-[#2d204d] rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header do Modal */}
            <div className="p-4 border-b border-[#251a42] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">
                  {isEn ? 'Choose Sorcerer for Ascension' : 'Selecionar Feiticeiro para Planejamento'}
                </h3>
              </div>
              <button
                onClick={() => {
                  playClick();
                  setIsPickerOpen(false);
                }}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filtros e Busca */}
            <div className="p-4 border-b border-[#251a42] space-y-3 bg-[#140e26]">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={isEn ? 'Search by name or title...' : 'Pesquisar por nome ou epíteto...'}
                  value={charSearch}
                  onChange={(e) => setCharSearch(e.target.value)}
                  className="w-full bg-[#1b1333] border border-[#312356] rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Botões de Elemento */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0 mr-1" />
                {['All', 'Blue', 'Red', 'Green', 'Yellow'].map((elem) => (
                  <button
                    key={elem}
                    onClick={() => {
                      playClick();
                      setSelectedElementFilter(elem);
                    }}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      selectedElementFilter === elem
                        ? 'bg-purple-600 text-white font-bold'
                        : 'bg-[#1b1333] text-gray-400 hover:text-white hover:bg-[#251a46]'
                    }`}
                  >
                    {elem === 'All' ? (isEn ? 'All Elements' : 'Todos') : elem}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid de Personagens */}
            <div className="p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredChars.map((char) => {
                const isSelected = char.id === selectedCharId;
                const charElemMeta = getElementMeta(char.element);

                return (
                  <div
                    key={char.id}
                    onClick={() => handleSelectChar(char)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center text-center gap-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-purple-900/30 border-purple-500 ring-2 ring-purple-500/40 shadow-lg'
                        : 'bg-[#160f2b] border-[#291d4a] hover:bg-[#1e153b] hover:border-purple-600/50'
                    }`}
                  >
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-purple-500/30 bg-black/40">
                      <img
                        src={getStaticThumbUrl(char.image)}
                        alt={char.name}
                        className="w-full h-full object-cover object-top"
                        onError={(e) => {
                          e.currentTarget.src = getAssetUrl(char.image);
                        }}
                      />
                      <span className={`absolute bottom-0 right-0 text-[8px] font-black px-1 rounded-tl ${
                        char.rarity === 'SSR' ? 'bg-amber-500 text-black' : 'bg-purple-600 text-white'
                      }`}>
                        {char.rarity}
                      </span>
                    </div>

                    <div className="w-full">
                      <div className="text-xs font-bold text-white truncate w-full">
                        {char.name}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate w-full">
                        {char.title}
                      </div>
                      <div className="text-[10px] font-semibold mt-1 flex items-center justify-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: charElemMeta.colorHex }} />
                        <span style={{ color: charElemMeta.colorHex }}>{char.element}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AscensionPlanner;
