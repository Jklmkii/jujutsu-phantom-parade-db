import React, { useState } from 'react';
import type { Character } from '../types';
import { ElementBadge, RarityBadge, TagBadge } from './Badges';
import { ArrowLeft, Zap, Shield, Sparkles, Swords, Star } from 'lucide-react';
import { useJjkStore } from '../store/useJjkStore';
import { playClick, playStarToggle, playTransformSurge, playLevelUp } from '../utils/sound';

interface CharacterDetailProps {
  character: Character;
  onBack: () => void;
}

export const CharacterDetail: React.FC<CharacterDetailProps> = ({ character, onBack }) => {
  const [skillMode, setSkillMode] = useState<'base' | 'changed'>('base');
  const [skillLevel, setSkillLevel] = useState<1 | 10>(10);
  const { isFavoriteChar, toggleFavoriteChar } = useJjkStore();

  const isFavorite = isFavoriteChar(character.id);

  // Helper to format text scaling between Lv 1 and Lv 10
  const formatSkillText = (text: string, level: 1 | 10) => {
    if (!text) return '';
    if (level === 1) {
      return text.replace(/(\d+(?:\.\d+)?%?)\s*\(Lv 1\)\s*→\s*(\d+(?:\.\d+)?%?)\s*\(Lv 10\)/g, '$1');
    } else {
      return text.replace(/(\d+(?:\.\d+)?%?)\s*\(Lv 1\)\s*→\s*(\d+(?:\.\d+)?%?)\s*\(Lv 10\)/g, '$2');
    }
  };

  const imageSrc = character.image 
    ? `/assets/${character.image}`
    : '/assets/placeholder.png';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            playClick();
            onBack();
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#161126] hover:bg-[#201838] text-purple-300 hover:text-white border border-[#2b2149] transition-all text-sm font-medium shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Todos os personagens</span>
        </button>

        <button
          onClick={() => {
            playStarToggle(!isFavorite);
            toggleFavoriteChar(character.id);
          }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-xs transition-all shadow-md ${
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
                // Fallback image if gif not found
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80';
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
              {character.limited && <TagBadge label="Limitado" variant="default" />}
            </div>

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
                  setSkillLevel(1);
                }}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  skillLevel === 1 
                    ? 'bg-purple-600 text-white shadow-sm' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Nível 1
              </button>
              <button
                onClick={() => {
                  playLevelUp();
                  setSkillLevel(10);
                }}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  skillLevel === 10 
                    ? 'bg-purple-600 text-white shadow-sm' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Nível 10 (Máx)
              </button>
            </div>
          </div>

          {/* Ataque Básico */}
          {character.normal_attack && (
            <div className="bg-[#120e24] border border-[#291f47] rounded-xl p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase font-bold tracking-wider text-gray-400">
                    Ataque Básico
                  </span>
                  <h3 className="text-lg font-bold text-white">
                    {character.normal_attack.name}
                  </h3>
                </div>
              </div>
              <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line bg-[#0c0919] p-3.5 rounded-lg border border-[#1f1737]">
                {formatSkillText(character.normal_attack.description, skillLevel)}
              </div>
            </div>
          )}

          {/* Command Skills */}
          {character.skills.map((skill) => {
            const hasChanged = !!skill.changed;
            const currentSkill = (character.has_transformation && skillMode === 'changed' && skill.changed) 
              ? skill.changed 
              : skill;

            return (
              <div 
                key={skill.slot} 
                className="relative bg-[#120e24] border border-[#291f47] rounded-xl shadow-lg flex overflow-hidden group hover:border-purple-500/40 transition-colors"
              >
                {/* Vertical Mode Selector if Transformation Exists */}
                {character.has_transformation && (
                  <div className="w-16 min-w-[64px] bg-[#0c081a] border-r border-[#251b40] flex flex-col py-3 px-1 items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        playTransformSurge();
                        setSkillMode('base');
                      }}
                      className={`w-full py-2 rounded text-[11px] font-black uppercase transition-all tracking-wider ${
                        skillMode === 'base'
                          ? 'bg-purple-700 text-white shadow-md'
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      Base
                    </button>
                    <button
                      onClick={() => {
                        playTransformSurge();
                        setSkillMode('changed');
                      }}
                      className={`w-full py-2 rounded text-[11px] font-black uppercase transition-all tracking-wider ${
                        skillMode === 'changed'
                          ? 'bg-gradient-to-b from-red-600 to-red-800 text-white shadow-md shadow-red-900/50'
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      Mudado
                    </button>
                  </div>
                )}

                {/* Skill Content */}
                <div className="flex-1 p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] uppercase font-bold tracking-wider text-purple-400">
                          Habilidade {skill.slot}
                        </span>
                        {skillMode === 'changed' && hasChanged && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 border border-red-500/40 text-red-300">
                            {character.transform_name || 'Transformado'}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-white">
                        {currentSkill.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      {currentSkill.cost && currentSkill.cost !== '0' && (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-950/60 border border-purple-600/40 text-purple-300">
                          ⚡ {currentSkill.cost} CE
                        </span>
                      )}
                      {currentSkill.cost === '0' && (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-950/60 border border-emerald-600/40 text-emerald-300">
                          ⚡ 0 CE
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Skill Description */}
                  <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line bg-[#0c0919] p-3.5 rounded-lg border border-[#1f1737]">
                    {formatSkillText(currentSkill.description, skillLevel)}
                  </div>

                  {/* Combat Rate Badges (Bottom of skill) */}
                  {character.combat_rates && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {character.combat_rates.crit_rate && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#1a1430] text-purple-300 border border-purple-800/30">
                          Taxa Crítica: {character.combat_rates.crit_rate}
                        </span>
                      )}
                      {character.combat_rates.crit_dmg && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#1a1430] text-purple-300 border border-purple-800/30">
                          Dano Crítico: {character.combat_rates.crit_dmg}
                        </span>
                      )}
                      {character.combat_rates.black_flash && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-950/50 text-red-300 border border-red-800/30">
                          ⚡ Flash Negro: {character.combat_rates.black_flash}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Ultimate Skill */}
          {character.ultimate && character.ultimate.name && (
            <div className="bg-gradient-to-b from-[#18112e] to-[#120d24] border-2 border-purple-600/40 rounded-xl p-5 shadow-xl shadow-purple-950/40 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-extrabold tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    TÉCNICA SUPREMA (ULTIMATE)
                  </span>
                  <h3 className="text-xl font-black text-white">
                    {character.ultimate.name}
                  </h3>
                </div>
                <div className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-950/60 border border-amber-500/40 text-amber-300">
                  Special: {character.stats.special_gauge}
                </div>
              </div>

              <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-line bg-[#0c0919] p-4 rounded-lg border border-[#2c204d]">
                {formatSkillText(character.ultimate.description, skillLevel)}
              </div>

              {character.ultimate.combo && (
                <div className="mt-3 p-3.5 rounded-lg bg-indigo-950/30 border border-indigo-500/30 space-y-1">
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider block">
                    ⚡ Efeito em Combo de Especial:
                  </span>
                  <p className="text-xs text-gray-300 whitespace-pre-line">
                    {character.ultimate.combo}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Passives */}
          {character.passives && character.passives.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-[#251b40]">
              <h2 className="text-xl font-bold tracking-wide text-purple-200 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                HABILIDADES AUTOMÁTICAS (PASSIVAS)
              </h2>

              <div className="grid grid-cols-1 gap-3">
                {character.passives.map((p, idx) => (
                  <div 
                    key={idx} 
                    className="bg-[#120e24] border border-[#251b40] rounded-xl p-4 space-y-1.5"
                  >
                    <h4 className="text-sm font-bold text-purple-300 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      {p.name}
                    </h4>
                    <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line pl-4">
                      {p.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Estatísticas e Recomendações */}
        <div className="space-y-6">
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
                🛡️ Resistente a veneno e dano à alma. Capaz de desferir ataques com propriedades de Flash Negro.
              </p>
            </div>
          </div>

          {/* Skill Priority */}
          <div className="bg-[#120e24] border border-[#291f47] rounded-xl p-5 shadow-lg space-y-3">
            <h2 className="text-sm font-bold tracking-wide uppercase text-purple-300 border-b border-[#251b40] pb-2 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-purple-400" />
              PRIORIDADE DE HABILIDADES
            </h2>
            <div className="flex items-center gap-2">
              {(character.skill_priority || ['Habilidade 2', 'Habilidade 3', 'Habilidade 1']).map((item, idx) => (
                <div key={idx} className="flex-1 bg-[#1a1433] border border-purple-900/40 p-2 rounded-lg text-center">
                  <span className="block text-[10px] font-bold text-purple-400 uppercase">
                    {idx + 1}º Foco
                  </span>
                  <span className="text-xs font-bold text-white">
                    {item}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-gray-400">
              Ordem recomendada para investimento de materiais e livros de técnicas amaldiçoadas.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
