import React, { useState, useMemo, useCallback } from 'react';
import { 
  Calculator, 
  Percent, 
  TrendingUp, 
  Coins, 
  Ticket, 
  Target, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw, 
  HelpCircle, 
  Layers, 
  Zap, 
  ArrowRightLeft,
  CheckCircle2
} from 'lucide-react';
import { useTranslation } from '../i18n';
import { useJjkStore } from '../store/useJjkStore';
import { 
  calculatePullProbability, 
  calculatePullsForThreshold, 
  generateProbabilityCurve, 
  getProbabilityTier, 
  formatProbability, 
  cubesToPulls, 
  pullsToCubes, 
  FEATURED_SSR_RATE, 
  BASE_SSR_RATE, 
  PITY_PULLS, 
  CUBES_PER_PULL
} from '../utils/probability';
import { playClick, playSelect } from '../utils/sound';

type BannerRatePreset = 'featured' | 'baseSsr' | 'custom';

export const GachaProbabilityMatrix: React.FC = () => {
  const { t, language } = useTranslation();
  const { savingsPlan } = useJjkStore();

  // Resource inputs
  const [isSyncedWithSavings, setIsSyncedWithSavings] = useState<boolean>(true);
  const [manualCubes, setManualCubes] = useState<number>(30000);
  const [tickets, setTickets] = useState<number>(0);

  // Gacha parameters
  const [ratePreset, setRatePreset] = useState<BannerRatePreset>('featured');
  const [customRatePercent, setCustomRatePercent] = useState<number>(0.7);
  const [targetCopies, setTargetCopies] = useState<number>(1);
  const [includePity, setIncludePity] = useState<boolean>(true);

  // Hover state for interactive SVG chart
  const [hoveredPull, setHoveredPull] = useState<number | null>(null);

  // Instant Converter State
  const [converterCubes, setConverterCubes] = useState<number>(15000);
  const [converterPulls, setConverterPulls] = useState<number>(50);

  // Active Cubes based on sync mode
  const currentCubes = isSyncedWithSavings ? (savingsPlan?.currentCubes ?? 0) : manualCubes;

  // Active Rate
  const currentRate = useMemo(() => {
    if (ratePreset === 'featured') return FEATURED_SSR_RATE;
    if (ratePreset === 'baseSsr') return BASE_SSR_RATE;
    return Math.max(0.0001, (customRatePercent || 0.7) / 100);
  }, [ratePreset, customRatePercent]);

  // Total equivalent pulls from cubes + tickets
  const cubesPulls = cubesToPulls(currentCubes);
  const totalEquivalentPulls = cubesPulls + Math.max(0, tickets);

  // Current Probability calculation
  const currentProb = useMemo(() => {
    return calculatePullProbability(totalEquivalentPulls, currentRate, targetCopies, includePity);
  }, [totalEquivalentPulls, currentRate, targetCopies, includePity]);

  const hasPityGuaranteed = includePity && Math.floor(totalEquivalentPulls / PITY_PULLS) >= targetCopies;
  const currentTier = useMemo(() => {
    return getProbabilityTier(currentProb, hasPityGuaranteed);
  }, [currentProb, hasPityGuaranteed]);

  // Max pulls for curve: dynamic based on pulls and pity
  const maxPulls = useMemo(() => {
    const minScale = 300;
    return Math.max(minScale, Math.ceil((totalEquivalentPulls + 50) / 50) * 50);
  }, [totalEquivalentPulls]);

  // Probability Curve Points
  const curvePoints = useMemo(() => {
    return generateProbabilityCurve(maxPulls, currentRate, targetCopies, includePity);
  }, [maxPulls, currentRate, targetCopies, includePity]);

  // Milestones (50%, 80%, 90%, 99%)
  const milestones = useMemo(() => {
    const thresholds = [
      { key: 'coinToss', value: 0.50, title: t.probabilityMatrix.coinToss, desc: t.probabilityMatrix.coinTossDesc },
      { key: 'safeZone', value: 0.80, title: t.probabilityMatrix.safeZone, desc: t.probabilityMatrix.safeZoneDesc },
      { key: 'highCertainty', value: 0.90, title: t.probabilityMatrix.highCertainty, desc: t.probabilityMatrix.highCertaintyDesc },
      { key: 'nearCertainty', value: 0.99, title: t.probabilityMatrix.nearCertainty, desc: t.probabilityMatrix.nearCertaintyDesc },
    ];

    return thresholds.map(m => {
      const pullsNeeded = calculatePullsForThreshold(m.value, currentRate, targetCopies);
      const cubesNeeded = pullsToCubes(pullsNeeded);
      const isAchieved = totalEquivalentPulls >= pullsNeeded;
      const missingPulls = Math.max(0, pullsNeeded - totalEquivalentPulls);
      const missingCubes = missingPulls * CUBES_PER_PULL;

      return {
        ...m,
        pullsNeeded,
        cubesNeeded,
        isAchieved,
        missingPulls,
        missingCubes,
      };
    });
  }, [currentRate, targetCopies, totalEquivalentPulls, t.probabilityMatrix]);

  // SVG Chart Geometry
  const svgWidth = 800;
  const svgHeight = 360;
  const padding = { top: 30, right: 35, bottom: 50, left: 60 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  const xScale = useCallback((pulls: number) => {
    return padding.left + (Math.max(0, Math.min(maxPulls, pulls)) / maxPulls) * plotWidth;
  }, [maxPulls, padding.left, plotWidth]);

  const yScale = useCallback((prob: number) => {
    const clamped = Math.max(0, Math.min(1, prob));
    return padding.top + (1 - clamped) * plotHeight;
  }, [padding.top, plotHeight]);

  // Path generator
  const curvePath = useMemo(() => {
    if (curvePoints.length === 0) return '';
    return curvePoints.map((pt, idx) => {
      const x = xScale(pt.pulls).toFixed(1);
      const y = yScale(pt.prob).toFixed(1);
      return idx === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    }).join(' ');
  }, [curvePoints, xScale, yScale]);

  const areaPath = useMemo(() => {
    if (curvePoints.length === 0) return '';
    const lastX = xScale(curvePoints[curvePoints.length - 1].pulls).toFixed(1);
    const firstX = xScale(curvePoints[0].pulls).toFixed(1);
    const bottomY = yScale(0).toFixed(1);
    return `${curvePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [curvePath, curvePoints, xScale, yScale]);

  // Interactive Hover Calculation
  const inspectedPull = hoveredPull !== null ? hoveredPull : totalEquivalentPulls;
  const inspectedProb = useMemo(() => {
    return calculatePullProbability(inspectedPull, currentRate, targetCopies, includePity);
  }, [inspectedPull, currentRate, targetCopies, includePity]);

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgX = (mouseX / rect.width) * svgWidth;
    const relativeX = Math.max(0, Math.min(plotWidth, svgX - padding.left));
    const pullValue = Math.round((relativeX / plotWidth) * maxPulls);
    setHoveredPull(pullValue);
  };

  const handleSvgMouseLeave = () => {
    setHoveredPull(null);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#251b40] pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-900/60 to-cyan-950/60 border border-purple-500/40 text-purple-300 shadow-md shadow-purple-950/40">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-cyan-200">
                {t.probabilityMatrix.title}
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                {t.probabilityMatrix.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Sync Status Badge */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              playClick();
              setIsSyncedWithSavings(prev => !prev);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              isSyncedWithSavings
                ? 'bg-purple-950/70 border-purple-500/60 text-purple-200 shadow-inner'
                : 'bg-[#181133] border-purple-900/50 text-gray-300 hover:text-white'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${isSyncedWithSavings ? 'animate-spin-slow' : ''}`} />
            <span>
              {isSyncedWithSavings
                ? t.probabilityMatrix.syncedWithSavings
                : t.probabilityMatrix.manualInput}
            </span>
          </button>
        </div>
      </div>

      {/* Main KPI Highlight: Chance Real & Tier */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chance Highlight Card */}
        <div className="lg:col-span-1 bg-gradient-to-b from-[#16102a] via-[#120d24] to-[#0d091a] border border-purple-800/40 rounded-2xl p-6 relative overflow-hidden shadow-xl flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-cyan-600/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400/90 flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-purple-400" />
                {t.probabilityMatrix.yourChance}
              </span>
              <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${currentTier.badgeBg} ${currentTier.badgeBorder} ${currentTier.badgeText}`}>
                {language === 'en' ? currentTier.labelEn : currentTier.labelPt}
              </span>
            </div>

            {/* Percentage Display */}
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-300 drop-shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                {formatProbability(currentProb, 2)}
              </span>
            </div>

            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              {language === 'en' ? currentTier.descriptionEn : currentTier.descriptionPt}
            </p>
          </div>

          {/* Quick Metrics Inside Card */}
          <div className="mt-6 pt-5 border-t border-purple-900/40 grid grid-cols-2 gap-3">
            <div className="bg-[#1c1433]/70 rounded-xl p-3 border border-purple-900/50">
              <span className="text-[10px] text-gray-400 uppercase font-semibold block mb-0.5">
                {t.probabilityMatrix.totalEquivalentPulls}
              </span>
              <span className="text-lg font-mono font-bold text-amber-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                {totalEquivalentPulls}
              </span>
            </div>
            <div className="bg-[#1c1433]/70 rounded-xl p-3 border border-purple-900/50">
              <span className="text-[10px] text-gray-400 uppercase font-semibold block mb-0.5">
                Pity (250)
              </span>
              <span className="text-lg font-mono font-bold text-purple-300 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-purple-400" />
                {Math.min(totalEquivalentPulls, PITY_PULLS)}/250
              </span>
            </div>
          </div>
        </div>

        {/* Inputs & Parameters Panel */}
        <div className="lg:col-span-2 bg-[#120d24] border border-[#261c42] rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-purple-900/30 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              Parâmetros da Invocação
            </h3>
            <span className="text-xs text-gray-400 font-mono">
              1 Giro = {CUBES_PER_PULL} Cubos
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Cubes Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-400" />
                {t.probabilityMatrix.cubesInput}
                {isSyncedWithSavings && (
                  <span className="text-[10px] text-purple-400 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-700/40">
                    Sincronizado
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type="number"
                  disabled={isSyncedWithSavings}
                  value={currentCubes}
                  onChange={(e) => {
                    const val = Math.max(0, parseInt(e.target.value) || 0);
                    setManualCubes(val);
                  }}
                  step={300}
                  min={0}
                  className={`w-full bg-[#181133] border rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-amber-300 focus:outline-none transition-all ${
                    isSyncedWithSavings
                      ? 'border-purple-900/40 opacity-80 cursor-not-allowed'
                      : 'border-purple-700/60 focus:border-purple-400 focus:ring-1 focus:ring-purple-400'
                  }`}
                />
                <span className="absolute right-3 top-2.5 text-xs text-gray-500 font-semibold pointer-events-none">
                  = {cubesPulls} giros
                </span>
              </div>
            </div>

            {/* Tickets Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Ticket className="w-4 h-4 text-cyan-400" />
                {t.probabilityMatrix.ticketsInput}
              </label>
              <input
                type="number"
                value={tickets}
                onChange={(e) => {
                  const val = Math.max(0, parseInt(e.target.value) || 0);
                  setTickets(val);
                }}
                step={1}
                min={0}
                className="w-full bg-[#181133] border border-purple-900/60 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-cyan-300 focus:outline-none transition-all"
              />
            </div>

            {/* Banner Rate Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-purple-400" />
                {t.probabilityMatrix.bannerRate}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    playSelect();
                    setRatePreset('featured');
                  }}
                  className={`py-2 px-1 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                    ratePreset === 'featured'
                      ? 'bg-purple-900/60 border-purple-500 text-purple-200 shadow-md'
                      : 'bg-[#181133] border-purple-900/40 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Destaque (0.7%)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playSelect();
                    setRatePreset('baseSsr');
                  }}
                  className={`py-2 px-1 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                    ratePreset === 'baseSsr'
                      ? 'bg-purple-900/60 border-purple-500 text-purple-200 shadow-md'
                      : 'bg-[#181133] border-purple-900/40 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Qualquer SSR (2.5%)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playSelect();
                    setRatePreset('custom');
                  }}
                  className={`py-2 px-1 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                    ratePreset === 'custom'
                      ? 'bg-purple-900/60 border-purple-500 text-purple-200 shadow-md'
                      : 'bg-[#181133] border-purple-900/40 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Customizada
                </button>
              </div>

              {ratePreset === 'custom' && (
                <div className="pt-1.5">
                  <input
                    type="number"
                    step="0.1"
                    min="0.01"
                    max="100"
                    value={customRatePercent}
                    onChange={(e) => setCustomRatePercent(parseFloat(e.target.value) || 0.1)}
                    className="w-full bg-[#181133] border border-purple-800 rounded-xl px-3 py-1.5 text-xs font-mono text-white"
                    placeholder="Ex: 0.7 para 0.7%"
                  />
                </div>
              )}
            </div>

            {/* Target Copies Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-red-400" />
                {t.probabilityMatrix.targetCopies}
              </label>
              <select
                value={targetCopies}
                onChange={(e) => {
                  playSelect();
                  setTargetCopies(parseInt(e.target.value) || 1);
                }}
                className="w-full bg-[#181133] border border-purple-900/60 focus:border-purple-400 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-200 focus:outline-none transition-all cursor-pointer"
              >
                <option value={1}>{t.probabilityMatrix.copies1}</option>
                <option value={2}>{t.probabilityMatrix.copies2}</option>
                <option value={3}>{t.probabilityMatrix.copies3}</option>
                <option value={4}>{t.probabilityMatrix.copies4}</option>
                <option value={5}>{t.probabilityMatrix.copies5}</option>
              </select>
            </div>
          </div>

          {/* Include Pity Toggle */}
          <div className="pt-2 border-t border-purple-900/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includePityCheck"
                checked={includePity}
                onChange={(e) => {
                  playClick();
                  setIncludePity(e.target.checked);
                }}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-purple-800 bg-[#181133] cursor-pointer"
              />
              <label htmlFor="includePityCheck" className="text-xs font-bold text-gray-200 cursor-pointer select-none">
                {t.probabilityMatrix.includePity}
              </label>
            </div>
            <span className="text-[11px] font-mono text-purple-400 hidden sm:inline">
              250 giros = 75k cubos
            </span>
          </div>
        </div>
      </div>

      {/* Probability SVG Curve Section */}
      <div className="bg-[#120d24] border border-[#261c42] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-900/30 pb-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              {t.probabilityMatrix.curveTitle}
            </h3>
            <p className="text-xs text-gray-400">
              {t.probabilityMatrix.curveSubtitle}
            </p>
          </div>

          {/* Live Inspection Badge */}
          <div className="flex items-center gap-2 bg-[#191136] border border-purple-800/50 px-3 py-1.5 rounded-xl text-xs font-mono">
            <span className="text-gray-400">
              {hoveredPull !== null ? 'Inspeção:' : 'Seu Saldo:'}
            </span>
            <span className="font-bold text-cyan-300">
              {inspectedPull} giros ({pullsToCubes(inspectedPull).toLocaleString('pt-BR')} cubos)
            </span>
            <span className="text-gray-500">→</span>
            <span className="font-bold text-white">
              {formatProbability(inspectedProb, 2)}
            </span>
          </div>
        </div>

        {/* Responsive Native SVG Chart */}
        <div className="w-full overflow-x-auto select-none">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto min-w-[650px] cursor-crosshair"
            onMouseMove={handleSvgMouseMove}
            onMouseLeave={handleSvgMouseLeave}
          >
            <defs>
              {/* Fill Gradient */}
              <linearGradient id="probGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                <stop offset="60%" stopColor="#a855f7" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#3b0764" stopOpacity="0.0" />
              </linearGradient>

              {/* Stroke Gradient */}
              <linearGradient id="probStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="60%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>

              {/* Glow Filter */}
              <filter id="chartGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Plot Area */}
            <rect
              x={padding.left}
              y={padding.top}
              width={plotWidth}
              height={plotHeight}
              fill="#0d091a"
              rx="8"
            />

            {/* Horizontal Grid Lines (25%, 50%, 75%, 90%, 99%) */}
            {[0.25, 0.50, 0.75, 0.90, 0.99].map((lvl) => {
              const y = yScale(lvl);
              return (
                <g key={`grid-${lvl}`}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={padding.left + plotWidth}
                    y2={y}
                    stroke={lvl === 0.5 ? '#6b21a8' : lvl >= 0.9 ? '#155e75' : '#1e1438'}
                    strokeDasharray={lvl === 0.5 || lvl === 0.9 ? '4 4' : undefined}
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    fill="#9ca3af"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {Math.round(lvl * 100)}%
                  </text>
                </g>
              );
            })}

            {/* Baseline 0% */}
            <line
              x1={padding.left}
              y1={yScale(0)}
              x2={padding.left + plotWidth}
              y2={yScale(0)}
              stroke="#2e1f4d"
              strokeWidth="1"
            />
            <text
              x={padding.left - 8}
              y={yScale(0) + 4}
              textAnchor="end"
              fill="#6b7280"
              fontSize="10"
              fontFamily="monospace"
            >
              0%
            </text>

            {/* Vertical Pull Marks along X-axis */}
            {[50, 100, 150, 200, 250, 300, 350, 400, 500]
              .filter(p => p <= maxPulls)
              .map(p => {
                const x = xScale(p);
                return (
                  <g key={`x-tick-${p}`}>
                    <line
                      x1={x}
                      y1={padding.top}
                      x2={x}
                      y2={padding.top + plotHeight}
                      stroke="#1e1438"
                      strokeWidth="1"
                    />
                    <text
                      x={x}
                      y={padding.top + plotHeight + 16}
                      textAnchor="middle"
                      fill="#9ca3af"
                      fontSize="10"
                      fontFamily="monospace"
                    >
                      {p}
                    </text>
                    <text
                      x={x}
                      y={padding.top + plotHeight + 28}
                      textAnchor="middle"
                      fill="#6b7280"
                      fontSize="8"
                      fontFamily="monospace"
                    >
                      {(p * CUBES_PER_PULL / 1000).toFixed(0)}k
                    </text>
                  </g>
                );
              })}

            {/* Pity Line Marker (250 Pulls) */}
            {includePity && PITY_PULLS <= maxPulls && (
              <g>
                <line
                  x1={xScale(PITY_PULLS)}
                  y1={padding.top}
                  x2={xScale(PITY_PULLS)}
                  y2={padding.top + plotHeight}
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
                <rect
                  x={xScale(PITY_PULLS) - 34}
                  y={padding.top + 6}
                  width="68"
                  height="18"
                  rx="4"
                  fill="#78350f"
                  stroke="#f59e0b"
                  strokeWidth="1"
                />
                <text
                  x={xScale(PITY_PULLS)}
                  y={padding.top + 18}
                  textAnchor="middle"
                  fill="#fef3c7"
                  fontSize="9"
                  fontWeight="bold"
                >
                  PITY 250
                </text>
              </g>
            )}

            {/* Gradient Area Fill */}
            <path d={areaPath} fill="url(#probGradient)" />

            {/* Main Probability Curve Stroke */}
            <path
              d={curvePath}
              fill="none"
              stroke="url(#probStroke)"
              strokeWidth="2.5"
              strokeLinecap="round"
              filter="url(#chartGlow)"
            />

            {/* Current Resources Marker (Vertical Line & Dot) */}
            {totalEquivalentPulls <= maxPulls && (
              <g>
                <line
                  x1={xScale(totalEquivalentPulls)}
                  y1={padding.top}
                  x2={xScale(totalEquivalentPulls)}
                  y2={padding.top + plotHeight}
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
                {/* Glow Dot */}
                <circle
                  cx={xScale(totalEquivalentPulls)}
                  cy={yScale(currentProb)}
                  r="7"
                  fill="#06b6d4"
                  opacity="0.4"
                />
                <circle
                  cx={xScale(totalEquivalentPulls)}
                  cy={yScale(currentProb)}
                  r="4"
                  fill="#ffffff"
                  stroke="#0891b2"
                  strokeWidth="2"
                />
              </g>
            )}

            {/* Hover Inspection Crosshair & Dot */}
            {hoveredPull !== null && hoveredPull <= maxPulls && (
              <g>
                <line
                  x1={xScale(hoveredPull)}
                  y1={padding.top}
                  x2={xScale(hoveredPull)}
                  y2={padding.top + plotHeight}
                  stroke="#a855f7"
                  strokeWidth="1"
                />
                <circle
                  cx={xScale(hoveredPull)}
                  cy={yScale(inspectedProb)}
                  r="5"
                  fill="#e879f9"
                  stroke="#581c87"
                  strokeWidth="2"
                />
              </g>
            )}
          </svg>
        </div>

        {/* Chart Legend */}
        <div className="flex flex-wrap items-center justify-between text-xs text-gray-400 pt-2 border-t border-purple-900/30 gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-gradient-to-r from-purple-400 to-cyan-400 rounded-full" />
              Curva Cumulativa Binomial
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 border border-white" />
              Seu Saldo Atual ({totalEquivalentPulls} giros)
            </span>
            {includePity && (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-amber-400 border-b border-dashed border-amber-400" />
                Pity Garantido (250 giros)
              </span>
            )}
          </div>

          <span className="text-[11px] text-gray-500 font-mono">
            Eixo X: Giros (Pulls) & Cubos / Eixo Y: Probabilidade (%)
          </span>
        </div>
      </div>

      {/* Milestones & Horizon Table */}
      <div className="bg-[#120d24] border border-[#261c42] rounded-2xl p-6 shadow-xl space-y-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" />
            {t.probabilityMatrix.milestonesTitle}
          </h3>
          <p className="text-xs text-gray-400">
            {t.probabilityMatrix.milestonesSubtitle}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-purple-900/40 text-gray-400 font-semibold">
                <th className="py-3 px-4">{t.probabilityMatrix.metricChance}</th>
                <th className="py-3 px-4">{t.probabilityMatrix.metricPulls}</th>
                <th className="py-3 px-4">{t.probabilityMatrix.metricCubes}</th>
                <th className="py-3 px-4">{t.probabilityMatrix.metricStatus}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-950/50 font-mono">
              {milestones.map((m) => (
                <tr
                  key={m.key}
                  className={`transition-colors ${
                    m.isAchieved ? 'bg-emerald-950/20 text-emerald-200' : 'hover:bg-[#181133] text-gray-300'
                  }`}
                >
                  <td className="py-3.5 px-4 font-sans font-bold">
                    <div className="flex flex-col">
                      <span className="text-white text-sm">{m.title}</span>
                      <span className="text-[11px] text-gray-400 font-normal">{m.desc}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-cyan-300 text-sm">
                    {m.pullsNeeded} giros
                  </td>
                  <td className="py-3.5 px-4 font-bold text-amber-300 text-sm">
                    {m.cubesNeeded.toLocaleString('pt-BR')} cubos
                  </td>
                  <td className="py-3.5 px-4 font-sans">
                    {m.isAchieved ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950/60 border border-emerald-500/50 text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {t.probabilityMatrix.statusAchieved}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950/50 border border-amber-600/40 text-amber-300">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Faltam {m.missingPulls} giros ({m.missingCubes.toLocaleString('pt-BR')} cubos)
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Bottom Cards: Instant Converter & Mathematical Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Instant Converter */}
        <div className="bg-[#120d24] border border-[#261c42] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-purple-900/30 pb-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
              {t.probabilityMatrix.converterTitle}
            </h4>
            <span className="text-[11px] text-gray-400 font-mono">
              Fórmula: Cubos ÷ 300
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-[#181133] border border-purple-900/50 p-2.5 rounded-xl">
              <span className="text-[10px] text-gray-400 block font-semibold">1 Tiro</span>
              <span className="font-mono font-bold text-amber-300 text-xs sm:text-sm">300 Cubos</span>
            </div>
            <div className="bg-[#181133] border border-purple-900/50 p-2.5 rounded-xl">
              <span className="text-[10px] text-gray-400 block font-semibold">10 Tiros (Multi)</span>
              <span className="font-mono font-bold text-amber-300 text-xs sm:text-sm">3.000 Cubos</span>
            </div>
            <div className="bg-[#181133] border border-purple-900/50 p-2.5 rounded-xl">
              <span className="text-[10px] text-purple-300 block font-semibold">Pity (250 Tiros)</span>
              <span className="font-mono font-bold text-purple-200 text-xs sm:text-sm">75.000 Cubos</span>
            </div>
          </div>

          {/* Interactive Calculator */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-400">Inserir Cubos:</label>
              <input
                type="number"
                value={converterCubes}
                step={300}
                onChange={(e) => {
                  const c = Math.max(0, parseInt(e.target.value) || 0);
                  setConverterCubes(c);
                  setConverterPulls(cubesToPulls(c));
                }}
                className="w-full bg-[#181133] border border-purple-900/60 rounded-xl px-3 py-2 text-xs font-mono text-amber-300"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-400">Giros Equivalentes:</label>
              <input
                type="number"
                value={converterPulls}
                step={1}
                onChange={(e) => {
                  const p = Math.max(0, parseInt(e.target.value) || 0);
                  setConverterPulls(p);
                  setConverterCubes(pullsToCubes(p));
                }}
                className="w-full bg-[#181133] border border-purple-900/60 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300"
              />
            </div>
          </div>
        </div>

        {/* Mathematical Rigor Note */}
        <div className="bg-[#120d24] border border-[#261c42] rounded-2xl p-6 shadow-xl space-y-3">
          <div className="flex items-center gap-2 border-b border-purple-900/30 pb-3">
            <HelpCircle className="w-4 h-4 text-purple-400" />
            <h4 className="text-sm font-bold text-white">
              {t.probabilityMatrix.mathNoteTitle}
            </h4>
          </div>

          <p className="text-xs text-gray-300 leading-relaxed">
            {t.probabilityMatrix.mathNoteText}
          </p>

          <div className="bg-[#0b0817] p-3 rounded-xl border border-purple-900/40 text-[11px] font-mono text-cyan-200 overflow-x-auto">
            <code>
              P(X ≥ 1) = 1 - (1 - 0.007)^n = 1 - 0.993^n
            </code>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-gray-400 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>100% Offline. Sem dados enviados a servidores externos.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
