import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { TimelineEvent } from '../types';
import { 
  Calendar, 
  Clock, 
  Search, 
  CheckCircle2, 
  Flame, 
  Sparkles, 
  Calculator, 
  Coins, 
  Target, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  TrendingUp,
  Sparkle,
  Ticket,
  CalendarCheck,
  X
} from 'lucide-react';
import { playClick, playSelect, playCubeSummonChime, playTrashDelete, playLevelUp } from '../utils/sound';
import { useJjkStore } from '../store/useJjkStore';
import { formatDateDisplay, getDeviceLocalDateString } from '../utils/date';
import { useTranslation } from '../i18n';

interface TimelineViewProps {
  events: TimelineEvent[];
}

const TODAY_DATE = new Date(Date.UTC(2026, 8, 17, 12, 0, 0)); // 17/09/2026 12:00
const DEFAULT_LAG = 79; // Calibrado: Ijichi lançado em 17/09/2026 às 12:00

const parseDMY = (s: string) => {
  const parts = s.split('/');
  return new Date(Date.UTC(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10), 12, 0, 0));
};

const formatDMY = (date: Date) => {
  const d = String(date.getUTCDate()).padStart(2, '0');
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const y = date.getUTCFullYear();
  return `${d}/${m}/${y}`;
};

export const TimelineView: React.FC<TimelineViewProps> = ({ events }) => {
  const { t, language } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'RELEASED' | 'UPCOMING'>('ALL');
  const [showCalculator, setShowCalculator] = useState(true);
  
  // Calculator state from persistent store
  const upcomingEvents = useMemo(() => events.filter(e => e.status !== 'released'), [events]);
  const savingsPlan = useJjkStore((state) => state.savingsPlan);
  const updateSavingsPlan = useJjkStore((state) => state.updateSavingsPlan);
  const checkAndApplyDailySavings = useJjkStore((state) => state.checkAndApplyDailySavings);
  const simulateNextDay = useJjkStore((state) => state.simulateNextDay);
  const resetSavingsPlan = useJjkStore((state) => state.resetSavingsPlan);
  const dismissDailyIncrementAlert = useJjkStore((state) => state.dismissDailyIncrementAlert);

  // Check and apply 24h daily increment on mount
  useEffect(() => {
    checkAndApplyDailySavings();
  }, [checkAndApplyDailySavings]);

  const selectedBannerIndex = savingsPlan.selectedBannerIndex ?? (upcomingEvents[0]?.index ?? 161);
  const customLag = savingsPlan.customLag ?? DEFAULT_LAG;
  const currentCubes = savingsPlan.currentCubes ?? 15000;
  const dailyCubesIncome = savingsPlan.dailyIncome ?? 350;
  const pityPoints = savingsPlan.pityPoints ?? 0;

  const calcSectionRef = useRef<HTMLDivElement>(null);

  const selectedEvent = useMemo(() => {
    return events.find(e => e.index === selectedBannerIndex) || upcomingEvents[0] || events[0];
  }, [events, selectedBannerIndex, upcomingEvents]);

  // Dynamic calculations with Pity Points and Cards
  const calcResults = useMemo(() => {
    if (!selectedEvent) return null;
    const jpDate = parseDMY(selectedEvent.jp_date);
    const predictedGlobal = new Date(jpDate.getTime());
    predictedGlobal.setUTCDate(predictedGlobal.getUTCDate() + customLag);

    const diffMs = predictedGlobal.getTime() - TODAY_DATE.getTime();
    const daysRemaining = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));

    const accumulatedCubes = daysRemaining * dailyCubesIncome;
    const totalProjectedCubes = currentCubes + accumulatedCubes;
    const pullsFromCubes = Math.floor(totalProjectedCubes / 300);
    const totalPulls = pullsFromCubes + pityPoints;
    const pityTargetPulls = 250;
    const pityProgress = Math.min(100, Math.round((totalPulls / pityTargetPulls) * 100));
    const missingPulls = Math.max(0, pityTargetPulls - totalPulls);
    const missingCubes = missingPulls * 300;
    const isGuaranteed = totalPulls >= pityTargetPulls;

    return {
      predictedGlobalFormatted: formatDMY(predictedGlobal),
      daysRemaining,
      accumulatedCubes,
      totalProjectedCubes,
      pullsFromCubes,
      totalPulls,
      pityPoints,
      pityProgress,
      missingCubes,
      missingPulls,
      isGuaranteed
    };
  }, [selectedEvent, customLag, currentCubes, dailyCubesIncome, pityPoints]);

  const handleSelectBannerForCalc = (evIndex: number) => {
    playSelect();
    updateSavingsPlan({ selectedBannerIndex: evIndex });
    setShowCalculator(true);
    calcSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

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
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {t.timeline.serverJpAndGlobal}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
              <Sparkle className="w-3 h-3 text-emerald-400" />
              {t.timeline.lagCalibrated.replace('{days}', '79')}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {t.timeline.milestoneIjichi}
            </span>
          </div>
          <h1 className="text-3xl font-black text-white font-serif tracking-tight flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-400" />
            {t.timeline.title.toUpperCase()}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {t.timeline.subtitle}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
          <input
            type="text"
            placeholder={t.timeline.searchPlaceholder}
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
          <h3 className="font-bold text-sm text-blue-200 flex items-center gap-2">
            <span>{t.timeline.calibCardTitle}</span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-900/60 text-emerald-300 border border-emerald-500/40">
              {t.timeline.calibCardDate}
            </span>
          </h3>
          <p className="leading-relaxed">
            {t.timeline.calibCardDesc}
          </p>
        </div>
      </div>

      {/* Interactive Calculator Section */}
      <div ref={calcSectionRef} className="bg-gradient-to-br from-[#150f2e] via-[#181135] to-[#0f0b21] border border-purple-500/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="flex items-center justify-between gap-4 border-b border-[#2d2054] pb-4 mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-purple-600/20 border border-purple-500/40 text-purple-300">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <span>{t.timeline.calculatorTitle.toUpperCase()}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {t.timeline.calculatorBadge}
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                {language === 'pt' 
                  ? 'Simule datas de chegada, acumulação de cubos e planejamento de pity para qualquer banner futuro.' 
                  : 'Simulate arrival dates, cube accumulation, and pity planning for any upcoming banner.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playClick();
              setShowCalculator(!showCalculator);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#120c24] border border-[#2d2250] text-gray-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
          >
            <span>{showCalculator ? t.timeline.collapse : t.timeline.expand}</span>
            {showCalculator ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showCalculator && calcResults && (
          <div className="space-y-6 relative z-10 animate-fadeIn">
            {/* Daily Increment Notification Banner */}
            {(savingsPlan.lastIncrementAmount ?? 0) > 0 && (
              <div className="bg-gradient-to-r from-emerald-950/80 via-teal-950/70 to-[#120d24] border border-emerald-500/40 rounded-2xl p-4 flex items-center justify-between gap-4 text-xs animate-fadeIn shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shrink-0">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <span className="font-black text-emerald-300 text-sm flex items-center gap-2">
                      <span>{t.timeline.dailyAppliedTitle}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 font-mono">
                        {t.timeline.dailyAppliedDays.replace('{days}', String(savingsPlan.lastIncrementDays ?? 1))}
                      </span>
                    </span>
                    <p className="text-gray-300 mt-0.5">
                      {t.timeline.dailyAppliedDesc.replace('{amount}', (savingsPlan.lastIncrementAmount ?? 0).toLocaleString())}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    playClick();
                    dismissDailyIncrementAlert();
                  }}
                  className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 transition-colors cursor-pointer shrink-0"
                  title={t.timeline.dismissAlert}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Daily Auto-Tracking & Persistence Status Bar */}
            <div className="bg-[#0c0919] border border-[#2b1f4c] rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-inner">
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={savingsPlan.autoDailyIncrementEnabled}
                    onChange={(e) => {
                      playClick();
                      updateSavingsPlan({ autoDailyIncrementEnabled: e.target.checked });
                    }}
                    className="accent-purple-500 rounded cursor-pointer w-4 h-4"
                  />
                  <span className="font-bold text-gray-300 hover:text-white transition-colors">
                    {t.timeline.autoDailyIncrement}
                  </span>
                </label>
                <span className="text-gray-600 text-[11px] hidden sm:inline">•</span>
                <span className="text-[11px] text-gray-400 flex items-center gap-1.5">
                  <CalendarCheck className="w-3.5 h-3.5 text-purple-400" />
                  {t.timeline.lastSync} <strong className="text-purple-300 font-mono">{formatDateDisplay(savingsPlan.lastUpdatedDate)}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    playLevelUp();
                    simulateNextDay();
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/35 border border-purple-500/40 rounded-xl text-purple-300 hover:text-white font-bold text-[11px] transition-all cursor-pointer shadow-sm"
                  title={t.timeline.simulateDayTitle}
                >
                  <TrendingUp className="w-3 h-3 text-purple-400" />
                  <span>{t.timeline.simulateDay.replace('{amount}', dailyCubesIncome.toLocaleString())}</span>
                </button>
                <button
                  onClick={() => {
                    playTrashDelete();
                    resetSavingsPlan();
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-800/40 hover:bg-gray-800/80 border border-gray-700/50 rounded-xl text-gray-400 hover:text-gray-200 text-[11px] transition-all cursor-pointer"
                  title={t.timeline.restoreTitle}
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t.timeline.restore}</span>
                </button>
              </div>
            </div>

            {/* Controls Grid - 4 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Banner Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-purple-400" />
                  <span>{t.timeline.bannerTarget}</span>
                </label>
                <select
                  value={selectedBannerIndex}
                  onChange={(e) => {
                    playSelect();
                    updateSavingsPlan({ selectedBannerIndex: Number(e.target.value) });
                  }}
                  className="w-full bg-[#0e0a1c] border border-[#302257] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-400 cursor-pointer shadow-inner"
                >
                  {upcomingEvents.map((ev) => (
                    <option key={ev.index} value={ev.index}>
                      #{ev.index} — {ev.name} ({ev.days || (language === 'pt' ? 'Futuro' : 'Future')})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-gray-500 block truncate">
                  {t.timeline.jpReleaseLabel} <strong>{selectedEvent.jp_date}</strong>
                </span>
              </div>

              {/* Cubes Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.timeline.currentCubesLabel}</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={currentCubes}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                      updateSavingsPlan({ currentCubes: val, lastUpdatedDate: getDeviceLocalDateString() });
                    }}
                    className="w-full bg-[#0e0a1c] border border-[#302257] rounded-xl px-3.5 py-2 text-sm font-mono text-amber-300 focus:outline-none focus:border-amber-400 shadow-inner"
                  />
                  <button
                    onClick={() => {
                      playCubeSummonChime();
                      updateSavingsPlan({ currentCubes: currentCubes + 3000, lastUpdatedDate: getDeviceLocalDateString() });
                    }}
                    className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 rounded-xl text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition-all cursor-pointer whitespace-nowrap"
                    title={t.timeline.add3kCubesTitle}
                  >
                    +3k
                  </button>
                </div>
                <span className="text-[10px] text-gray-500 block">
                  {t.timeline.cubesEquivalent.replace('{pulls}', String(Math.floor(currentCubes / 300)))}
                </span>
              </div>

              {/* Daily Income Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.timeline.dailyIncomeLabel}</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={dailyCubesIncome}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                      updateSavingsPlan({ dailyIncome: val });
                    }}
                    className="w-full bg-[#0e0a1c] border border-[#302257] rounded-xl px-3.5 py-2 text-sm font-mono text-emerald-300 focus:outline-none focus:border-emerald-400 shadow-inner"
                  />
                  <span className="text-xs text-gray-400 shrink-0">{t.timeline.cubesPerDay}</span>
                </div>
                <span className="text-[10px] text-gray-500 block">
                  {t.timeline.estimatedMonthly.replace('{amount}', (dailyCubesIncome * 30).toLocaleString())}
                </span>
              </div>

              {/* Pity Points & Gacha Cards Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{t.timeline.pityPointsLabel}</span>
                  </span>
                  <span className="text-[10px] text-cyan-400 font-mono font-bold">
                    {t.timeline.pityPointsCounter.replace('{points}', String(pityPoints))}
                  </span>
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max="250"
                    step="1"
                    value={pityPoints}
                    onChange={(e) => {
                      const val = Math.min(250, Math.max(0, parseInt(e.target.value, 10) || 0));
                      updateSavingsPlan({ pityPoints: val });
                    }}
                    className="w-full bg-[#0e0a1c] border border-[#302257] rounded-xl px-3 py-2 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-400 shadow-inner"
                  />
                  <button
                    onClick={() => {
                      playCubeSummonChime();
                      updateSavingsPlan({ pityPoints: Math.min(250, pityPoints + 1) });
                    }}
                    className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded-xl text-xs font-bold text-cyan-300 hover:bg-cyan-500/30 transition-all cursor-pointer whitespace-nowrap"
                    title={t.timeline.add1PointTitle}
                  >
                    +1
                  </button>
                  <button
                    onClick={() => {
                      playCubeSummonChime();
                      updateSavingsPlan({ pityPoints: Math.min(250, pityPoints + 10) });
                    }}
                    className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded-xl text-xs font-bold text-cyan-300 hover:bg-cyan-500/30 transition-all cursor-pointer whitespace-nowrap"
                    title={t.timeline.add10PointsTitle}
                  >
                    +10
                  </button>
                </div>
                <span className="text-[10px] text-gray-500 block truncate">
                  {pityPoints > 0 ? (
                    <span className="text-cyan-400 font-medium">
                      {t.timeline.pityPointsAbate.replace('{amount}', (pityPoints * 300).toLocaleString())}
                    </span>
                  ) : (
                    <span>{t.timeline.pityPointsHint}</span>
                  )}
                </span>
              </div>
            </div>

            {/* Simulated Lag Slider */}
            <div className="bg-[#0f0b1f] border border-[#2c1f4e] rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300 font-bold flex items-center gap-2">
                  <span>{t.timeline.lagSliderLabel}</span>
                  <span className="font-mono text-purple-300 px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/40">
                    {t.timeline.lagSliderDays.replace('{days}', String(customLag))}
                  </span>
                  {customLag === DEFAULT_LAG && (
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/30">
                      {t.timeline.lagSliderOfficial}
                    </span>
                  )}
                </span>
                {customLag !== DEFAULT_LAG && (
                  <button
                    onClick={() => {
                      playClick();
                      updateSavingsPlan({ customLag: DEFAULT_LAG });
                    }}
                    className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-200 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{t.timeline.resetLag}</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[11px] text-gray-500">50d</span>
                <input
                  type="range"
                  min="50"
                  max="110"
                  value={customLag}
                  onChange={(e) => updateSavingsPlan({ customLag: Number(e.target.value) })}
                  className="w-full accent-purple-500 cursor-pointer"
                />
                <span className="text-[11px] text-gray-500">110d</span>
              </div>
            </div>

            {/* Results Display */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Data Prevista */}
              <div className="bg-[#0f0a21] border border-blue-500/30 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] text-blue-400 uppercase font-bold tracking-wider">
                  {t.timeline.cardArrival}
                </span>
                <div className="text-xl font-black text-white font-mono">
                  {calcResults.predictedGlobalFormatted}
                </div>
                <span className="text-xs text-blue-300/80 font-bold">
                  {calcResults.daysRemaining === 0 
                    ? t.timeline.arrivesToday 
                    : t.timeline.daysRemainingCount.replace('{days}', String(calcResults.daysRemaining))}
                </span>
              </div>

              {/* Card 2: Acúmulo no Período */}
              <div className="bg-[#0f0a21] border border-purple-500/30 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] text-purple-400 uppercase font-bold tracking-wider">
                  {t.timeline.cardIncome}
                </span>
                <div className="text-xl font-black text-purple-200 font-mono">
                  +{calcResults.accumulatedCubes.toLocaleString()}
                </div>
                <span className="text-xs text-gray-400">
                  {t.timeline.incomeFormula
                    .replace('{days}', String(calcResults.daysRemaining))
                    .replace('{daily}', String(dailyCubesIncome))}
                </span>
              </div>

              {/* Card 3: Total Projetado */}
              <div className="bg-[#0f0a21] border border-amber-500/30 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">
                  {t.timeline.cardTotal}
                </span>
                <div className="text-xl font-black text-amber-300 font-mono">
                  {calcResults.totalProjectedCubes.toLocaleString()}
                </div>
                <span className="text-xs text-amber-200/80 font-bold">
                  {t.timeline.cardTotalPulls.replace('{pulls}', String(calcResults.pullsFromCubes))} {pityPoints > 0 && t.timeline.cardTotalPityExtra.replace('{pts}', String(pityPoints))}
                </span>
              </div>

              {/* Card 4: Meta Pity */}
              <div className={`border rounded-2xl p-4 space-y-1 ${
                calcResults.isGuaranteed 
                  ? 'bg-emerald-950/40 border-emerald-500/40' 
                  : 'bg-[#0f0a21] border-rose-500/30'
              }`}>
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                  {t.timeline.cardPityTarget}
                </span>
                <div className="flex items-center justify-between">
                  <span className={`text-xl font-black font-mono ${
                    calcResults.isGuaranteed ? 'text-emerald-300' : 'text-rose-300'
                  }`}>
                    {calcResults.pityProgress}%
                  </span>
                  <span className="text-[11px] text-gray-400 font-mono">
                    {t.timeline.pullsFraction.replace('{total}', String(calcResults.totalPulls))}
                  </span>
                </div>
                <div className="w-full bg-[#1e1436] rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 rounded-full ${
                      calcResults.isGuaranteed 
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                        : 'bg-gradient-to-r from-purple-500 to-amber-400'
                    }`}
                    style={{ width: `${calcResults.pityProgress}%` }}
                  />
                </div>
                {pityPoints > 0 && (
                  <span className="text-[10px] text-cyan-400 font-mono block">
                    {t.timeline.includesPityPts
                      .replace('{pts}', String(pityPoints))
                      .replace('{cubes}', (pityPoints * 300).toLocaleString())}
                  </span>
                )}
              </div>
            </div>

            {/* Verdict Alert */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 text-xs ${
              calcResults.isGuaranteed
                ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
            }`}>
              <div className="flex items-center gap-3">
                {calcResults.isGuaranteed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <Flame className="w-5 h-5 text-amber-400 shrink-0" />
                )}
                <div>
                  <div className="font-bold text-sm">
                    {calcResults.isGuaranteed 
                      ? t.timeline.pityGuaranteedTitle
                      : t.timeline.pityMissingTitle
                          .replace('{cubes}', calcResults.missingCubes.toLocaleString())
                          .replace('{pulls}', String(calcResults.missingPulls))
                    }
                  </div>
                  <p className="text-[11px] opacity-80 mt-0.5 leading-relaxed">
                    {calcResults.isGuaranteed
                      ? t.timeline.pityGuaranteedDesc
                          .replace('{total}', String(calcResults.totalPulls))
                          .replace('{pulls}', String(calcResults.pullsFromCubes))
                          .replace('{cubes}', calcResults.totalProjectedCubes.toLocaleString())
                          .replace('{pts}', String(calcResults.pityPoints))
                      : t.timeline.pityMissingDesc
                          .replace('{daily}', String(dailyCubesIncome))
                          .replace('{pts}', String(calcResults.pityPoints))
                          .replace('{total}', String(calcResults.totalPulls))
                          .replace('{cubes}', calcResults.missingCubes.toLocaleString())
                          .replace('{pulls}', String(calcResults.missingPulls))
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
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
          {t.timeline.tabAll} ({events.length})
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
          <span>{t.timeline.tabUpcoming} ({upcomingCount})</span>
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
          <span>{t.timeline.tabReleased} ({releasedCount})</span>
        </button>
      </div>

      {/* Events Timeline List */}
      <div className="space-y-3">
        {filteredEvents.map((ev) => {
          const isReleased = ev.status === 'released';
          const isCurrent = ev.status === 'current';
          const isSelectedInCalc = ev.index === selectedBannerIndex;

          return (
            <div
              key={ev.index}
              className={`border rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all shadow-md ${
                isCurrent 
                  ? 'bg-gradient-to-r from-[#1f153a] via-[#241744] to-[#160e2a] border-amber-500/70 shadow-amber-950/30 ring-1 ring-amber-500/40' 
                  : isSelectedInCalc
                    ? 'bg-[#1a1236] border-purple-500/70 ring-1 ring-purple-500/50'
                    : isReleased
                      ? 'bg-[#110c22] border-[#251b40] hover:border-purple-500/40 hover:bg-[#16102c]'
                      : 'bg-[#140e28] border-blue-500/40 shadow-blue-950/20'
              }`}
            >
              {/* Event Content */}
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
                    isCurrent
                      ? 'bg-amber-950/90 border-amber-500/70 text-amber-300 animate-pulse'
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
                    {ev.status_label || (isReleased ? t.timeline.releasedInGlobal : t.timeline.upcomingInGlobal)}
                  </span>
                  
                  {ev.days && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1d1636] text-purple-300 border border-purple-800/40">
                      {ev.days}
                    </span>
                  )}

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

              {/* Dates Box & Action */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
                <div className="flex items-center gap-6 bg-[#0a0714] px-4 py-3 rounded-xl border border-[#23183d] justify-between md:justify-end text-xs shadow-inner">
                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">
                      {language === 'pt' ? 'Lançamento JP' : 'JP Release'}
                    </span>
                    <span className="font-mono font-bold text-gray-300 text-sm">
                      {ev.jp_date}
                    </span>
                  </div>

                  <div className="border-l border-[#241a42] pl-5">
                    <span className="text-[10px] text-purple-400 block uppercase font-bold tracking-wider">
                      {language === 'pt' ? 'Previsão Global' : 'Global Forecast'}
                    </span>
                    <span className="font-mono font-black text-purple-200 text-sm">
                      {ev.global_date}
                    </span>
                  </div>
                </div>

                {!isReleased && (
                  <button
                    onClick={() => handleSelectBannerForCalc(ev.index)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/40 text-purple-300 hover:text-white text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                    title={t.timeline.calculateTitle}
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>{t.timeline.calculate}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredEvents.length === 0 && (
          <div className="text-center py-12 bg-[#120e24] border border-[#251b40] rounded-2xl">
            <Calendar className="w-10 h-10 text-gray-600 mx-auto mb-2" />
            <div className="text-base font-bold text-gray-300">{t.timeline.noEventsFound}</div>
            <div className="text-xs text-gray-500 mt-1">
              {t.timeline.noEventsDesc}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
