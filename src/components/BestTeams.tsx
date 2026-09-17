import React, { useState } from 'react';
import type { Character, Memory } from '../types';
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
  UserPlus
} from 'lucide-react';
import { playClick } from '../utils/sound';
import { getAssetUrl, getStaticThumbUrl } from '../utils/assets';

interface BestTeamsProps {
  characters: Character[];
  memories: Memory[];
  onSelectCharacter: (char: Character) => void;
}

type PickerMode = 'character' | 'memory' | null;

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
  const { teams, addTeam, updateTeam, deleteTeam } = useJjkStore();
  
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
    playClick();
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
    playClick();
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
    playClick();
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#251b40] pb-6">
        <div>
          <h1 className="text-3xl font-black text-white font-serif tracking-tight flex items-center gap-3">
            <Shield className="w-7 h-7 text-indigo-400" />
            COMPOSIÇÕES DE EQUIPE (BUILDER DE TIMES)
          </h1>
          <p className="text-sm text-gray-400">
            Monte e personalize suas formações táticas com 4 Feiticeiros na linha de frente, 1 Reserva e Memórias equipadas.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-900/40 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Nova Equipe</span>
        </button>
      </div>

      {/* Modal for creating / editing team name & description */}
      {showTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#120e24] border border-purple-500/40 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#241c3e] pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                <span>{editingTeamId ? 'Editar Equipe' : 'Criar Nova Equipe'}</span>
              </h3>
              <button
                onClick={() => setShowTeamModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTeamModal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">
                  Nome da Formação *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Time Mono Red - Raid Jogo"
                  value={teamNameInput}
                  onChange={(e) => setTeamNameInput(e.target.value)}
                  className="w-full bg-[#0c0918] border border-[#2e234e] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">
                  Descrição ou Estratégia
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Focado em quebra de postura rápida e dano crítico com buff de Taijutsu..."
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
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  Salvar Equipe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Picker Modal: Character Selector */}
      {picker && picker.mode === 'character' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#120e24] border border-purple-500/40 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#241c3e] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0d091a]">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-purple-400" />
                  <span>Selecionar Feiticeiro (Slot {picker.slotNumber})</span>
                </h3>
                <p className="text-xs text-gray-400">
                  Escolha um personagem para posicionar na formação.
                </p>
              </div>

              <button
                onClick={() => setPicker(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg self-end sm:self-auto"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Bar */}
            <div className="p-4 border-b border-[#201838] bg-[#0f0b20] flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou título..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="w-full bg-[#070510] border border-[#251b40] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  autoFocus
                />
              </div>

              {/* Element Filter */}
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
                    {elem === 'ALL' ? 'Todos' : elem}
                  </button>
                ))}
              </div>

              {/* Rarity Filter */}
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
                    {rar === 'ALL' ? 'Todas' : rar}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleSelectCharacterForSlot(null)}
                className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-bold transition-all"
              >
                Esvaziar Slot
              </button>
            </div>

            {/* Character Grid */}
            <div className="p-4 overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 bg-[#0a0714]">
              {filteredPickerChars.map((char) => (
                <div
                  key={char.id}
                  onClick={() => handleSelectCharacterForSlot(char.id)}
                  className="group relative rounded-xl border border-[#2a2046] hover:border-purple-400 bg-[#120e24] hover:bg-[#181130] p-2.5 flex flex-col items-center text-center cursor-pointer transition-all hover:scale-[1.03] shadow-md"
                >
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-purple-500/40 bg-[#090612] mb-2">
                    <img
                      src={getStaticThumbUrl(char.image)}
                      alt={char.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (!target.dataset.fallback) {
                          target.dataset.fallback = 'true';
                          target.src = getAssetUrl(char.image);
                        } else {
                          target.src = getAssetUrl();
                        }
                      }}
                    />
                    <div className="absolute top-0.5 right-0.5">
                      <ElementBadge element={char.element} showLabel={false} className="scale-65" />
                    </div>
                  </div>

                  <span className="text-xs font-bold text-white group-hover:text-purple-300 line-clamp-1 w-full">
                    {char.name}
                  </span>
                  <span className="text-[10px] text-gray-400 line-clamp-1 w-full">
                    {char.card_name || char.title}
                  </span>
                  <div className="mt-1 flex items-center gap-1">
                    <RarityBadge rarity={char.rarity} className="scale-75 origin-center" />
                    <span className="text-[9px] text-purple-300 bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-500/30">
                      {char.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Picker Modal: Memory Selector */}
      {picker && picker.mode === 'memory' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#120e24] border border-indigo-500/40 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#241c3e] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0d091a]">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                  <span>Equipar Memória (Slot {picker.slotNumber})</span>
                </h3>
                <p className="text-xs text-gray-400">
                  Selecione uma Carta de Memória (Recollection Bit) para equipar neste feiticeiro.
                </p>
              </div>

              <button
                onClick={() => setPicker(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg self-end sm:self-auto"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Bar */}
            <div className="p-4 border-b border-[#201838] bg-[#0f0b20] flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar memória pelo título..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="w-full bg-[#070510] border border-[#251b40] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>

              {/* Rarity Filter */}
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
                    {rar === 'ALL' ? 'Todas' : rar}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleSelectMemoryForSlot(null)}
                className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-bold transition-all"
              >
                Desequipar Memória
              </button>
            </div>

            {/* Memory Grid */}
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

      {/* Teams Grid */}
      <div className="space-y-6">
        {teams.map((team) => {
          // Calculate team element breakdown
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
              {/* Team Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#201838] pb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-400" />
                      {team.name}
                    </h3>

                    {/* Element Badges of Team */}
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

                {/* Team Controls */}
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    onClick={() => handleOpenEditModal(team)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1c1536] hover:bg-purple-900/60 border border-[#312354] hover:border-purple-500 text-gray-300 hover:text-white text-xs font-bold transition-all"
                    title="Editar nome e estratégia da equipe"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>

                  <button
                    onClick={() => handleDuplicateTeam(team)}
                    className="p-2 rounded-xl bg-[#1c1536] hover:bg-[#251c47] border border-[#312354] text-gray-300 hover:text-white transition-all"
                    title="Duplicar equipe"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      deleteTeam(team.id);
                      playClick();
                    }}
                    className="p-2 rounded-xl bg-[#1c1536] hover:bg-red-950/70 border border-[#312354] hover:border-red-500 text-gray-400 hover:text-red-300 transition-all"
                    title="Excluir equipe"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Team Slots (4 Frontline + 1 Backup) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                {team.members.map((member) => {
                  const char = getCharById(member.characterId);
                  const mem = getMemoryById(member.memoryId);
                  const isBackup = member.slot === 5;

                  return (
                    <div 
                      key={member.slot}
                      className={`relative rounded-2xl border p-3 flex flex-col items-center text-center transition-all ${
                        isBackup 
                          ? 'bg-[#18112e]/70 border-indigo-500/40 shadow-indigo-950/20 shadow-md' 
                          : 'bg-[#0f0b1c] border-[#291f47]'
                      }`}
                    >
                      {/* Slot Label */}
                      <div className="w-full flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase font-black tracking-wider text-purple-400">
                          {isBackup ? '🛡️ Reserva' : `Slot ${member.slot}`}
                        </span>

                        {char && (
                          <button
                            onClick={() => {
                              const updated = team.members.map((m) => 
                                m.slot === member.slot ? { ...m, characterId: null } : m
                              );
                              updateTeam({ ...team, members: updated });
                              playClick();
                            }}
                            className="text-gray-500 hover:text-red-400 p-0.5 rounded"
                            title="Remover feiticeiro"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Character Card Box */}
                      {char ? (
                        <div className="w-full flex flex-col items-center space-y-2">
                          <div 
                            onClick={() => onSelectCharacter(char)}
                            className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-purple-500/40 bg-[#090612] cursor-pointer hover:scale-105 transition-transform group"
                            title={`${char.title} (Clique para abrir ficha completa)`}
                          >
                            <img
                              src={getStaticThumbUrl(char.image)}
                              alt={char.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (!target.dataset.fallback) {
                                  target.dataset.fallback = 'true';
                                  target.src = getAssetUrl(char.image);
                                } else {
                                  target.src = getAssetUrl();
                                }
                              }}
                            />
                            <div className="absolute top-1 right-1">
                              <ElementBadge element={char.element} showLabel={false} className="scale-75" />
                            </div>
                            <div className="absolute bottom-1 left-1">
                              <RarityBadge rarity={char.rarity} className="scale-65 origin-bottom-left" />
                            </div>
                          </div>

                          <div className="w-full">
                            <h4 
                              onClick={() => onSelectCharacter(char)}
                              className="text-xs font-bold text-white hover:text-purple-300 truncate cursor-pointer"
                            >
                              {char.name}
                            </h4>
                            <span className="text-[10px] text-gray-400 truncate block">
                              {char.role}
                            </span>
                          </div>

                          <button
                            onClick={() => openPicker(team.id, member.slot, 'character')}
                            className="w-full py-1 px-2 rounded-lg bg-[#1a1336] hover:bg-purple-900/50 border border-[#2f2252] text-[11px] font-bold text-gray-300 hover:text-white transition-all cursor-pointer"
                          >
                            Trocar
                          </button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => openPicker(team.id, member.slot, 'character')}
                          className="w-full h-32 rounded-xl border-2 border-dashed border-[#342759] hover:border-purple-400 bg-[#090614] hover:bg-[#120c24] flex flex-col items-center justify-center gap-1.5 text-gray-500 hover:text-purple-300 cursor-pointer transition-all p-2"
                        >
                          <UserPlus className="w-6 h-6 text-gray-600 hover:text-purple-400" />
                          <span className="text-[11px] font-bold">Adicionar Feiticeiro</span>
                        </div>
                      )}

                      {/* Memory Slot (Recollection Bit) */}
                      <div className="w-full mt-3 pt-3 border-t border-[#201838]">
                        <div className="w-full flex items-center justify-between mb-1.5">
                          <span className="text-[9px] uppercase font-bold text-indigo-400 flex items-center gap-1">
                            <BookOpen className="w-2.5 h-2.5" />
                            <span>Memória</span>
                          </span>

                          {mem && (
                            <button
                              onClick={() => {
                                const updated = team.members.map((m) => 
                                  m.slot === member.slot ? { ...m, memoryId: null } : m
                                );
                                updateTeam({ ...team, members: updated });
                                playClick();
                              }}
                              className="text-gray-500 hover:text-red-400 p-0.5 rounded"
                              title="Remover memória"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>

                        {mem ? (
                          <div 
                            onClick={() => openPicker(team.id, member.slot, 'memory')}
                            className="w-full rounded-xl border border-indigo-500/30 hover:border-indigo-400 bg-[#0c0818] p-1.5 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
                            title={`${mem.title} (Clique para trocar)`}
                          >
                            <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-indigo-500/30 bg-[#06040d] shrink-0">
                              <img
                                src={getAssetUrl(mem.image)}
                                alt={mem.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = getAssetUrl();
                                }}
                              />
                            </div>
                            <div className="text-left overflow-hidden flex-1">
                              <span className="text-[10px] font-bold text-gray-200 truncate block leading-tight">
                                {mem.title}
                              </span>
                              <span className="text-[9px] text-emerald-400 font-semibold block">
                                {mem.stats?.hp || '0%'} HP • {mem.stats?.taijutsu || '0%'} Tai
                              </span>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => openPicker(team.id, member.slot, 'memory')}
                            className="w-full py-1.5 px-2 rounded-lg border border-dashed border-[#2b2047] hover:border-indigo-400 bg-[#080512] hover:bg-[#100b22] text-[10px] font-semibold text-gray-500 hover:text-indigo-300 transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-indigo-400" />
                            <span>Equipar Memória</span>
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
  );
};
