import React, { useState, useMemo } from 'react';
import type { TimelineEvent } from '../types';
import { Calendar, Clock, Search, CheckCircle2, Flame, Sparkles } from 'lucide-react';
import { playClick } from '../utils/sound';

interface TimelineViewProps {
  events: TimelineEvent[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ events }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'RELEASED' | 'UPCOMING'>('ALL');

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const q = searchTerm.toLowerCase();
      const matchName = ev.name.toLowerCase().includes(q);
      const matchBanners = ev.banners?.some(b => b.toLowerCase().includes(q));
      const matchSearch = !searchTerm || matchName || matchBanners;

      const isReleased = ev.status === 'released';
      if (filterStatus === 'RELEASED') return matchSearch && isReleased;
      if (filterStatus === 'UPCOMING') return matchSearch && !isReleased;
      return matchSearch;
    });
  }, [events, searchTerm, filterStatus]);

  const releasedCount = useMemo(() => events.filter(e => e.status === 'released').length, [events]);
  const upcomingCount = useMemo(() => events.filter(e => e.status !== 'released').length, [events]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#251b40] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Servidor JP & Previsão Global
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Lag Oficial: ~65 Dias
            </span>
          </div>
          <h1 className="text-3xl font-black text-white font-serif tracking-tight flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-400" />
            CRONOGRAMA & PREVISÕES DE BANNERS
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Histórico completo de banners e eventos da versão japonesa (JP) sincronizado com a previsão calibrada para o servidor Global.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
          <input
            type="text"
            placeholder="Buscar evento ou banner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#120e24] border border-[#2d2250] rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors shadow-inner"
          />
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-r from-[#141029] via-[#1a1436] to-[#120d24] border border-blue-500/30 rounded-2xl p-5 shadow-lg flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-blue-950/80 border border-blue-500/40 text-blue-300 shrink-0">
          <Clock className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-xs text-gray-300">
          <h3 className="font-bold text-sm text-blue-200">
            Aceleração Oficial do Servidor Global
          </h3>
          <p className="leading-relaxed">
            O Global acelerou o lançamento de eventos para alcançar a versão japonesa. Atualmente, a diferença média de lançamento é de apenas <strong>~65 dias</strong>. Eventos como <em>Gojo 0.2s</em>, <em>Suguru Geto</em> e <em>Yuta Okkotsu</em> já foram ajustados no cronograma.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            playClick();
            setFilterStatus('ALL');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
            filterStatus === 'ALL'
              ? 'bg-purple-600 border-purple-400 text-white shadow-md'
              : 'bg-[#120e24] border-[#291f47] text-gray-400 hover:text-white'
          }`}
        >
          Todos ({events.length})
        </button>
        <button
          onClick={() => {
            playClick();
            setFilterStatus('UPCOMING');
          }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
            filterStatus === 'UPCOMING'
              ? 'bg-blue-600 border-blue-400 text-white shadow-md'
              : 'bg-[#120e24] border-[#291f47] text-gray-400 hover:text-white'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>Próximos Banners ({upcomingCount})</span>
        </button>
        <button
          onClick={() => {
            playClick();
            setFilterStatus('RELEASED');
          }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
            filterStatus === 'RELEASED'
              ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
              : 'bg-[#120e24] border-[#291f47] text-gray-400 hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Já Lançados ({releasedCount})</span>
        </button>
      </div>

      {/* Events Timeline List */}
      <div className="space-y-3">
        {filteredEvents.map((ev) => {
          const isReleased = ev.status === 'released';
          const isCurrent = ev.status === 'current';

          return (
            <div
              key={ev.index}
              className={`border rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all shadow-md ${
                isCurrent 
                  ? 'bg-gradient-to-r from-[#1e1236] to-[#120b22] border-amber-500/50 shadow-amber-950/20' 
                  : isReleased
                    ? 'bg-[#110c22] border-[#251b40] hover:border-purple-500/40 hover:bg-[#16102c]'
                    : 'bg-[#140e28] border-blue-500/40 shadow-blue-950/20'
              }`}
            >
              {/* Event Content */}
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
                    isCurrent
                      ? 'bg-amber-950/80 border-amber-500/50 text-amber-300 animate-pulse'
                      : isReleased 
                        ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300' 
                        : 'bg-blue-950/70 border-blue-500/40 text-blue-300'
                  }`}>
                    {isCurrent ? (
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                    ) : isReleased ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                    {ev.status_label || (isReleased ? 'Já Lançado no Global' : 'Próximo no Global')}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">#{ev.index}</span>
                </div>

                {/* Event Name & Sub-Banners */}
                <h3 className="text-base font-bold text-white leading-snug">
                  {ev.name}
                </h3>

                {ev.banners && ev.banners.length > 1 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {ev.banners.slice(1).map((sub, sIdx) => (
                      <span
                        key={sIdx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#0b0816] text-purple-300 border border-purple-900/40 text-[11px]"
                      >
                        <Sparkles className="w-3 h-3 text-purple-400 shrink-0" />
                        <span>{sub}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Dates Box */}
              <div className="flex items-center gap-6 bg-[#0a0714] px-4 py-3 rounded-xl border border-[#23183d] w-full md:w-auto justify-between md:justify-end text-xs shrink-0 shadow-inner">
                <div>
                  <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">
                    Lançamento JP
                  </span>
                  <span className="font-mono font-bold text-gray-300 text-sm">
                    {ev.jp_date}
                  </span>
                </div>

                <div className="border-l border-[#241a42] pl-5">
                  <span className="text-[10px] text-purple-400 block uppercase font-bold tracking-wider">
                    Previsão Global
                  </span>
                  <span className="font-mono font-black text-purple-200 text-sm">
                    {ev.global_date}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredEvents.length === 0 && (
          <div className="text-center py-12 bg-[#120e24] border border-[#251b40] rounded-2xl">
            <Calendar className="w-10 h-10 text-gray-600 mx-auto mb-2" />
            <div className="text-base font-bold text-gray-300">Nenhum evento encontrado</div>
            <div className="text-xs text-gray-500 mt-1">
              Tente redefinir a busca ou alternar entre os filtros de lançados/próximos.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
