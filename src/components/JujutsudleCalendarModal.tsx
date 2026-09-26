import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Lock, Sparkles, X } from 'lucide-react';
import { useTranslation } from '../i18n';
import { formatDateDisplay, getDeviceLocalDateString } from '../utils/date';
import { getArchiveDayStatus, type GameMode, type ArchiveDayStatus } from '../utils/jujutsudle';
import { playClick, playTabSwitch } from '../utils/sound';

interface JujutsudleCalendarModalProps {
  selectedDate: string;
  todayStr: string;
  gameMode: GameMode;
  onSelectDate: (dateStr: string) => void;
  onClose: () => void;
}

const MONTH_NAMES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const JujutsudleCalendarModal: React.FC<JujutsudleCalendarModalProps> = ({
  selectedDate,
  todayStr,
  gameMode,
  onSelectDate,
  onClose
}) => {
  const { language, t } = useTranslation();

  // Divide data selecionada para inicializar visualização de mês/ano
  const [initialYear, initialMonth] = useMemo(() => {
    const parts = selectedDate.split('-').map(Number);
    return [parts[0] || 2026, (parts[1] || 9) - 1];
  }, [selectedDate]);

  const [currentYear, setCurrentYear] = useState<number>(initialYear);
  const [currentMonth, setCurrentMonth] = useState<number>(initialMonth);

  const monthNames = language === 'pt' ? MONTH_NAMES_PT : MONTH_NAMES_EN;
  const weekDays = language === 'pt' ? WEEKDAYS_PT : WEEKDAYS_EN;

  // Limite máximo: não navegar além do mês atual de todayStr
  const todayParts = useMemo(() => todayStr.split('-').map(Number), [todayStr]);
  const isFutureMonth = currentYear > todayParts[0] || (currentYear === todayParts[0] && currentMonth >= todayParts[1] - 1);

  const handlePrevMonth = () => {
    playClick();
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (isFutureMonth) return;
    playClick();
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Monta grade do mês
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const cells: Array<{
      dayNumber: number;
      dateStr: string;
      isFuture: boolean;
      isToday: boolean;
      isSelected: boolean;
      status: ArchiveDayStatus;
    } | null> = [];

    // Preenchimento de espaços vazios antes do dia 1
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(null);
    }

    // Dias do mês
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const monthStr = String(currentMonth + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${currentYear}-${monthStr}-${dayStr}`;

      const isFuture = dateStr > todayStr;
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === selectedDate;
      const status = isFuture ? 'unplayed' : getArchiveDayStatus(dateStr, gameMode);

      cells.push({
        dayNumber: day,
        dateStr,
        isFuture,
        isToday,
        isSelected,
        status
      });
    }

    return cells;
  }, [currentYear, currentMonth, todayStr, selectedDate, gameMode]);

  // Ações de atalho: Hoje, Ontem, Dia Aleatório
  const handleSelectToday = () => {
    playTabSwitch();
    onSelectDate(todayStr);
  };

  const handleSelectYesterday = () => {
    playTabSwitch();
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yesterdayStr = getDeviceLocalDateString(d);
    onSelectDate(yesterdayStr);
  };

  const handleSelectRandomPast = () => {
    playTabSwitch();
    // Sorteia um dia nos últimos 30 dias que ainda esteja unplayed ou qualquer dia passado
    const offset = Math.floor(Math.random() * 28) + 1; // 1 a 28 dias atrás
    const d = new Date();
    d.setDate(d.getDate() - offset);
    const pastStr = getDeviceLocalDateString(d);
    onSelectDate(pastStr);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-[#140e28] border border-purple-500/40 rounded-3xl p-6 shadow-2xl space-y-6 animate-scaleUp">
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-black text-white">
              {t.jujutsudle.calendarTitle}
            </h3>
          </div>
          <button 
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-purple-900/30 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Navegação do Mês / Ano */}
        <div className="flex items-center justify-between px-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl bg-[#0e091d] border border-purple-500/30 hover:border-purple-400 text-purple-300 transition cursor-pointer"
            title="Mês Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="text-center">
            <span className="text-base font-black text-purple-200">
              {monthNames[currentMonth]} {currentYear}
            </span>
          </div>

          <button
            onClick={handleNextMonth}
            disabled={isFutureMonth}
            className={`p-2 rounded-xl border transition ${
              isFutureMonth 
                ? 'opacity-30 border-gray-800 text-gray-600 cursor-not-allowed'
                : 'bg-[#0e091d] border-purple-500/30 hover:border-purple-400 text-purple-300 cursor-pointer'
            }`}
            title="Próximo Mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Grade do Calendário */}
        <div className="space-y-2">
          {/* Cabeçalho dos Dias da Semana */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-gray-400 uppercase tracking-wider pb-1">
            {weekDays.map((wd, i) => (
              <div key={i} className="py-1">{wd}</div>
            ))}
          </div>

          {/* Células de Dias */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarCells.map((cell, idx) => {
              if (!cell) {
                return <div key={`empty-${idx}`} className="h-12 rounded-xl" />;
              }

              const { dayNumber, dateStr, isFuture, isToday, isSelected, status } = cell;

              if (isFuture) {
                return (
                  <div
                    key={dateStr}
                    className="h-12 rounded-xl bg-[#090616]/40 border border-gray-900 flex flex-col items-center justify-center opacity-30 cursor-not-allowed"
                    title="Desafio futuro bloqueado"
                  >
                    <span className="text-xs text-gray-600 font-mono">{dayNumber}</span>
                    <Lock className="w-3 h-3 text-gray-700 mt-0.5" />
                  </div>
                );
              }

              return (
                <button
                  key={dateStr}
                  onClick={() => {
                    playClick();
                    onSelectDate(dateStr);
                  }}
                  className={`h-12 rounded-xl border flex flex-col items-center justify-between p-1.5 transition-all duration-200 cursor-pointer relative group ${
                    isSelected
                      ? 'bg-purple-600/40 border-purple-400 ring-2 ring-purple-400 text-white shadow-lg shadow-purple-900/50'
                      : isToday
                        ? 'bg-purple-950/50 border-purple-500/60 text-purple-200 hover:border-purple-400'
                        : 'bg-[#0e091d] border-purple-500/20 text-gray-300 hover:border-purple-500/60 hover:bg-purple-900/20'
                  }`}
                  title={`${formatDateDisplay(dateStr)} — ${
                    status === 'won' ? t.jujutsudle.calendarLegendWon :
                    status === 'lost' ? t.jujutsudle.calendarLegendLost :
                    status === 'played' ? 'Em andamento' : t.jujutsudle.calendarLegendUnplayed
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-xs font-mono font-bold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                      {dayNumber}
                    </span>
                    {isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    )}
                  </div>

                  {/* Marcador de Status */}
                  <div className="w-full flex items-center justify-center">
                    {status === 'won' && (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                    )}
                    {status === 'lost' && (
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
                    )}
                    {status === 'played' && (
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
                    )}
                    {status === 'unplayed' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-600/60" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Legenda de Status */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-400 pt-2 border-t border-purple-500/20">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>{t.jujutsudle.calendarLegendWon}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>{t.jujutsudle.calendarLegendLost}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Em Andamento</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 rounded-full bg-gray-600/60" />
            <span>{t.jujutsudle.calendarLegendUnplayed}</span>
          </div>
        </div>

        {/* Botões de Ação Rápida */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            onClick={handleSelectToday}
            className="py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-sm cursor-pointer text-center"
          >
            {t.jujutsudle.calendarToday}
          </button>

          <button
            onClick={handleSelectYesterday}
            className="py-2 px-3 rounded-xl bg-[#0e091d] border border-purple-500/30 hover:border-purple-400 text-purple-200 text-xs font-bold transition cursor-pointer text-center"
          >
            {t.jujutsudle.calendarYesterday}
          </button>

          <button
            onClick={handleSelectRandomPast}
            className="py-2 px-3 rounded-xl bg-[#0e091d] border border-purple-500/30 hover:border-purple-400 text-purple-200 text-xs font-bold transition cursor-pointer text-center flex items-center justify-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.jujutsudle.calendarRandomPast}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
