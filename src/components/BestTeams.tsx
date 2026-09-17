import React, { useState } from 'react';
import type { Character, Memory } from '../types';
import { useJjkStore, type CustomTeam } from '../store/useJjkStore';
import { ElementBadge } from './Badges';
import { Shield, Plus, Trash2, Users } from 'lucide-react';

interface BestTeamsProps {
  characters: Character[];
  memories: Memory[];
  onSelectCharacter: (char: Character) => void;
}

export const BestTeams: React.FC<BestTeamsProps> = ({ 
  characters, 
  memories: _memories, 
  onSelectCharacter 
}) => {
  const { teams, addTeam, deleteTeam } = useJjkStore();
  const [newTeamName, setNewTeamName] = useState('');
  const [showModal, setShowModal] = useState(false);

  const getCharById = (id: string | null) => {
    if (!id) return null;
    return characters.find((c) => c.id === id || c.title === id);
  };

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    const newTeam: CustomTeam = {
      id: 'team_' + Date.now(),
      name: newTeamName.trim(),
      description: 'Equipe customizada criada pelo jogador.',
      members: [
        { slot: 1, characterId: characters[0]?.id || null, memoryId: null },
        { slot: 2, characterId: characters[1]?.id || null, memoryId: null },
        { slot: 3, characterId: characters[2]?.id || null, memoryId: null },
        { slot: 4, characterId: characters[3]?.id || null, memoryId: null },
        { slot: 5, characterId: characters[4]?.id || null, memoryId: null },
      ]
    };

    addTeam(newTeam);
    setNewTeamName('');
    setShowModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#251b40] pb-6">
        <div>
          <h1 className="text-3xl font-black text-white font-serif tracking-tight flex items-center gap-3">
            <Shield className="w-7 h-7 text-indigo-400" />
            COMPOSIÇÕES DE EQUIPE (BEST TEAMS)
          </h1>
          <p className="text-sm text-gray-400">
            Formações meta recomendadas por elemento e criador de times customizados salvo localmente.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-900/40 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Nova Equipe</span>
        </button>
      </div>

      {/* Modal for creating team */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#120e24] border border-purple-500/40 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Criar Nova Equipe</h3>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">
                  Nome da Formação
                </label>
                <input
                  type="text"
                  placeholder="Ex: Time Mono Red - Raid Jogo"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full bg-[#0c0918] border border-[#2e234e] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md"
                >
                  Salvar Equipe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teams Grid */}
      <div className="space-y-6">
        {teams.map((team) => (
          <div 
            key={team.id}
            className="bg-[#120e24] border border-[#291f47] rounded-2xl p-6 shadow-xl space-y-5"
          >
            {/* Team Header */}
            <div className="flex items-center justify-between border-b border-[#201838] pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  {team.name}
                </h3>
                {team.description && (
                  <p className="text-xs text-gray-400 mt-0.5">{team.description}</p>
                )}
              </div>
              {team.id !== 'default-team-1' && (
                <button
                  onClick={() => deleteTeam(team.id)}
                  className="text-gray-500 hover:text-red-400 p-2 rounded-lg transition-colors"
                  title="Excluir equipe"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Team Slots (4 Frontline + 1 Backup) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {team.members.map((member, idx) => {
                const char = getCharById(member.characterId);
                const isBackup = member.slot === 5;

                return (
                  <div 
                    key={idx}
                    className={`relative rounded-xl border p-3 flex flex-col items-center text-center transition-all ${
                      isBackup 
                        ? 'bg-[#18112e]/60 border-indigo-500/40' 
                        : 'bg-[#0f0b1c] border-[#291f47]'
                    }`}
                  >
                    {/* Slot Label */}
                    <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400 mb-2">
                      {isBackup ? '🛡️ Reserva (Backup)' : `Feiticeiro ${member.slot}`}
                    </span>

                    {char ? (
                      <div 
                        onClick={() => onSelectCharacter(char)}
                        className="cursor-pointer group space-y-2 w-full flex flex-col items-center"
                      >
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-purple-500/40 bg-[#090612] group-hover:scale-105 transition-transform">
                          <img
                            src={char.image ? `/assets/${char.image}` : '/assets/placeholder.png'}
                            alt={char.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80';
                            }}
                          />
                          <div className="absolute top-1 right-1">
                            <ElementBadge element={char.element} showLabel={false} className="scale-75" />
                          </div>
                        </div>

                        <div className="w-full">
                          <h4 className="text-xs font-bold text-white group-hover:text-purple-300 truncate">
                            {char.name}
                          </h4>
                          <span className="text-[10px] text-gray-400 truncate block">
                            {char.role}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-xl border border-dashed border-gray-600 flex items-center justify-center text-gray-500 text-xs">
                        Vazio
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
