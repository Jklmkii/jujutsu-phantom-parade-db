import React, { useState } from 'react';
import type { Character, SkillVariant } from '../types';
import { ElementBadge, RarityBadge, TagBadge } from './Badges';
import { ArrowLeft, Zap, Shield, Sparkles, Swords, Star } from 'lucide-react';
import { useJjkStore } from '../store/useJjkStore';
import { playClick, playStarToggle, playTransformSurge, playLevelUp, playDomainExpansion, playBlackFlash } from '../utils/sound';
import { getAssetUrl, getSkillIconUrl } from '../utils/assets';

interface CharacterDetailProps {
  character: Character;
  onBack: () => void;
}

export const CharacterDetail: React.FC<CharacterDetailProps> = ({ character, onBack }) => {
  const [selectedNormalAttackVariant, setSelectedNormalAttackVariant] = useState<string>('regular');
  const [selectedSkillVariants, setSelectedSkillVariants] = useState<Record<number, string>>({});
  const [selectedUltVariant, setSelectedUltVariant] = useState<string>('regular');
  
  // Global & card-level skill level toggles (default 10)
  const [globalSkillLevel, setGlobalSkillLevel] = useState<1 | 10>(10);
  const [cardSkillLevels, setCardSkillLevels] = useState<Record<string, 1 | 10>>({});

  const { isFavoriteChar, toggleFavoriteChar } = useJjkStore();
  const isFavorite = isFavoriteChar(character.id);

  const getEffectiveLevel = (cardKey: string): 1 | 10 => {
    return cardSkillLevels[cardKey] ?? globalSkillLevel;
  };

  const setCardLevel = (cardKey: string, lvl: 1 | 10) => {
    playLevelUp();
    setCardSkillLevels(prev => ({ ...prev, [cardKey]: lvl }));
  };

  // Helper to format text scaling between Lv 1 and Lv 10
  const formatSkillDescription = (desc1?: string, desc10?: string, level: 1 | 10 = 10) => {
    if (level === 10 && desc10) {
      return desc10;
    }
    if (level === 1 && desc1) {
      return desc1;
    }
    const text = desc10 || desc1 || '';
    if (!text) return '';
    if (level === 1) {
      return text.replace(/(\d+(?:\.\d+)?%?)\s*\(Lv 1\)\s*→\s*(\d+(?:\.\d+)?%?)\s*\(Lv 10\)/g, '$1');
    } else {
      return text.replace(/(\d+(?:\.\d+)?%?)\s*\(Lv 1\)\s*→\s*(\d+(?:\.\d+)?%?)\s*\(Lv 10\)/g, '$2');
    }
  };

  // Structured bullet renderer for skill effects
  const renderFormattedDescription = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5 text-xs sm:text-sm text-gray-200 leading-relaxed font-sans">
        {lines.map((rawLine, i) => {
          const line = rawLine.trim();
          if (!line) return <div key={i} className="h-1" />;
          
          if (/^(?:▼|▽|â–¼|\u00e2\u0096\u00bc)/.test(line)) {
            const clean = line.replace(/^(?:▼|▽|â–¼|\u00e2\u0096\u00bc)\s*/, '');
            return (
              <div key={i} className="text-purple-300 font-bold flex items-start gap-1.5 mt-2 first:mt-0">
                <span className="text-purple-400 text-xs mt-0.5 select-none">▼</span>
                <span>{clean}</span>
              </div>
            );
          }
          if (/^(?:※|\*|\u00e2\u0080\u00bb)/.test(line)) {
            const clean = line.replace(/^(?:※|\*|\u00e2\u0080\u00bb)\s*/, '');
            return (
              <div key={i} className="text-amber-300/90 text-xs italic pl-4 flex items-start gap-1 mt-1">
                <span className="select-none">※</span>
                <span>{clean}</span>
              </div>
            );
          }
          if (/^(?:·|•|-|\u00c2\u00b7)/.test(line)) {
            const clean = line.replace(/^(?:·|•|-|\u00c2\u00b7)\s*/, '');
            return (
              <div key={i} className="text-gray-300 pl-4 flex items-start gap-1.5">
                <span className="text-purple-400 select-none">•</span>
                <span>{clean}</span>
              </div>
            );
          }
          return (
            <div key={i} className="pl-3 text-gray-300">
              {line}
            </div>
          );
        })}
      </div>
    );
  };

  // Resolve Skill Priority item details (#1, #2, #3, #4)
  const getPriorityItemData = (item: number | string) => {
    let idx = typeof item === 'number' ? item : parseInt(item, 10);
    if (isNaN(idx)) {
      const s = String(item).toLowerCase();
      if (s.includes('ult') || s.includes('suprema')) idx = 3;
      else if (s.includes('3')) idx = 2;
      else if (s.includes('2')) idx = 1;
      else idx = 0;
    }

    if (idx === 2) {
      const s = character.skills && character.skills.length > 1 ? character.skills[1] : character.skills?.[0];
      return {
        label: 'Skill 3',
        name: s?.name || 'Skill 3',
        icon: s?.icon || s?.image_key || character.skills?.[1]?.variants?.[0]?.icon,
      };
    } else if (idx === 3) {
      return {
        label: 'Ultimate',
        name: character.ultimate?.name || 'Ultimate',
        icon: character.ultimate?.icon || character.ultimate?.image_key || character.ultimate?.variants?.[0]?.icon,
      };
    } else if (idx === 1) {
      const s = character.skills?.[0];
      return {
        label: 'Skill 2',
        name: s?.name || 'Skill 2',
        icon: s?.icon || s?.image_key || s?.variants?.[0]?.icon,
      };
    } else {
      return {
        label: 'Skill 1',
        name: character.normal_attack?.name || 'Skill 1',
        icon: character.normal_attack?.icon || character.normal_attack?.image_key || character.normal_attack?.variants?.[0]?.icon,
      };
    }
  };

  const priorityList = character.skill_priority && character.skill_priority.length > 0
    ? character.skill_priority
    : [2, 3, 1, 0];

  const imageSrc = getAssetUrl(character.image);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            playClick();
            onBack();
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#161126] hover:bg-[#201838] text-purple-300 hover:text-white border border-[#2b2149] transition-all text-sm font-medium shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Todos os personagens</span>
        </button>

        <button
          onClick={() => {
            playStarToggle(!isFavorite);
            toggleFavoriteChar(character.id);
          }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-xs transition-all shadow-md cursor-pointer ${
            isFavorite
              ? 'bg-amber-950/80 border-amber-500 text-amber-300'
              : 'bg-[#161126] border-[#2b2149] text-gray-400 hover:text-white'
          }`}
          title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
          <span>{isFavorite ? 'Favoritado' : 'Favoritar'}</span>
        </button>
      </div>

      {/* Hero Banner Section */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#120e22] via-[#17122e] to-[#0f0c1d] border border-[#2d2250] p-6 lg:p-8 shadow-2xl shadow-purple-950/50">
        <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
          {/* Card Art Frame */}
          <div className="relative w-full max-w-sm lg:max-w-md aspect-[16/10] rounded-xl overflow-hidden border-2 border-purple-500/40 shadow-xl shadow-purple-900/30 bg-[#0a0714] flex items-center justify-center group">
            <img 
              src={imageSrc} 
              alt={character.title}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                (e.target as HTMLImageElement).src = getAssetUrl();
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-3 right-3">
              <ElementBadge element={character.element} />
            </div>
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <RarityBadge rarity={character.rarity} />
              {character.limited && (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-950/80 border border-red-500/40 text-red-300">
                  Limitado
                </span>
              )}
            </div>
          </div>

          {/* Character Details & Title */}
          <div className="flex-1 space-y-4">
            <div>
              {character.epithet && (
                <p className="text-sm font-bold tracking-wide uppercase text-red-400 mb-1">
                  {character.epithet}
                </p>
              )}
              <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-white font-serif drop-shadow-md">
                {character.name.toUpperCase()}
              </h1>
            </div>

            {/* Badges Bar */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <RarityBadge rarity={character.rarity} />
              <ElementBadge element={character.element} />
              <TagBadge label={character.focus || 'Taijutsu'} variant="amber" />
              <TagBadge label={character.role || 'Attacker'} variant="purple" />
              {character.sp && (
                <span className="px-2.5 py-0.5 rounded-md text-xs font-black tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/20">
                  SP
                </span>
              )}
              {character.limited ? (
                <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-red-950/80 text-red-300 border border-red-500/50">
                  Limitado
                </span>
              ) : character.pool_status === 'waiting' ? (
                <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-950/80 text-amber-300 border border-amber-500/50" title="Banner Padrão: Aguardando adição ao Pool Permanente">
                  ⏳ Padrão (Aguardando Pool)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/50">
                  ✓ No Pool Padrão
                </span>
              )}
            </div>

            {/* Combat Tags */}
            {character.tags && character.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {character.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#1a1433] text-purple-200 border border-purple-800/40"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Sub Info */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pt-2 border-t border-[#251b40]">
              <span className="px-3 py-1 rounded-full bg-[#18122c] border border-[#2b2149] text-gray-300">
                🏫 {character.affiliation || 'Escola de Jiu-Jitsu de Tóquio'}
              </span>
              {character.release_date && character.release_date !== 'N/A' && (
                <span className="px-3 py-1 rounded-full bg-[#18122c] border border-[#2b2149] text-gray-300">
                  📅 Lançamento: {character.release_date}
                </span>
              )}
              <span className={`px-3 py-1 rounded-full border ${
                character.limited
                  ? 'bg-red-950/40 border-red-800/40 text-red-300'
                  : character.pool_status === 'waiting'
                  ? 'bg-amber-950/40 border-amber-800/40 text-amber-300'
                  : 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300'
              }`}>
                {character.limited
                  ? '🚫 Banner Limitado (Exclusivo)'
                  : character.pool_status === 'waiting'
                  ? '⏳ Banner Padrão (Aguardando Entrada no Pool)'
                  : '✨ Disponível no Pool Padrão Permanente'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Skills on Left (2/3), Stats on Right (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Habilidades */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-[#251b40] pb-3">
            <h2 className="text-xl font-bold tracking-wide text-purple-200 flex items-center gap-2">
              <Swords className="w-5 h-5 text-purple-400" />
              HABILIDADES
            </h2>

            {/* Global Skill Level Switcher */}
            <div className="flex items-center gap-1 bg-[#130f24] p-1 rounded-lg border border-[#2c224c]">
              <button
                onClick={() => {
                  playLevelUp();
                  setGlobalSkillLevel(1);
                  setCardSkillLevels({});
                }}
                className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  globalSkillLevel === 1 
                    ? 'bg-purple-600 text-white shadow-sm' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Nível 1
              </button>
              <button
                onClick={() => {
                  playLevelUp();
                  setGlobalSkillLevel(10);
                  setCardSkillLevels({});
                }}
                className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  globalSkillLevel === 10 
                    ? 'bg-purple-600 text-white shadow-sm' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Nível 10 (Máx)
              </button>
            </div>
          </div>

          {/* Ataque Básico (SKILL 1) */}
          {character.normal_attack && (() => {
            const na = character.normal_attack;
            const variants: SkillVariant[] = (na.variants && na.variants.length > 0)
              ? na.variants
              : [{
                  id: 'regular',
                  label: 'Base',
                  name: na.name,
                  cost: '0',
                  description: na.description,
                  description_10: na.description_10,
                  icon: na.icon || na.image_key,
                  combat_rates: character.combat_rates
                }];
            
            const activeVariant = variants.find(v => v.id === selectedNormalAttackVariant) || variants[0];
            const name = activeVariant.name;
            const icon = activeVariant.icon || activeVariant.image_key || na.icon || na.image_key;
            const combatRates = activeVariant.combat_rates || character.combat_rates;
            const effLevel = getEffectiveLevel('na');
            const desc = formatSkillDescription(activeVariant.description, activeVariant.description_10, effLevel);

            return (
              <div className="bg-[#120e24] border border-[#291f47] rounded-xl shadow-lg flex flex-row overflow-hidden hover:border-purple-500/40 transition-colors">
                {/* Left Vertical Tab Strip */}
                <div className="w-20 sm:w-24 shrink-0 flex flex-col border-r border-[#241a3e] bg-[#0c081d]">
                  {variants.map((v) => {
                    const isSel = (selectedNormalAttackVariant || 'regular') === v.id;
                    return (
                      <button
                        key={v.id}
                        onClick={() => {
                          playTransformSurge();
                          setSelectedNormalAttackVariant(v.id);
                        }}
                        className={`py-3 px-1 text-center text-xs font-extrabold transition-all cursor-pointer border-l-4 ${
                          isSel
                            ? v.id === 'sp'
                              ? 'bg-[#2a1c0d] text-amber-300 border-amber-400'
                              : v.id === 'changed'
                              ? 'bg-[#0e2133] text-cyan-300 border-cyan-400'
                              : 'bg-[#181230] text-white border-purple-400'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-[#140f28] border-transparent'
                        }`}
                      >
                        {v.label}
                      </button>
                    );
                  })}
                </div>

                {/* Right Main Content */}
                <div className="flex-1 p-4 sm:p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Skill Icon Thumbnail */}
                      <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-[#090614] border-2 border-purple-500/40 shrink-0 shadow-md flex items-center justify-center">
                        <img 
                          src={getSkillIconUrl(icon)} 
                          alt={name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getSkillIconUrl();
                          }}
                        />
                      </div>

                      {/* Title & Level Selector */}
                      <div>
                        <span className="text-[11px] uppercase font-bold tracking-wider text-purple-400 block">
                          SKILL 1 • ATAQUE BÁSICO
                        </span>
                        <h3 className="text-base sm:text-lg font-black text-white leading-tight mt-0.5">
                          {name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <button
                            onClick={() => setCardLevel('na', 1)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                              effLevel === 1 
                                ? 'bg-purple-600 text-white shadow-sm' 
                                : 'bg-[#150f29] text-gray-400 hover:text-white border border-[#2b1f4a]'
                            }`}
                          >
                            Lv.1
                          </button>
                          <button
                            onClick={() => setCardLevel('na', 10)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                              effLevel === 10 
                                ? 'bg-purple-600 text-white shadow-sm' 
                                : 'bg-[#150f29] text-gray-400 hover:text-white border border-[#2b1f4a]'
                            }`}
                          >
                            Lv.10
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* CE Cost Badge */}
                    <div className="shrink-0">
                      <div className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#0d2218] border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
                        <span>0</span>
                        <span className="text-emerald-400 text-xs">💧</span>
                      </div>
                    </div>
                  </div>

                  {/* Formatted Description */}
                  <div className="bg-[#0b0819] p-3.5 rounded-lg border border-[#1f1737]">
                    {renderFormattedDescription(desc)}
                  </div>

                  {/* Combat Rates Badges */}
                  {combatRates && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {combatRates.crit_rate && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#1a1430] text-purple-300 border border-purple-800/40">
                          Crit Rate {combatRates.crit_rate}
                        </span>
                      )}
                      {combatRates.crit_dmg && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#1a1430] text-purple-300 border border-purple-800/40">
                          Crit DMG {combatRates.crit_dmg}
                        </span>
                      )}
                      {combatRates.black_flash && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-950/60 text-red-300 border border-red-800/40">
                          Black Flash {combatRates.black_flash}
                        </span>
                      )}
                      {combatRates.black_flash_dmg && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-950/60 text-red-300 border border-red-800/40">
                          Black Flash DMG {combatRates.black_flash_dmg}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Command Skills (SKILL 2 & SKILL 3) */}
          {character.skills.map((skill, index) => {
            const slotDisplayNum = skill.slot ? (skill.slot === 1 ? 2 : 3) : index + 2;
            const slotLabel = `SKILL ${slotDisplayNum}`;
            const cardKey = `skill-${skill.slot || index + 1}`;
            
            const variants: SkillVariant[] = (skill.variants && skill.variants.length > 0)
              ? skill.variants
              : [{
                  id: 'regular',
                  label: 'Base',
                  name: skill.name,
                  cost: skill.cost || '20',
                  description: skill.description,
                  description_10: skill.description_10,
                  icon: skill.icon || skill.image_key,
                  combat_rates: character.combat_rates
                }];

            const currentVariantId = selectedSkillVariants[skill.slot] || 'regular';
            const activeVariant = variants.find(v => v.id === currentVariantId) || variants[0];
            const name = activeVariant.name;
            const cost = activeVariant.cost || skill.cost || '20';
            const icon = activeVariant.icon || activeVariant.image_key || skill.icon || skill.image_key;
            const combatRates = activeVariant.combat_rates || character.combat_rates;
            const effLevel = getEffectiveLevel(cardKey);
            const desc = formatSkillDescription(activeVariant.description, activeVariant.description_10, effLevel);

            return (
              <div 
                key={skill.slot || index} 
                className="bg-[#120e24] border border-[#291f47] rounded-xl shadow-lg flex flex-row overflow-hidden hover:border-purple-500/40 transition-colors"
              >
                {/* Left Vertical Tab Strip */}
                <div className="w-20 sm:w-24 shrink-0 flex flex-col border-r border-[#241a3e] bg-[#0c081d]">
                  {variants.map((v) => {
                    const isSel = currentVariantId === v.id;
                    return (
                      <button
                        key={v.id}
                        onClick={() => {
                          playTransformSurge();
                          setSelectedSkillVariants(prev => ({ ...prev, [skill.slot]: v.id }));
                        }}
                        className={`py-3.5 px-1 text-center text-xs font-extrabold transition-all cursor-pointer border-l-4 ${
                          isSel
                            ? v.id === 'sp'
                              ? 'bg-[#2a1c0d] text-amber-300 border-amber-400'
                              : v.id === 'changed2'
                              ? 'bg-[#0b2426] text-emerald-300 border-emerald-400'
                              : v.id === 'changed'
                              ? 'bg-[#0e2133] text-cyan-300 border-cyan-400'
                              : 'bg-[#181230] text-white border-purple-400'
                            : v.id === 'sp'
                            ? 'text-amber-500/70 hover:text-amber-300 hover:bg-[#1f150c] border-transparent'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-[#140f28] border-transparent'
                        }`}
                      >
                        {v.label}
                      </button>
                    );
                  })}
                </div>

                {/* Right Main Content */}
                <div className="flex-1 p-4 sm:p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Skill Icon Thumbnail */}
                      <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-[#090614] border-2 border-purple-500/40 shrink-0 shadow-md flex items-center justify-center">
                        <img 
                          src={getSkillIconUrl(icon)} 
                          alt={name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getSkillIconUrl();
                          }}
                        />
                      </div>

                      {/* Title & Level Selector */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] uppercase font-bold tracking-wider text-purple-400">
                            {slotLabel}
                          </span>
                          {activeVariant.id === 'sp' && (
                            <span className="px-2 py-0.2 rounded text-[10px] font-black bg-amber-950 border border-amber-500/50 text-amber-300">
                              SP UNLOCKED
                            </span>
                          )}
                        </div>
                        <h3 className="text-base sm:text-lg font-black text-white leading-tight mt-0.5">
                          {name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <button
                            onClick={() => setCardLevel(cardKey, 1)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                              effLevel === 1 
                                ? 'bg-purple-600 text-white shadow-sm' 
                                : 'bg-[#150f29] text-gray-400 hover:text-white border border-[#2b1f4a]'
                            }`}
                          >
                            Lv.1
                          </button>
                          <button
                            onClick={() => setCardLevel(cardKey, 10)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                              effLevel === 10 
                                ? 'bg-purple-600 text-white shadow-sm' 
                                : 'bg-[#150f29] text-gray-400 hover:text-white border border-[#2b1f4a]'
                            }`}
                          >
                            Lv.10
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* CE Cost Badge */}
                    <div className="shrink-0">
                      {cost && cost !== '0' ? (
                        <div className="px-3 py-1 rounded-full text-xs font-black bg-[#0d1e38] border border-cyan-500/40 text-cyan-300 flex items-center gap-1 shadow-sm">
                          <span>{cost}</span>
                          <span className="text-cyan-400 text-xs">💧</span>
                        </div>
                      ) : (
                        <div className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#0d2218] border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
                          <span>0</span>
                          <span className="text-emerald-400 text-xs">💧</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Formatted Description */}
                  <div className="bg-[#0b0819] p-3.5 rounded-lg border border-[#1f1737]">
                    {renderFormattedDescription(desc)}
                  </div>

                  {/* Combat Rates Badges */}
                  {combatRates && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {combatRates.crit_rate && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#1a1430] text-purple-300 border border-purple-800/40">
                          Crit Rate {combatRates.crit_rate}
                        </span>
                      )}
                      {combatRates.crit_dmg && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#1a1430] text-purple-300 border border-purple-800/40">
                          Crit DMG {combatRates.crit_dmg}
                        </span>
                      )}
                      {combatRates.black_flash && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-950/60 text-red-300 border border-red-800/40">
                          Black Flash {combatRates.black_flash}
                        </span>
                      )}
                      {combatRates.black_flash_dmg && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-950/60 text-red-300 border border-red-800/40">
                          Black Flash DMG {combatRates.black_flash_dmg}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Ultimate Skill */}
          {character.ultimate && character.ultimate.name && (() => {
            const ult = character.ultimate;
            const variants: SkillVariant[] = (ult.variants && ult.variants.length > 0)
              ? ult.variants
              : [{
                  id: 'regular',
                  label: 'Base',
                  name: ult.name,
                  cost: '0',
                  description: ult.description,
                  description_10: ult.description_10,
                  icon: ult.icon || ult.image_key,
                  combat_rates: character.combat_rates
                }];

            const activeVariant = variants.find(v => v.id === selectedUltVariant) || variants[0];
            const name = activeVariant.name;
            const icon = activeVariant.icon || activeVariant.image_key || ult.icon || ult.image_key;
            const combatRates = activeVariant.combat_rates || character.combat_rates;
            const effLevel = getEffectiveLevel('ult');
            const desc = formatSkillDescription(activeVariant.description, activeVariant.description_10, effLevel);

            return (
              <div className="bg-gradient-to-b from-[#18112e] to-[#120d24] border-2 border-purple-600/40 rounded-xl shadow-xl shadow-purple-950/40 flex flex-row overflow-hidden">
                {/* Left Vertical Tab Strip */}
                <div className="w-20 sm:w-24 shrink-0 flex flex-col border-r border-[#241a3e] bg-[#0c081d]">
                  {variants.map((v) => {
                    const isSel = (selectedUltVariant || 'regular') === v.id;
                    return (
                      <button
                        key={v.id}
                        onClick={() => {
                          if (v.id === 'changed' || /domain|expans[aã]o|ryoiki/i.test(v.name || '')) {
                            playDomainExpansion();
                          } else {
                            playTransformSurge();
                          }
                          setSelectedUltVariant(v.id);
                        }}
                        className={`py-3.5 px-1 text-center text-xs font-extrabold transition-all cursor-pointer border-l-4 ${
                          isSel
                            ? v.id === 'changed'
                              ? 'bg-[#0e2133] text-cyan-300 border-cyan-400'
                              : 'bg-[#181230] text-amber-300 border-amber-400'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-[#140f28] border-transparent'
                        }`}
                      >
                        {v.label}
                      </button>
                    );
                  })}
                </div>

                {/* Right Main Content */}
                <div className="flex-1 p-4 sm:p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Ultimate Icon Thumbnail */}
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-[#090614] border-2 border-amber-500/50 shrink-0 shadow-lg shadow-amber-950/50 flex items-center justify-center">
                        <img 
                          src={getSkillIconUrl(icon)} 
                          alt={name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getSkillIconUrl();
                          }}
                        />
                      </div>

                      {/* Title & Level Selector */}
                      <div>
                        <span className="text-xs uppercase font-extrabold tracking-wider text-amber-400 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          ULTIMATE SKILL • TÉCNICA SUPREMA
                        </span>
                        <h3 className="text-lg sm:text-xl font-black text-white leading-tight mt-0.5">
                          {name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <button
                            onClick={() => setCardLevel('ult', 1)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                              effLevel === 1 
                                ? 'bg-purple-600 text-white shadow-sm' 
                                : 'bg-[#150f29] text-gray-400 hover:text-white border border-[#2b1f4a]'
                            }`}
                          >
                            Lv.1
                          </button>
                          <button
                            onClick={() => setCardLevel('ult', 10)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                              effLevel === 10 
                                ? 'bg-purple-600 text-white shadow-sm' 
                                : 'bg-[#150f29] text-gray-400 hover:text-white border border-[#2b1f4a]'
                            }`}
                          >
                            Lv.10
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Special Gauge Badge */}
                    <div className="shrink-0">
                      <div className="px-3 py-1 rounded-full text-xs font-bold bg-amber-950/60 border border-amber-500/40 text-amber-300">
                        Gauge: {character.stats.special_gauge}
                      </div>
                    </div>
                  </div>

                  {/* Formatted Description */}
                  <div className="bg-[#0b0819] p-4 rounded-lg border border-[#2c204d]">
                    {renderFormattedDescription(desc)}
                  </div>

                  {/* Combat Rates Badges */}
                  {combatRates && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {combatRates.crit_rate && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#1a1430] text-purple-300 border border-purple-800/40">
                          Crit Rate {combatRates.crit_rate}
                        </span>
                      )}
                      {combatRates.crit_dmg && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#1a1430] text-purple-300 border border-purple-800/40">
                          Crit DMG {combatRates.crit_dmg}
                        </span>
                      )}
                      {combatRates.black_flash && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-950/60 text-red-300 border border-red-800/40">
                          Black Flash {combatRates.black_flash}
                        </span>
                      )}
                      {combatRates.black_flash_dmg && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-950/60 text-red-300 border border-red-800/40">
                          Black Flash DMG {combatRates.black_flash_dmg}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Combo Ultimate */}
                  {character.ultimate.combo && (
                    <div className="mt-2 p-3 rounded-lg bg-indigo-950/30 border border-indigo-500/30 space-y-1">
                      <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider block">
                        ⚡ Efeito em Combo de Especial:
                      </span>
                      <p className="text-xs text-gray-300 whitespace-pre-line">
                        {character.ultimate.combo}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Passives / Auto Skills */}
          {((character.auto_skills && character.auto_skills.length > 0) || (character.passives && character.passives.length > 0)) && (() => {
            const passiveItems = character.auto_skills && character.auto_skills.length > 0 ? character.auto_skills : (character.passives || []);
            return (
            <div className="space-y-4 pt-4 border-t border-[#251b40]">
              <h2 className="text-xl font-bold tracking-wide text-purple-200 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                HABILIDADES AUTOMÁTICAS (PASSIVAS)
              </h2>

              <div className="grid grid-cols-1 gap-3">
                {passiveItems.map((p, idx) => {
                  const hasSP = !!p.sp_description;
                  const spStateKey = `passive-${idx}`;
                  const isShowingSP = (selectedSkillVariants as Record<string, string>)[spStateKey] === 'sp';
                  const displayDesc = isShowingSP && p.sp_description ? p.sp_description : p.description;
                  const spIcon = p.sp?.icon || p.sp?.image_key;
                  const displayIcon = isShowingSP && spIcon ? spIcon : (p.icon || p.image_key);

                  if (!hasSP) {
                    return (
                      <div 
                        key={idx} 
                        className="bg-[#120e24] border border-[#251b40] rounded-xl p-4 flex items-start gap-3 hover:border-purple-500/30 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#0a0718] border border-purple-500/30 shrink-0 flex items-center justify-center">
                          <img 
                            src={getSkillIconUrl(p.icon || p.image_key)} 
                            alt={p.name} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = getSkillIconUrl();
                            }}
                          />
                        </div>
                        <div className="flex-1 space-y-1">
                          <h4 className="text-sm font-bold text-purple-300">
                            {p.name}
                          </h4>
                          {renderFormattedDescription(p.description)}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={idx} className="bg-[#120e24] border border-[#251b40] rounded-xl shadow-lg flex flex-row overflow-hidden hover:border-purple-500/40 transition-colors">
                      {/* Left Vertical Tab Strip */}
                      <div className="w-20 sm:w-24 shrink-0 flex flex-col border-r border-[#241a3e] bg-[#0c081d]">
                        <button
                          onClick={() => {
                            playTransformSurge();
                            setSelectedSkillVariants(prev => ({ ...prev, [spStateKey]: 'base' }));
                          }}
                          className={`py-3 px-1 text-center text-xs font-extrabold transition-all cursor-pointer border-l-4 ${
                            !isShowingSP
                              ? 'bg-[#181230] text-white border-purple-400'
                              : 'text-gray-400 hover:text-gray-200 hover:bg-[#140f28] border-transparent'
                          }`}
                        >
                          Base
                        </button>
                        <button
                          onClick={() => {
                            playBlackFlash();
                            setSelectedSkillVariants(prev => ({ ...prev, [spStateKey]: 'sp' }));
                          }}
                          className={`py-3 px-1 text-center text-xs font-extrabold transition-all cursor-pointer border-l-4 ${
                            isShowingSP
                              ? 'bg-[#2a1c0d] text-amber-300 border-amber-400'
                              : 'text-amber-500/70 hover:text-amber-300 hover:bg-[#1f150c] border-transparent'
                          }`}
                        >
                          SP
                        </button>
                      </div>

                      {/* Right Main Content */}
                      <div className="flex-1 p-4 space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#0a0718] border border-purple-500/30 shrink-0 flex items-center justify-center">
                            <img 
                              src={getSkillIconUrl(displayIcon)} 
                              alt={p.name} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = getSkillIconUrl();
                              }}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-purple-300">
                                {isShowingSP && p.sp?.name ? p.sp.name : p.name}
                              </h4>
                              {isShowingSP && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-950 border border-amber-500/50 text-amber-300">
                                  SP UNLOCKED
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="bg-[#0b0819] p-3 rounded-lg border border-[#1f1737]">
                          {renderFormattedDescription(displayDesc)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            );
          })()}
        </div>

        {/* Right Column: Estatísticas e Prioridade de Habilidades */}
        <div className="space-y-6">
          {/* Skill Priority Widget */}
          <div className="bg-[#120e24] border border-[#291f47] rounded-xl p-5 shadow-lg space-y-3.5">
            <h2 className="text-sm font-black tracking-wider uppercase text-purple-300 border-b border-[#251b40] pb-2.5 flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              SKILL PRIORITY
            </h2>
            
            <div className="grid grid-cols-4 gap-2">
              {priorityList.map((item, idx) => {
                const data = getPriorityItemData(item);
                return (
                  <div 
                    key={idx} 
                    className="bg-[#16102d] border border-purple-900/40 rounded-xl p-2 flex flex-col items-center text-center group hover:border-purple-500/60 transition-colors"
                  >
                    <span className="text-[11px] font-black text-purple-400 mb-1.5">
                      #{idx + 1}
                    </span>
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#090614] border border-purple-500/30 mb-1.5 shrink-0 flex items-center justify-center">
                      <img 
                        src={getSkillIconUrl(data.icon)} 
                        alt={data.label}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getSkillIconUrl();
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-gray-300 truncate w-full" title={data.name}>
                      {data.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-gray-400 leading-normal pt-1">
              Ordem recomendada para investimento de materiais e livros de técnicas amaldiçoadas.
            </p>
          </div>

          {/* Stats Box */}
          <div className="bg-[#120e24] border border-[#291f47] rounded-xl p-5 shadow-lg space-y-4">
            <h2 className="text-lg font-bold tracking-wide text-purple-200 border-b border-[#251b40] pb-2">
              ESTATÍSTICAS MÁXIMAS
            </h2>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between items-center py-1 border-b border-[#1c1533]">
                <span className="text-gray-400">HP Máximo</span>
                <span className="font-mono font-bold text-white">{character.stats.hp}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#1c1533]">
                <span className="text-gray-400">Taijutsu (Ataque Físico)</span>
                <span className="font-mono font-bold text-red-400">{character.stats.attack}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#1c1533]">
                <span className="text-gray-400">Jujutsu (Poder Amaldiçoado)</span>
                <span className="font-mono font-bold text-blue-400">{character.stats.jujutsu}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#1c1533]">
                <span className="text-gray-400">Energia Inicial</span>
                <span className="font-mono font-bold text-purple-300">{character.stats.initial_energy} CE</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#1c1533]">
                <span className="text-gray-400">Energia Máxima</span>
                <span className="font-mono font-bold text-purple-300">{character.stats.max_energy} CE</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-400">Medidor Supremo</span>
                <span className="font-mono font-bold text-amber-400">{character.stats.special_gauge}</span>
              </div>
            </div>

            {/* Special info traits */}
            <div className="pt-3 border-t border-[#251b40] space-y-2">
              <span className="text-xs uppercase font-bold text-gray-400 block">
                Características do Personagem:
              </span>
              <p className="text-xs text-yellow-300/90 leading-relaxed bg-yellow-950/20 border border-yellow-800/30 p-2.5 rounded-lg">
                🛡️ Dados de combate sincronizados com os registros de técnicas de Phantom Parade.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
