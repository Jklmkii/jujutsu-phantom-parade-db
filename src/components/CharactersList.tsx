import React, { useState, useMemo } from 'react';
import type { Character } from '../types';
import { ElementBadge, RarityBadge } from './Badges';
import { Search, Filter, X, Star } from 'lucide-react';
import { useJjkStore } from '../store/useJjkStore';
import { playClick } from '../utils/sound';
import { getAssetUrl } from '../utils/assets';

interface CharactersListProps {
  characters: Character[];
  onSelectCharacter: (char: Character) => void;
  initialSearch?: string;
}

export const CharactersList: React.FC<CharactersListProps> = ({ 
  characters, 
  onSelectCharacter,
  initialSearch = ""
}) => {
  const { isFavoriteChar } = useJjkStore();
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedElement, setSelectedElement] = useState<string>('ALL');
  const [selectedRarity, setSelectedRarity] = useState<string>('ALL');
  const [selectedFocus, setSelectedFocus] = useState<string>('ALL');
  const [onlyLimited, setOnlyLimited] = useState<boolean>(false);
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);

  const filteredCharacters = useMemo(() => {
    return characters.filter((char) => {
      // Search
      const searchMatch = !searchTerm || 
        char.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        char.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        char.epithet.toLowerCase().includes(searchTerm.toLowerCase());

      // Element
      const elementMatch = selectedElement === 'ALL' || 
        char.element.toLowerCase().includes(selectedElement.toLowerCase());

      // Rarity
      const rarityMatch = selectedRarity === 'ALL' || char.rarity === selectedRarity;

      // Focus
      const focusMatch = selectedFocus === 'ALL' || 
        char.focus.toLowerCase().includes(selectedFocus.toLowerCase());

      // Limited
      const limitedMatch = !onlyLimited || char.limited;

      // Favorites
      const favoritesMatch = !onlyFavorites || isFavoriteChar(char.id);

      return searchMatch && elementMatch && rarityMatch && focusMatch && limitedMatch && favoritesMatch;
    });
  }, [characters, searchTerm, selectedElement, selectedRarity, selectedFocus, onlyLimited, onlyFavorites, isFavoriteChar]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedElement('ALL');
    setSelectedRarity('ALL');
    setSelectedFocus('ALL');
    setOnlyLimited(false);
  };

  const hasActiveFilters = searchTerm || selectedElement !== 'ALL' || selectedRarity !== 'ALL' || selectedFocus !== 'ALL' || onlyLimited;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#251b40] pb-6">
        <div>
          <h1 className="text-3xl font-black text-white font-serif tracking-tight">
            CATÁLOGO DE PERSONAGENS
          </h1>
          <p className="text-sm text-gray-400">
            Fichas completas com estatísticas, habilidades escaláveis e efeitos de combate.
          </p>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou epíteto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#120e24] border border-[#2d2250] rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors shadow-inner"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Layout: Filters Panel Left (1/4), Grid Right (3/4) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Filter Panel */}
        <div className="space-y-6 bg-[#100d20] border border-[#251b40] rounded-2xl p-5 h-fit shadow-xl">
          <div className="flex items-center justify-between border-b border-[#201736] pb-3">
            <span className="text-sm font-bold text-purple-300 flex items-center gap-1.5">
              <Filter className="w-4 h-4" />
              FILTROS
            </span>
            <span className="text-xs font-mono font-bold text-gray-400">
              {filteredCharacters.length} / {characters.length}
            </span>
          </div>

          {/* Element Filter */}
          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-gray-400 block tracking-wider">
              Elemento
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedElement('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  selectedElement === 'ALL'
                    ? 'bg-purple-600 text-white border-purple-400'
                    : 'bg-[#15102a] text-gray-400 border-[#2b2149] hover:text-white'
                }`}
              >
                Todos
              </button>
              {[
                { id: 'Blue', label: '幻 Blue', color: 'text-blue-400 border-blue-500/40 bg-blue-950/20' },
                { id: 'Red', label: '夜 Red', color: 'text-red-400 border-red-500/40 bg-red-950/20' },
                { id: 'Green', label: '影 Green', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20' },
                { id: 'Yellow', label: '行 Yellow', color: 'text-yellow-400 border-yellow-500/40 bg-yellow-950/20' },
              ].map((el) => (
                <button
                  key={el.id}
                  onClick={() => setSelectedElement(el.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    selectedElement === el.id
                      ? 'bg-purple-900/60 border-purple-400 text-white shadow-sm'
                      : `${el.color} hover:brightness-125`
                  }`}
                >
                  {el.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rarity Filter */}
          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-gray-400 block tracking-wider">
              Raridade
            </label>
            <div className="flex gap-2">
              {['ALL', 'SSR', 'SR', 'R'].map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRarity(r)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-black uppercase border transition-all ${
                    selectedRarity === r
                      ? 'bg-purple-600 border-purple-400 text-white shadow-sm'
                      : 'bg-[#15102a] border-[#2b2149] text-gray-400 hover:text-white'
                  }`}
                >
                  {r === 'ALL' ? 'Todas' : r}
                </button>
              ))}
            </div>
          </div>

          {/* Damage Type Filter */}
          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-gray-400 block tracking-wider">
              Tipo de Dano (Foco)
            </label>
            <div className="flex flex-col gap-1.5">
              {[
                { id: 'ALL', label: 'Todos os tipos' },
                { id: 'Taijutsu', label: 'Taijutsu (Físico)' },
                { id: 'Jujutsu', label: 'Jujutsu (Amaldiçoado)' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFocus(f.id)}
                  className={`text-left px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    selectedFocus === f.id
                      ? 'bg-purple-900/50 border-purple-500 text-purple-200'
                      : 'bg-[#15102a] border-[#251c40] text-gray-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Special Toggles: Favorites & Limited */}
          <div className="pt-2 border-t border-[#201736] space-y-2">
            <button
              onClick={() => {
                playClick();
                setOnlyFavorites(!onlyFavorites);
              }}
              className={`w-full py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                onlyFavorites
                  ? 'bg-amber-950/70 border-amber-500 text-amber-300 shadow-md shadow-amber-950/50'
                  : 'bg-[#15102a] border-[#251c40] text-gray-400 hover:text-white'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>{onlyFavorites ? '✓ Apenas Favoritos' : 'Filtrar Favoritos'}</span>
            </button>

            <button
              onClick={() => {
                playClick();
                setOnlyLimited(!onlyLimited);
              }}
              className={`w-full py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                onlyLimited
                  ? 'bg-red-950 border-red-500 text-red-300'
                  : 'bg-[#15102a] border-[#251c40] text-gray-400 hover:text-white'
              }`}
            >
              <span>{onlyLimited ? '✓ Apenas Limitados' : 'Filtrar Apenas Limitados'}</span>
            </button>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="w-full py-2 text-xs font-bold text-purple-400 hover:text-purple-300 underline text-center"
            >
              Limpar todos os filtros
            </button>
          )}
        </div>

        {/* Right Character Grid */}
        <div className="lg:col-span-3">
          {filteredCharacters.length === 0 ? (
            <div className="bg-[#120e24] border border-[#251b40] rounded-2xl p-12 text-center space-y-3">
              <p className="text-gray-400 text-base">
                Nenhum personagem encontrado para os filtros selecionados.
              </p>
              <button
                onClick={resetFilters}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 transition-colors"
              >
                Resetar Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3.5">
              {filteredCharacters.map((char) => {
                const imgUrl = getAssetUrl(char.image);
                const isSSR = char.rarity === 'SSR';
                const isSR = char.rarity === 'SR';

                const borderClass = isSSR
                  ? 'border-amber-500/60 hover:border-yellow-400 shadow-sm shadow-amber-950/40 hover:shadow-yellow-500/30'
                  : isSR
                  ? 'border-sky-500/50 hover:border-sky-300 shadow-sm shadow-sky-950/30'
                  : 'border-slate-700 hover:border-slate-500';

                return (
                  <div
                    key={char.id}
                    onClick={() => onSelectCharacter(char)}
                    className={`group relative rounded-xl overflow-hidden border-2 bg-[#120e22] cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] flex flex-col ${borderClass}`}
                  >
                    {/* Portrait Image */}
                    <div className="relative aspect-square w-full overflow-hidden bg-[#0a0714]">
                      <img
                        src={imgUrl}
                        alt={char.title}
                        className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getAssetUrl();
                        }}
                      />

                      {/* Element Badge (Top Right) */}
                      <div className="absolute top-1.5 right-1.5 pointer-events-none">
                        <ElementBadge element={char.element} showLabel={false} className="scale-90 shadow-md" />
                      </div>

                      {/* Rarity & Limited Pill (Bottom Left) */}
                      <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 pointer-events-none">
                        <RarityBadge rarity={char.rarity} className="text-[10px] px-1.5 py-0" />
                        {char.limited && (
                          <span className="px-1.5 py-0 rounded text-[9px] font-extrabold bg-red-950/90 text-red-300 border border-red-500/50">
                            LIM
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Footer Info */}
                    <div className="p-2.5 bg-gradient-to-b from-[#151028] to-[#0d091a] flex-1 flex flex-col justify-between">
                      <div>
                        {char.epithet && (
                          <p className="text-[10px] text-gray-400 truncate leading-tight mb-0.5">
                            {char.epithet}
                          </p>
                        )}
                        <h3 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                          {char.name}
                        </h3>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1.5 mt-1 border-t border-[#201838]">
                        <span>{char.focus}</span>
                        <span>{char.role}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
