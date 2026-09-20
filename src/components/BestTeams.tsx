import React, { useState } from 'react';
import type { Character, Memory, MetaTeam } from '../types';
import { useJjkStore, type CustomTeam } from '../store/useJjkStore';
import { ElementBadge, RarityBadge } from './Badges';
import { 
  Shield, 
  Plus, 
  Trash2, 
  Users, 
  Edit3, 
  Copy, 
  X, 
  Search, 
  Sparkles,
  BookOpen,
  UserPlus,
  Sliders,
  Flame,
  Moon,
  Ghost,
  Skull,
  Download
} from 'lucide-react';
import { 
  playClick, 
  playSelect,
  playMemoryEquip,
  playBreakShatter,
  playTeamSynergyPulse,
  playSuccessFanfare,
  playTrashDelete
} from '../utils/sound';
import { getAssetUrl, getStaticThumbUrl, getAssetPath } from '../utils/assets';
import { useTranslation } from '../i18n';
import metaTeamsData from '../data/meta_teams.json';
import { exportTeamAsImage } from '../utils/exportImage';

interface BestTeamsProps {
  characters: Character[];
  memories: Memory[];
  onSelectCharacter: (char: Character) => void;
}

type PickerMode = 'character' | 'memory' | null;
type TeamViewMode = 'meta' | 'custom';

interface ActivePickerState {
  teamId: string;
  slotNumber: number;
  mode: PickerMode;
}

