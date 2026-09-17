import React, { useState, useMemo } from 'react';
import type { TimelineEvent } from '../types';
import { Calendar, Clock, Search, CheckCircle2 } from 'lucide-react';

interface TimelineViewProps {
  events: TimelineEvent[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ events }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'RELEASED' | 'UPCOMING'>('ALL');

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchSearch = !searchTerm || ev.name.toLowerCase().includes(searchTerm.toLowerCase());
      const isReleased = ev.status.includes('Já Lançado') || ev.status.includes('✅');
      if (filterStatus === 'RELEASED') return matchSearch && isReleased;
      if (filterStatus === 'UPCOMING') return matchSearch && !isReleased;
      return matchSearch;
    });
  }, [events, searchTerm, filterStatus]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#251b40] pb-6">
        <div>
          <h1 className="text-3xl font-black text-white font-serif tracking-tight flex items-center gap-3">
            <Calendar className="w-7 h-7 text-blue-400" />
            CRONOGRAMA & PREVISÕES DE BANNERS
          </h1>
          <p className="text-sm text-gray-400">
            Histórico oficial da versão japonesa (179 eventos) sincronizado com a previsão calibrada do Global (~65 dias de lag).
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
        <div className="p-2.5 rounded-xl bg-blue-950/80 border border-blue-500/40 text-blue-300">
          <Clock className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-xs text-gray-300">
          <h3 className="font-bold text-sm text-blue-200">
            Aceleração Oficial do Servidor Global
          </h3>
          <p className="leading-relaxed">
            O Global acelerou o lançamento de eventos para alcançar a versão japonesa. Atualmente, o atraso é de apenas <strong>~65 dias</strong>. Eventos como <em>Gojo 0.2s</em> e <em>Suguru Geto</em> já foram incorporados no cálculo.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilterStatus('ALL')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold border transition-all ${
            filterStatus === 'ALL'
              ? 'bg-purple-600 border-purple-400 text-white shadow-md'
              : 'bg-[#120e24] border-[#291f47] text-gray-400 hover:text-white'
          }`}
        >
          Todos ({events.length})
        </button>
        <button
          onClick={() => setFilterStatus('UPCOMING')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold border transition-all ${
            filterStatus === 'UPCOMING'
              ? 'bg-blue-600 border-blue-400 text-white shadow-md'
              : 'bg-[#120e24] border-[#291f47] text-gray-400 hover:text-white'
          }`}
        >
          Próximos Banners
        </button>
        <button
          onClick={() => setFilterStatus('RELEASED')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold border transition-all ${
            filterStatus === 'RELEASED'
              ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
              : 'bg-[#120e24] border-[#291f47] text-gray-400 hover:text-white'
          }`}
        >
          Já Lançados
        </button>
      </div>

      {/* Events Timeline List */}
      <div className="space-y-3">
        {filteredEvents.map((ev, i) => {
          const isReleased = ev.status.includes('Já Lançado') || ev.status.includes('✅');

          return (
            <div
              key={i}
              className="bg-[#120e24] border border-[#251b40] hover:border-purple-500/40 rounded-xl p-4.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:bg-[#16112c]"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                    isReleased 
                      ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300' 
                      : 'bg-amber-950/70 border-amber-500/40 text-amber-300'
                  }`}>
                    {isReleased ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {isReleased ? 'Já Lançado no Global' : 'Próximo no Global'}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">#{ev.index}</span>
                </div>

                <h3 className="text-sm font-bold text-white whitespace-pre-line leading-relaxed">
                  {ev.name}
                </h3>
              </div>

              {/* Dates Box */}
              <div className="flex items-center gap-6 bg-[#0b0817] p-3 rounded-xl border border-[#201738] w-full md:w-auto justify-between md:justify-end text-xs">
                <div>
                  <span className="text-[10px] text-gray-500 block uppercase font-bold">Lançamento JP</span>
                  <span className="font-mono font-medium text-gray-300">{ev.jp_date}</span>
                </div>
                <div className="border-l border-[#201738] pl-4">
                  <span className="text-[10px] text-purple-400 block uppercase font-bold">Previsão Global</span>
                  <span className="font-mono font-bold text-purple-200">{ev.global_date}</span>
                </div>
                {ev.days && (
                  <div className="border-l border-[#201738] pl-4">
                    <span className="text-[10px] text-gray-500 block uppercase font-bold">Distância</span>
                    <span className="font-mono text-gray-400">{ev.days}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