export const BestTeams: React.FC<BestTeamsProps> = ({ 
  characters, 
  memories, 
  onSelectCharacter 
}) => {
  const { language } = useTranslation();
  const { teams, addTeam, updateTeam, deleteTeam } = useJjkStore();
  const [viewMode, setViewMode] = useState<TeamViewMode>('meta');
  const [selectedMetaElement, setSelectedMetaElement] = useState<string>('Blue');
  const [selectedMetaType, setSelectedMetaType] = useState<string>('Taijutsu');

  // Team creation / edit modal
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [teamNameInput, setTeamNameInput] = useState('');
  const [teamDescInput, setTeamDescInput] = useState('');

  // Slot picker modal state (Character or Memory)
  const [picker, setPicker] = useState<ActivePickerState | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerElementFilter, setPickerElementFilter] = useState<string>('ALL');
  const [pickerRarityFilter, setPickerRarityFilter] = useState<string>('ALL');

  const metaTeams = metaTeamsData as MetaTeam[];

  const currentMetaTeamsForElement = metaTeams.filter(
    (t) => t.element.toLowerCase() === selectedMetaElement.toLowerCase()
  );

  const activeMetaTeam = currentMetaTeamsForElement.find(
    (t) => t.label.toLowerCase() === selectedMetaType.toLowerCase()
  ) || currentMetaTeamsForElement[0];

  const getCharById = (id: string | null) => {
    if (!id) return null;
    return characters.find((c) => c.id === id || c.title === id);
  };

  const getMemoryById = (id: string | null) => {
    if (!id) return null;
    return memories.find((m) => m.id === id || m.title === id);
  };

  // Open modal to create team
  const handleOpenCreateModal = () => {
    setEditingTeamId(null);
    setTeamNameInput('');
    setTeamDescInput('');
    setShowTeamModal(true);
  };

  // Open modal to edit existing team details
  const handleOpenEditModal = (team: CustomTeam) => {
    setEditingTeamId(team.id);
    setTeamNameInput(team.name);
    setTeamDescInput(team.description || '');
    setShowTeamModal(true);
  };

  // Save team create / edit
  const handleSaveTeamModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamNameInput.trim()) return;

    if (editingTeamId) {
      const existing = teams.find((t) => t.id === editingTeamId);
      if (existing) {
        updateTeam({
          ...existing,
          name: teamNameInput.trim(),
          description: teamDescInput.trim() || 'Equipe customizada criada pelo jogador.',
        });
        playClick();
      }
    } else {
      const newTeam: CustomTeam = {
        id: 'team_' + Date.now(),
        name: teamNameInput.trim(),
        description: teamDescInput.trim() || 'Equipe customizada criada pelo jogador.',
        members: [
          { slot: 1, characterId: null, memoryId: null },
          { slot: 2, characterId: null, memoryId: null },
          { slot: 3, characterId: null, memoryId: null },
          { slot: 4, characterId: null, memoryId: null },
          { slot: 5, characterId: null, memoryId: null },
        ]
      };
      addTeam(newTeam);
      playClick();
    }

    setShowTeamModal(false);
  };

  // Clone team
  const handleDuplicateTeam = (team: CustomTeam) => {
    const cloned: CustomTeam = {
      ...team,
      id: 'team_' + Date.now(),
      name: `${team.name} (Cópia)`,
      members: team.members.map((m) => ({ ...m })),
    };
    addTeam(cloned);
    playTeamSynergyPulse();
  };

  // Import Meta Team into Custom Teams
  const handleImportMetaTeam = (meta: MetaTeam) => {
    playSuccessFanfare();
    const importedTeam: CustomTeam = {
      id: 'team_meta_' + Date.now(),
      name: `Meta ${meta.element} - ${meta.label}`,
      description: `Formação oficial recomendada do JJKPPDB focada em sinergia ${meta.element} (${meta.label}).`,
      members: meta.slots.map((s, idx) => ({
        slot: idx + 1,
        characterId: s.main.characterId || null,
        memoryId: null
      }))
    };
    addTeam(importedTeam);
    setViewMode('custom');
  };

  // Assign or remove character from team slot
  const handleSelectCharacterForSlot = (charId: string | null) => {
    if (!picker) return;
    const team = teams.find((t) => t.id === picker.teamId);
    if (!team) return;

    const updatedMembers = team.members.map((m) => {
      if (m.slot === picker.slotNumber) {
        return { ...m, characterId: charId };
      }
      return m;
    });

    updateTeam({ ...team, members: updatedMembers });
    if (charId) {
      playSelect();
    } else {
      playBreakShatter();
    }
    setPicker(null);
  };

  // Assign or remove memory from team slot
  const handleSelectMemoryForSlot = (memId: string | null) => {
    if (!picker) return;
    const team = teams.find((t) => t.id === picker.teamId);
    if (!team) return;

    const updatedMembers = team.members.map((m) => {
      if (m.slot === picker.slotNumber) {
        return { ...m, memoryId: memId };
      }
      return m;
    });

    updateTeam({ ...team, members: updatedMembers });
    if (memId) {
      playMemoryEquip();
    } else {
      playBreakShatter();
    }
    setPicker(null);
  };

  // Open picker modal
  const openPicker = (teamId: string, slotNumber: number, mode: PickerMode) => {
    setPicker({ teamId, slotNumber, mode });
    setPickerSearch('');
    setPickerElementFilter('ALL');
    setPickerRarityFilter('ALL');
    playClick();
  };

  // Filtered characters for picker
  const filteredPickerChars = characters.filter((c) => {
    const matchesSearch = !pickerSearch || 
      c.name.toLowerCase().includes(pickerSearch.toLowerCase()) || 
      c.title.toLowerCase().includes(pickerSearch.toLowerCase()) ||
      c.card_name.toLowerCase().includes(pickerSearch.toLowerCase());
    const matchesElement = pickerElementFilter === 'ALL' || c.element.toLowerCase() === pickerElementFilter.toLowerCase();
    const matchesRarity = pickerRarityFilter === 'ALL' || c.rarity === pickerRarityFilter;
    return matchesSearch && matchesElement && matchesRarity;
  });

  // Filtered memories for picker
  const filteredPickerMems = memories.filter((m) => {
    const matchesSearch = !pickerSearch || m.title.toLowerCase().includes(pickerSearch.toLowerCase());
    const matchesRarity = pickerRarityFilter === 'ALL' || m.rarity === pickerRarityFilter;
    return matchesSearch && matchesRarity;
  });

  const getElementIcon = (elem: string) => {
    switch (elem.toLowerCase()) {
      case 'blue': return <Moon className="w-4 h-4 text-blue-400" />;
      case 'red': return <Flame className="w-4 h-4 text-red-400" />;
      case 'green': return <Ghost className="w-4 h-4 text-emerald-400" />;
      case 'yellow': return <Skull className="w-4 h-4 text-amber-400" />;
      default: return <Shield className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#251b40] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
              JJKPPDB Official Meta Teams
            </span>
          </div>
          <h1 className="text-3xl font-black text-white font-serif tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8 text-indigo-400" />
            {language === 'pt' ? 'COMPOSIÇÕES DE EQUIPE (BEST TEAMS)' : 'BEST TEAM FORMATIONS'}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {language === 'pt'
              ? 'Consulte as composições ideais da meta (Taijutsu e Jujutsu) para cada elemento ou monte suas equipes personalizadas com memórias.'
              : 'Browse top meta compositions (Taijutsu and Jujutsu) for each element or build custom squads with memories.'}
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-2 bg-[#120d26] p-1.5 rounded-xl border border-[#2b1f4c]">
          <button
            onClick={() => {
              playClick();
              setViewMode('meta');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'meta'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            {language === 'pt' ? 'Times Meta (JJKPPDB)' : 'Meta Teams (JJKPPDB)'}
          </button>
          <button
            onClick={() => {
              playClick();
              setViewMode('custom');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'custom'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            {language === 'pt' ? 'Meus Times Customizados' : 'Custom Teams'}
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-black/40 text-[10px]">
              {teams.length}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: OFFICIAL META TEAMS (JJKPPDB)                                     */}
      {/* ========================================================================= */}
      {viewMode === 'meta' && activeMetaTeam && (
        <div className="space-y-6">
          {/* Element Selection Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#120d24] border border-[#231a40] p-4 rounded-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2">
                {language === 'pt' ? 'Elemento:' : 'Element:'}
              </span>
              {[
                { id: 'Blue', label: language === 'pt' ? 'Noite (Azul)' : 'Blue (蒼)' },
                { id: 'Red', label: language === 'pt' ? 'Chamas (Vermelho)' : 'Red (幻)' },
                { id: 'Green', label: language === 'pt' ? 'Fantasma (Verde)' : 'Green (夜)' },
                { id: 'Yellow', label: language === 'pt' ? 'Decaimento (Amarelo)' : 'Yellow (行)' },
              ].map((el) => (
                <button
                  key={el.id}
                  onClick={() => {
                    playClick();
                    setSelectedMetaElement(el.id);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedMetaElement === el.id
                      ? 'bg-[#221644] text-white border border-purple-500/60 shadow-lg shadow-purple-950/40 ring-1 ring-purple-400/40'
                      : 'bg-[#0e0a1c] text-gray-400 hover:text-gray-200 border border-[#20183b]'
                  }`}
                >
                  {getElementIcon(el.id)}
                  <span>{el.label}</span>
                </button>
              ))}
            </div>

            {/* Formation Type: Taijutsu vs Jujutsu */}
            <div className="flex items-center gap-1.5 bg-[#0a0714] p-1 rounded-xl border border-[#251a44]">
              {currentMetaTeamsForElement.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    playClick();
                    setSelectedMetaType(t.label);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeMetaTeam.id === t.id
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <span>{t.label}</span>
                  {t.best && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                      ★ Meta
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Active Meta Team Card */}
          <div className="bg-[#120e24] border border-[#291f47] rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#201838] pb-5">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
                    {getElementIcon(activeMetaTeam.element)}
                    {language === 'pt' ? 'Equipe Meta:' : 'Meta Team:'} {activeMetaTeam.element} ({activeMetaTeam.label})
                  </h2>
                  {activeMetaTeam.best && (
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-yellow-300 border border-yellow-400/50 shadow-sm">
                      {language === 'pt' ? '★ Formação Principal Recomendada' : '★ Top Recommended Formation'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {language === 'pt'
                    ? 'Composição ideal de 5 posições estratégicas desenvolvida pela comunidade do JJKPPDB com alternativas viáveis.'
                    : 'Ideal 5-position tactical layout developed by the JJKPPDB community with viable alternatives.'}
                </p>
              </div>

              {/* Import Button */}
              <button
                onClick={() => handleImportMetaTeam(activeMetaTeam)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-900/40 transition-all cursor-pointer shrink-0"
                title={language === 'pt' ? 'Copiar esta formação para a aba Meus Times Customizados para editar e equipar memórias' : 'Copy this formation to Custom Teams to edit and equip memories'}
              >
                <Download className="w-4 h-4" />
                <span>{language === 'pt' ? 'Importar para Meus Times' : 'Import to Custom Teams'}</span>
              </button>
            </div>

            {/* 5 Slots Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {activeMetaTeam.slots.map((slot, idx) => {
                const localMain = characters.find((c) => c.id === slot.main.characterId);
                const isSubSlot = idx === 4;

                return (
                  <div
                    key={idx}
                    className={`rounded-2xl border p-4 flex flex-col space-y-3.5 transition-all ${
                      isSubSlot 
                        ? 'bg-[#0f0b1e] border-amber-500/30' 
                        : 'bg-[#150f2b] border-[#2d214e]'
                    }`}
                  >
                    {/* Slot Header */}
                    <div className="flex items-center justify-between border-b border-[#231840] pb-2">
                      <span className={`text-[11px] font-black uppercase tracking-wider ${
                        isSubSlot ? 'text-amber-400' : 'text-purple-300'
                      }`}>
                        {isSubSlot ? (language === 'pt' ? 'Slot 5 (Reserva)' : 'Slot 5 (Sub)') : `Slot ${idx + 1}`}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#1e153b] text-teal-300 border border-teal-900/40 truncate max-w-[120px]" title={slot.role}>
                        {slot.role}
                      </span>
                    </div>

                    {/* Main Character */}
                    <div
                      onClick={() => {
                        playSelect();
                        if (localMain) onSelectCharacter(localMain);
                      }}
                      className="group flex flex-col items-center p-3 rounded-xl bg-[#0e0a1c] hover:bg-[#1a1236] border border-[#251944] hover:border-purple-400 transition-all cursor-pointer text-center shadow-md relative"
                      title={`${slot.main.title}\n${language === 'pt' ? 'Clique para ver ficha completa' : 'Click to view full profile'}`}
                    >
                      <span className="absolute top-2 left-2 text-[9px] font-black px-1.5 py-0.2 rounded bg-purple-600 text-white uppercase tracking-wider">
                        {language === 'pt' ? 'Principal' : 'Main'}
                      </span>
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-purple-900/60 group-hover:border-purple-400 mb-2 mt-2 shadow relative">
                        <img
                          src={localMain ? getStaticThumbUrl(localMain.id, localMain.image) : getAssetPath(`assets/${slot.main.image}`)}
                          alt={slot.main.title}
                          className="w-full h-full object-cover object-top transform group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <span className="text-xs font-bold text-white group-hover:text-purple-300 truncate w-full">
                        {slot.main.name}
                      </span>
                      <span className="text-[10px] text-gray-400 truncate w-full">
                        {slot.main.title}
                      </span>
                      <div className="mt-1 flex items-center gap-1">
                        <ElementBadge element={slot.main.element} />
                        <RarityBadge rarity={slot.main.rarity as any} className="scale-75" />
                      </div>
                    </div>

                    {/* Viable Substitutes */}
                    <div className="flex-1 flex flex-col pt-3 border-t border-[#231840] space-y-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        {language === 'pt' ? 'Substitutos Viáveis:' : 'Viable Substitutes:'}
                      </span>
                      {slot.substitutes && slot.substitutes.length > 0 ? (
                        <div className="flex flex-col gap-1.5 flex-1">
                          {slot.substitutes.map((sub, sIdx) => {
                            const localSub = characters.find((c) => c.id === sub.characterId);
                            return (
                              <div
                                key={sIdx}
                                onClick={() => {
                                   playSelect();
                                   if (localSub) onSelectCharacter(localSub);
                                }}
                                className="group flex items-center gap-2 p-1.5 rounded-lg bg-[#0b0816] hover:bg-[#1a1236] border border-[#1e1438] hover:border-purple-500/50 transition-all cursor-pointer"
                                title={`${sub.title}\n${language === 'pt' ? 'Clique para ver detalhes' : 'Click to view details'}`}
                              >
                                <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#2b1f4c] shrink-0">
                                  <img
                                    src={localSub ? getStaticThumbUrl(localSub.id, localSub.image) : getAssetPath(`assets/${sub.image}`)}
                                    alt={sub.title}
                                    className="w-full h-full object-cover object-top"
                                  />
                                </div>
                                <div className="overflow-hidden leading-tight">
                                  <div className="text-[11px] font-bold text-gray-200 group-hover:text-purple-300 truncate">
                                    {sub.name}
                                  </div>
                                  <div className="text-[9px] text-gray-500 truncate">
                                    {sub.title}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-4 rounded-xl bg-[#0b0816]/40 border border-dashed border-[#231840] text-center min-h-[90px]">
                          <span className="text-[11px] text-gray-500 italic">
                            {language === 'pt' ? 'Posição única do meta' : 'Unique meta position'}
                          </span>
                          <span className="text-[9px] text-gray-600 mt-0.5">
                            {language === 'pt' ? 'Sem substituto direto recomendado' : 'No direct substitute recommended'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: CUSTOM TEAM BUILDER                                               */}
      {/* ========================================================================= */}
      {viewMode === 'custom' && (
        <div className="space-y-6">
          {/* Custom Action Bar */}
          <div className="flex items-center justify-between bg-[#120d24] border border-[#231a40] rounded-xl p-4">
            <div className="text-sm text-gray-300">
              <span className="font-bold text-white">{language === 'pt' ? 'Meus Times:' : 'Custom Teams:'}</span>{' '}
              {language === 'pt'
                ? 'Crie formações personalizadas, equipe cartas de memória e teste sinergias de combate.'
                : 'Create custom teams, equip memory cards, and test combat synergies.'}
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-900/40 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'pt' ? 'Criar Nova Equipe' : 'Create New Team'}</span>
            </button>
          </div>

          {/* Modal for creating / editing team name & description */}
          {showTeamModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-[#120e24] border border-purple-500/40 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-[#241c3e] pb-3">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-400" />
                    <span>
                      {editingTeamId
                        ? (language === 'pt' ? 'Editar Equipe' : 'Edit Team')
                        : (language === 'pt' ? 'Criar Nova Equipe' : 'Create New Team')}
                    </span>
                  </h3>
                  <button
                    onClick={() => setShowTeamModal(false)}
                    className="text-gray-400 hover:text-white p-1 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveTeamModal} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">
                      {language === 'pt' ? 'Nome da Formação *' : 'Team Name *'}
                    </label>
                    <input
                      type="text"
                      placeholder={language === 'pt' ? 'Ex: Time Mono Red - Raid Jogo' : 'E.g.: Mono Red Team - Jogo Raid'}
                      value={teamNameInput}
                      onChange={(e) => setTeamNameInput(e.target.value)}
                      className="w-full bg-[#0c0918] border border-[#2e234e] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                      autoFocus
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">
                      {language === 'pt' ? 'Descrição ou Estratégia' : 'Description or Strategy'}
                    </label>
                    <textarea
                      rows={3}
                      placeholder={language === 'pt' ? 'Ex: Focado em quebra de postura rápida e dano crítico com buff de Taijutsu...' : 'E.g.: Focused on rapid break gauge and critical damage with Taijutsu buffs...'}
                      value={teamDescInput}
                      onChange={(e) => setTeamDescInput(e.target.value)}
                      className="w-full bg-[#0c0918] border border-[#2e234e] rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500 resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowTeamModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white"
                    >
                      {language === 'pt' ? 'Cancelar' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md cursor-pointer"
                    >
                      {language === 'pt' ? 'Salvar Equipe' : 'Save Team'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Picker Modal: Character Selector */}
          {picker && picker.mode === 'character' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-[#120e24] border border-purple-500/40 rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                <div className="p-5 border-b border-[#241c3e] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0d091a]">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-purple-400" />
                      <span>
                        {language === 'pt'
                          ? `Selecionar Feiticeiro (Slot ${picker.slotNumber})`
                          : `Select Sorcerer (Slot ${picker.slotNumber})`}
                      </span>
                    </h3>
                    <p className="text-xs text-gray-400">
                      {language === 'pt'
                        ? 'Escolha um feiticeiro para ocupar esta posição estratégica na equipe.'
                        : 'Choose a sorcerer to occupy this strategic position in the team.'}
                    </p>
                  </div>

                  <button
                    onClick={() => setPicker(null)}
                    className="text-gray-400 hover:text-white p-1 rounded-lg self-end sm:self-auto"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 border-b border-[#201838] bg-[#0f0b20] flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder={language === 'pt' ? 'Buscar por nome ou título...' : 'Search by name or title...'}
                      value={pickerSearch}
                      onChange={(e) => setPickerSearch(e.target.value)}
                      className="w-full bg-[#070510] border border-[#251b40] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-[#070510] p-1 rounded-xl border border-[#251b40]">
                    {['ALL', 'Blue', 'Red', 'Green', 'Yellow'].map((elem) => (
                      <button
                        key={elem}
                        onClick={() => setPickerElementFilter(elem)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          pickerElementFilter === elem
                            ? 'bg-purple-600 text-white shadow'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {elem === 'ALL' ? (language === 'pt' ? 'Todos' : 'All') : elem}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 bg-[#070510] p-1 rounded-xl border border-[#251b40]">
                    {['ALL', 'SSR', 'SR', 'R'].map((rar) => (
                      <button
                        key={rar}
                        onClick={() => setPickerRarityFilter(rar)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          pickerRarityFilter === rar
                            ? 'bg-purple-600 text-white shadow'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {rar === 'ALL' ? (language === 'pt' ? 'Todas' : 'All') : rar}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => handleSelectCharacterForSlot(null)}
                    className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-bold transition-all"
                  >
                    {language === 'pt' ? 'Desocupar Slot' : 'Empty Slot'}
                  </button>
                </div>

                <div className="p-4 overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 bg-[#0a0714]">
                  {filteredPickerChars.map((char) => (
                    <div
                      key={char.id}
                      onClick={() => handleSelectCharacterForSlot(char.id)}
                      className="group relative rounded-xl border border-[#2a2046] hover:border-purple-400 bg-[#120e24] hover:bg-[#181130] p-2.5 flex flex-col items-center text-center cursor-pointer transition-all hover:scale-[1.03] shadow-md"
                    >
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-purple-500/30 bg-[#090612] mb-2">
                        <img
                          src={getStaticThumbUrl(char.id, char.image)}
                          alt={char.name}
                          className="w-full h-full object-cover object-top"
                          loading="lazy"
                        />
                      </div>
                      <span className="text-xs font-bold text-white group-hover:text-purple-300 truncate w-full">
                        {char.name}
                      </span>
                      <span className="text-[10px] text-gray-400 truncate w-full">
                        {char.title}
                      </span>
                      <div className="mt-1.5 flex items-center gap-1">
                        <ElementBadge element={char.element} />
                        <RarityBadge rarity={char.rarity} className="scale-75" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Picker Modal: Memory Selector */}
          {picker && picker.mode === 'memory' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-[#120e24] border border-indigo-500/40 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                <div className="p-5 border-b border-[#241c3e] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0d091a]">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-indigo-400" />
                      <span>
                        {language === 'pt'
                          ? `Equipar Memória (Slot ${picker.slotNumber})`
                          : `Equip Memory (Slot ${picker.slotNumber})`}
                      </span>
                    </h3>
                    <p className="text-xs text-gray-400">
                      {language === 'pt'
                        ? 'Selecione uma Carta de Memória (Recollection Bit) para equipar neste feiticeiro.'
                        : 'Select a Memory Card (Recollection Bit) to equip on this sorcerer.'}
                    </p>
                  </div>

                  <button
                    onClick={() => setPicker(null)}
                    className="text-gray-400 hover:text-white p-1 rounded-lg self-end sm:self-auto"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 border-b border-[#201838] bg-[#0f0b20] flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder={language === 'pt' ? 'Buscar memória pelo título...' : 'Search memory by title...'}
                      value={pickerSearch}
                      onChange={(e) => setPickerSearch(e.target.value)}
                      className="w-full bg-[#070510] border border-[#251b40] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-[#070510] p-1 rounded-xl border border-[#251b40]">
                    {['ALL', 'SSR', 'SR', 'R'].map((rar) => (
                      <button
                        key={rar}
                        onClick={() => setPickerRarityFilter(rar)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          pickerRarityFilter === rar
                            ? 'bg-indigo-600 text-white shadow'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {rar === 'ALL' ? (language === 'pt' ? 'Todas' : 'All') : rar}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => handleSelectMemoryForSlot(null)}
                    className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-bold transition-all"
                  >
                    {language === 'pt' ? 'Desequipar Memória' : 'Unequip Memory'}
                  </button>
                </div>

                <div className="p-4 overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-[#0a0714]">
                  {filteredPickerMems.map((mem) => (
                    <div
                      key={mem.id}
                      onClick={() => handleSelectMemoryForSlot(mem.id)}
                      className="group relative rounded-xl border border-[#2a2046] hover:border-indigo-400 bg-[#120e24] hover:bg-[#181130] p-2.5 flex flex-col items-center text-center cursor-pointer transition-all hover:scale-[1.03] shadow-md"
                    >
                      <div className="relative w-full h-24 rounded-lg overflow-hidden border border-indigo-500/30 bg-[#090612] mb-2">
                        <img
                          src={getAssetUrl(mem.image)}
                          alt={mem.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getAssetUrl();
                          }}
                        />
                        <div className="absolute top-1 right-1">
                          <RarityBadge rarity={mem.rarity} className="scale-75 origin-top-right" />
                        </div>
                      </div>

                      <span className="text-xs font-bold text-white group-hover:text-indigo-300 line-clamp-1 w-full">
                        {mem.title}
                      </span>
                      
                      <div className="mt-1 flex items-center justify-center gap-1.5 text-[10px] text-gray-400">
                        <span className="text-emerald-400 font-semibold">{mem.stats?.hp || '0%'} HP</span>
                        <span>•</span>
                        <span className="text-amber-400 font-semibold">{mem.stats?.taijutsu || '0%'} Tai</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Custom Teams Grid */}
          <div className="space-y-6">
            {teams.map((team) => {
              const elementCounts: Record<string, number> = {};
              team.members.forEach((m) => {
                const char = getCharById(m.characterId);
                if (char && char.element) {
                  const el = char.element.charAt(0).toUpperCase() + char.element.slice(1).toLowerCase();
                  elementCounts[el] = (elementCounts[el] || 0) + 1;
                }
              });

              return (
                <div 
                  key={team.id}
                  className="bg-[#120e24] border border-[#291f47] rounded-2xl p-6 shadow-xl space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#201838] pb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-black text-white flex items-center gap-2">
                          <Users className="w-5 h-5 text-purple-400" />
                          {team.name}
                        </h3>

                        <div className="flex items-center gap-1">
                          {Object.entries(elementCounts).map(([elem, count]) => (
                            <span
                              key={elem}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#090614] border border-[#342759] text-gray-300"
                            >
                              <ElementBadge element={elem} showLabel={false} className="scale-65" />
                              <span>{count}x</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {team.description && (
                        <p className="text-xs text-gray-400 mt-1">{team.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        onClick={() => {
                          playSuccessFanfare();
                          exportTeamAsImage(team, characters, memories, language);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                        title={language === 'pt' ? 'Exportar formação em imagem PNG de alta resolução' : 'Export formation as high-resolution PNG image'}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{language === 'pt' ? 'Exportar PNG' : 'Export PNG'}</span>
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(team)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1c1536] hover:bg-purple-900/60 border border-[#312354] hover:border-purple-500 text-gray-300 hover:text-white text-xs font-bold transition-all"
                        title={language === 'pt' ? 'Editar nome e estratégia da equipe' : 'Edit team name and strategy'}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{language === 'pt' ? 'Editar' : 'Edit'}</span>
                      </button>

                      <button
                        onClick={() => handleDuplicateTeam(team)}
                        className="p-2 rounded-xl bg-[#1c1536] hover:bg-[#251c47] border border-[#312354] text-gray-300 hover:text-white transition-all"
                        title={language === 'pt' ? 'Duplicar equipe' : 'Duplicate team'}
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      {teams.length > 1 && (
                        <button
                          onClick={() => {
                            const confirmMsg = language === 'pt'
                              ? `Deseja realmente excluir a equipe "${team.name}"?`
                              : `Do you really want to delete team "${team.name}"?`;
                            if (window.confirm(confirmMsg)) {
                              deleteTeam(team.id);
                              playTrashDelete();
                            }
                          }}
                          className="p-2 rounded-xl bg-[#1c1536] hover:bg-red-950 border border-[#312354] hover:border-red-500/40 text-gray-300 hover:text-red-300 transition-all"
                          title={language === 'pt' ? 'Excluir equipe' : 'Delete team'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 5 Slots Custom Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
                    {team.members.map((slotItem) => {
                      const char = getCharById(slotItem.characterId);
                      const memory = getMemoryById(slotItem.memoryId);
                      const isSub = slotItem.slot === 5;

                      return (
                        <div
                          key={slotItem.slot}
                          className={`rounded-xl p-3 border flex flex-col justify-between space-y-3 transition-all ${
                            isSub 
                              ? 'bg-[#0f0b1e] border-amber-500/30' 
                              : 'bg-[#150f2b] border-[#2d214e]'
                          }`}
                        >
                          <div className="flex items-center justify-between border-b border-[#231840] pb-2">
                            <span className={`text-[11px] font-black uppercase tracking-wider ${
                              isSub ? 'text-amber-400' : 'text-purple-300'
                            }`}>
                              {isSub ? (language === 'pt' ? 'Slot 5 (Reserva)' : 'Slot 5 (Sub)') : `Slot ${slotItem.slot}`}
                            </span>
                            {char && (
                              <ElementBadge element={char.element} showLabel={false} className="scale-75 origin-right" />
                            )}
                          </div>

                          {/* Character Card Box */}
                          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#0e0a1c] border border-[#231840] min-h-[145px] relative group">
                            {char ? (
                              <>
                                <div
                                  onClick={() => onSelectCharacter(char)}
                                  className="cursor-pointer relative w-16 h-16 rounded-xl overflow-hidden border border-purple-500/40 group-hover:border-purple-400 mb-2 shadow"
                                  title={language === 'pt' ? 'Ver ficha técnica' : 'View profile'}
                                >
                                  <img
                                    src={getStaticThumbUrl(char.id, char.image)}
                                    alt={char.name}
                                    className="w-full h-full object-cover object-top"
                                  />
                                </div>
                                <span className="text-xs font-bold text-white truncate max-w-full group-hover:text-purple-300">
                                  {char.name}
                                </span>
                                <span className="text-[10px] text-gray-400 truncate max-w-full">
                                  {char.title}
                                </span>

                                <button
                                  onClick={() => openPicker(team.id, slotItem.slot, 'character')}
                                  className="mt-2 text-[10px] font-semibold text-purple-400 hover:text-purple-200 underline"
                                >
                                  {language === 'pt' ? 'Trocar Feiticeiro' : 'Switch Sorcerer'}
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => openPicker(team.id, slotItem.slot, 'character')}
                                className="flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-purple-400 w-full h-full py-6 transition-colors"
                              >
                                <div className="w-10 h-10 rounded-full bg-[#181130] flex items-center justify-center border border-dashed border-[#342759]">
                                  <UserPlus className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-bold">
                                  {language === 'pt' ? 'Adicionar Feiticeiro' : 'Add Sorcerer'}
                                </span>
                              </button>
                            )}
                          </div>

                          {/* Memory Card Box */}
                          <div className="rounded-xl bg-[#0e0a1c] border border-[#231840] p-2 flex flex-col justify-between min-h-[75px]">
                            {memory ? (
                              <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-lg overflow-hidden border border-indigo-500/40 shrink-0 bg-black">
                                  <img
                                    src={getAssetUrl(memory.image)}
                                    alt={memory.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = getAssetUrl();
                                    }}
                                  />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-indigo-300 truncate block">
                                      {memory.title}
                                    </span>
                                    <RarityBadge rarity={memory.rarity} className="scale-65 origin-right" />
                                  </div>
                                  <div className="flex items-center justify-between mt-1">
                                    <button
                                      onClick={() => openPicker(team.id, slotItem.slot, 'memory')}
                                      className="text-[9px] text-gray-400 hover:text-white underline"
                                    >
                                      {language === 'pt' ? 'Trocar' : 'Switch'}
                                    </button>
                                    <button
                                      onClick={() => {
                                        const updated = team.members.map((m) => 
                                          m.slot === slotItem.slot ? { ...m, memoryId: null } : m
                                        );
                                        updateTeam({ ...team, members: updated });
                                        playClick();
                                      }}
                                      className="text-[9px] text-red-400 hover:text-red-300"
                                      title={language === 'pt' ? 'Desequipar memória' : 'Unequip memory'}
                                    >
                                      {language === 'pt' ? 'Remover' : 'Remove'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => openPicker(team.id, slotItem.slot, 'memory')}
                                className="flex items-center justify-center gap-2 py-2 text-gray-500 hover:text-indigo-400 text-xs font-bold transition-colors w-full"
                              >
                                <BookOpen className="w-4 h-4" />
                                <span>{language === 'pt' ? 'Equipar Memória' : 'Equip Memory'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
