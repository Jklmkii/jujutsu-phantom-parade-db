import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Zap,
  Clock,
  BatteryCharging,
  AlertTriangle,
  CheckCircle2,
  ListTodo,
  Volume2,
  RefreshCw,
  Sparkles,
  Calendar,
  Gift,
  ShoppingBag,
  Swords,
  RotateCcw,
  CheckCheck,
} from 'lucide-react';
import { useTranslation } from '../i18n';
import { playSelect, playCubeSummonChime, playSuccessFanfare } from '../utils/sound';
import {
  DEFAULT_MAX_AP,
  DEFAULT_RECHARGE_MINUTES_PER_AP,
  DEFAULT_DAILY_ROUTINE,
  calculateFullTime,
  formatSecondsToCountdown,
  getDailyStorageDateKey,
  loadDailyRoutineProgress,
  saveDailyRoutineProgress,
  type DailyRoutineTask,
  type RoutineCategory,
} from '../utils/stamina';

export function StaminaTracker() {
  const { language } = useTranslation();
  const isEn = language === 'en';

  // --- Base Persisted States for AP Tracker ---
  const [baseAp, setBaseAp] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jjkppdb_stamina_current');
      if (saved !== null) {
        const val = parseInt(saved, 10);
        if (!isNaN(val)) return val;
      }
    }
    return 60;
  });

  const [baseTimestamp, setBaseTimestamp] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jjkppdb_stamina_timestamp');
      if (saved !== null) {
        const val = parseInt(saved, 10);
        if (!isNaN(val)) return val;
      }
    }
    return Date.now();
  });

  const [maxAp, setMaxAp] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jjkppdb_stamina_max');
      if (saved !== null) {
        const val = parseInt(saved, 10);
        if (!isNaN(val)) return val;
      }
    }
    return DEFAULT_MAX_AP;
  });

  const [rechargeMinutes, setRechargeMinutes] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jjkppdb_stamina_rate');
      if (saved !== null) {
        const val = parseFloat(saved);
        if (!isNaN(val)) return val;
      }
    }
    return DEFAULT_RECHARGE_MINUTES_PER_AP;
  });

  // Current real-time clock tick (updates every 1s)
  const [nowTick, setNowTick] = useState<number>(() => Date.now());

  // View segment tabs ('all', 'tracker', 'routine')
  const [activeTab, setActiveTab] = useState<'all' | 'tracker' | 'routine'>('all');

  // Audio alert controls
  const [soundAlertEnabled, setSoundAlertEnabled] = useState<boolean>(true);
  const notifiedFullRef = useRef<boolean>(false);

  // Daily Routine checklist state
  const todayKey = useMemo(() => getDailyStorageDateKey(), []);
  const [routineState, setRoutineState] = useState<Record<string, boolean>>(() =>
    loadDailyRoutineProgress(todayKey)
  );

  // Real-time tick interval
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute effective real-time AP purely derived from baseAp, timestamp, and rate
  const currentAp = useMemo(() => {
    const secondsPerAp = rechargeMinutes * 60;
    if (secondsPerAp <= 0 || baseAp >= maxAp) {
      return baseAp;
    }
    const elapsedSeconds = Math.max(0, Math.floor((nowTick - baseTimestamp) / 1000));
    const gainedAp = Math.floor(elapsedSeconds / secondsPerAp);
    return Math.min(maxAp, baseAp + gainedAp);
  }, [baseAp, maxAp, rechargeMinutes, nowTick, baseTimestamp]);

  // Persist AP settings whenever base values change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('jjkppdb_stamina_current', baseAp.toString());
      localStorage.setItem('jjkppdb_stamina_timestamp', baseTimestamp.toString());
      localStorage.setItem('jjkppdb_stamina_max', maxAp.toString());
      localStorage.setItem('jjkppdb_stamina_rate', rechargeMinutes.toString());
    }
  }, [baseAp, baseTimestamp, maxAp, rechargeMinutes]);

  // Calculations for full recharge
  const calc = useMemo(() => {
    return calculateFullTime(currentAp, maxAp, rechargeMinutes);
  }, [currentAp, maxAp, rechargeMinutes]);

  // Seconds until the next +1 AP point
  const secondsToNextAp = useMemo(() => {
    if (currentAp >= maxAp) return 0;
    const secondsPerAp = rechargeMinutes * 60;
    const elapsed = Math.max(0, Math.floor((nowTick - baseTimestamp) / 1000));
    const rem = secondsPerAp - (elapsed % secondsPerAp);
    return rem <= 0 ? secondsPerAp : rem;
  }, [currentAp, maxAp, rechargeMinutes, nowTick, baseTimestamp]);

  // Audio alert trigger when 100% full is reached (using ref to avoid state cascading)
  useEffect(() => {
    if (calc.isFull && !notifiedFullRef.current && soundAlertEnabled) {
      playCubeSummonChime();
      notifiedFullRef.current = true;
    } else if (!calc.isFull) {
      notifiedFullRef.current = false;
    }
  }, [calc.isFull, soundAlertEnabled]);

  // Handle AP adjustment safely
  const handleApChange = useCallback(
    (newVal: number) => {
      const clamped = Math.max(0, Math.min(maxAp * 3, Math.floor(newVal)));
      setBaseAp(clamped);
      setBaseTimestamp(Date.now());
    },
    [maxAp]
  );

  const handleQuickAdd = useCallback(
    (delta: number) => {
      playSelect();
      handleApChange(currentAp + delta);
    },
    [currentAp, handleApChange]
  );

  // Toggle routine item
  const toggleRoutineItem = useCallback(
    (taskId: string) => {
      playSelect();
      setRoutineState((prev) => {
        const next = { ...prev, [taskId]: !prev[taskId] };
        saveDailyRoutineProgress(next, todayKey);
        return next;
      });
    },
    [todayKey]
  );

  // Mark all / reset routine items
  const handleMarkAllRoutine = (completed: boolean) => {
    if (completed) {
      playSuccessFanfare();
    } else {
      playSelect();
    }
    const next: Record<string, boolean> = {};
    DEFAULT_DAILY_ROUTINE.forEach((t) => {
      next[t.id] = completed;
    });
    setRoutineState(next);
    saveDailyRoutineProgress(next, todayKey);
  };

  // Routine completion stats
  const routineStats = useMemo(() => {
    const total = DEFAULT_DAILY_ROUTINE.length;
    const done = DEFAULT_DAILY_ROUTINE.filter((t) => !!routineState[t.id]).length;
    const pct = Math.round((done / total) * 100);
    return { done, total, pct };
  }, [routineState]);

  // Category Icon Resolver
  const getCategoryIcon = (category: RoutineCategory) => {
    switch (category) {
      case 'stamina':
        return <BatteryCharging className="w-4 h-4 text-emerald-400" />;
      case 'missions':
        return <Swords className="w-4 h-4 text-indigo-400" />;
      case 'shop':
        return <ShoppingBag className="w-4 h-4 text-amber-400" />;
      case 'events':
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      default:
        return <ListTodo className="w-4 h-4 text-slate-400" />;
    }
  };

  const getCategoryBadgeLabel = (category: RoutineCategory) => {
    switch (category) {
      case 'stamina':
        return isEn ? 'AP / Stamina' : 'AP / Estamina';
      case 'missions':
        return isEn ? 'Missions' : 'Missões';
      case 'shop':
        return isEn ? 'Shop' : 'Loja';
      case 'events':
        return isEn ? 'Event' : 'Evento';
      default:
        return category;
    }
  };

  // Danger warning state for AP
  const isNearOverflow = calc.percentage >= 90 && !calc.isFull;
  const isOverflow = currentAp > maxAp;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-slate-100">
      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#120d24] via-[#171130] to-[#0c0918] border border-purple-900/40 p-6 shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-48 h-48 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3.5 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-400 shadow-inner">
              <Zap className="w-8 h-8 animate-pulse text-purple-300" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                {isEn ? 'AP Stamina & Daily Routine' : 'Rastreador de AP & Rotina Diária'}
                <span className="text-xs font-semibold uppercase px-2.5 py-0.5 rounded-full bg-purple-900/60 text-purple-300 border border-purple-600/40">
                  {isEn ? 'Phantom Engine' : 'Motor Tático'}
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                {isEn
                  ? 'Monitor your Cursed Energy (AP) recovery in real time, prevent energy overflow, and manage your daily Jujutsu checklist.'
                  : 'Monitore o fluxo de recuperação da sua Energia Amaldiçoada (AP), evite desperdício por acúmulo e complete o checklist diário da escola Jujutsu.'}
              </p>
            </div>
          </div>

          {/* Quick Sound Test & Controls */}
          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={() => {
                playCubeSummonChime();
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-900/30 hover:bg-purple-800/40 text-purple-200 border border-purple-700/40 text-xs font-semibold transition-all hover:scale-105 active:scale-95 shadow-sm"
              title={isEn ? 'Test Chime Alert' : 'Testar Som de Alerta'}
            >
              <Volume2 className="w-4 h-4 text-purple-400" />
              <span>{isEn ? 'Test Chime' : 'Testar Alerta'}</span>
            </button>

            <button
              onClick={() => {
                playSelect();
                setSoundAlertEnabled(!soundAlertEnabled);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                soundAlertEnabled
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-900/60 border-slate-700/40 text-slate-400'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{soundAlertEnabled ? (isEn ? 'Alerts ON' : 'Alertas Ativos') : (isEn ? 'Alerts OFF' : 'Alertas Mudos')}</span>
            </button>
          </div>
        </div>

        {/* View Segment Switcher */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-purple-900/30">
          <button
            onClick={() => {
              playSelect();
              setActiveTab('all');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'all'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                : 'bg-purple-950/30 text-slate-400 hover:text-slate-200'
            }`}
          >
            {isEn ? 'Dual Overview' : 'Visão Completa'}
          </button>
          <button
            onClick={() => {
              playSelect();
              setActiveTab('tracker');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'tracker'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                : 'bg-purple-950/30 text-slate-400 hover:text-slate-200'
            }`}
          >
            {isEn ? 'AP Stamina Only' : 'Apenas AP / Estamina'}
          </button>
          <button
            onClick={() => {
              playSelect();
              setActiveTab('routine');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'routine'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                : 'bg-purple-950/30 text-slate-400 hover:text-slate-200'
            }`}
          >
            {isEn ? 'Daily Routine' : 'Rotina Diária'} ({routineStats.done}/{routineStats.total})
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =========================================
            LEFT COLUMN: AP STAMINA TRACKER
           ========================================= */}
        {(activeTab === 'all' || activeTab === 'tracker') && (
          <div
            className={`space-y-6 ${
              activeTab === 'all' ? 'lg:col-span-7' : 'lg:col-span-12'
            }`}
          >
            {/* Main Interactive AP Card */}
            <div className="rounded-2xl bg-[#140f26]/90 border border-purple-800/30 p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <BatteryCharging className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-lg font-bold text-slate-100">
                    {isEn ? 'Stamina Pool Status' : 'Painel de Energia Amaldiçoada (AP)'}
                  </h2>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  <span>
                    {isEn ? 'Rate: 1 AP every' : 'Taxa: 1 AP a cada'}{' '}
                    <strong className="text-purple-300 font-semibold">{rechargeMinutes} min</strong>
                  </span>
                </div>
              </div>

              {/* Big Visual Progress Bar with Energy Glow */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black tracking-tight text-white">
                      {currentAp}
                    </span>
                    <span className="text-slate-400 font-medium">/ {maxAp} AP</span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-lg font-bold ${
                        calc.isFull
                          ? 'text-emerald-400'
                          : isNearOverflow
                          ? 'text-amber-400'
                          : 'text-purple-300'
                      }`}
                    >
                      {calc.percentage}%
                    </span>
                  </div>
                </div>

                {/* Progress bar container */}
                <div className="relative w-full h-4 bg-slate-950/80 rounded-full overflow-hidden border border-purple-900/40 p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 relative ${
                      calc.isFull
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                        : isOverflow
                        ? 'bg-gradient-to-r from-amber-500 to-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]'
                        : isNearOverflow
                        ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500'
                        : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-400 shadow-[0_0_12px_rgba(147,51,234,0.35)]'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(2, calc.percentage))}%` }}
                  >
                    {/* Animated shine line */}
                    <div className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none" />
                  </div>
                </div>

                {/* Next AP Tick Indicator */}
                {!calc.isFull && (
                  <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
                    <span>
                      {isEn ? 'Missing to Cap:' : 'Faltando para o Limite:'}{' '}
                      <strong className="text-slate-200">{calc.missingAp} AP</strong>
                    </span>
                    <span className="flex items-center gap-1 text-purple-300 font-mono">
                      <RefreshCw className="w-3 h-3 animate-spin text-purple-400" />
                      {isEn ? 'Next +1 AP in:' : 'Próximo +1 AP em:'}{' '}
                      <span className="text-white font-bold">{secondsToNextAp}s</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Warning/Alert Banner if Near Cap or Overflow */}
              {calc.isFull ? (
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-200">
                      {isEn ? 'Stamina is 100% Full!' : 'Estamina 100% Cheia!'}
                    </p>
                    <p className="text-xs text-emerald-300/80 mt-0.5">
                      {isEn
                        ? 'Your AP has reached maximum capacity. Spend it now to prevent wasted natural recharge time!'
                        : 'Sua estamina atingiu o teto máximo. Gaste-a em missões para não desperdiçar o tempo de recarga contínua!'}
                    </p>
                  </div>
                </div>
              ) : isOverflow ? (
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-200">
                      {isEn ? 'Stamina Overflow (Bonus AP)' : 'AP Acima do Limite (Estamina Bônus)'}
                    </p>
                    <p className="text-xs text-amber-300/80 mt-0.5">
                      {isEn
                        ? 'Natural AP recovery is paused while over maximum capacity.'
                        : 'A recarga natural de AP fica pausada enquanto seu total estiver acima do limite máximo.'}
                    </p>
                  </div>
                </div>
              ) : isNearOverflow ? (
                <div className="p-3.5 rounded-xl bg-purple-950/40 border border-amber-500/40 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-200">
                      {isEn ? 'Warning: Close to Full Capacity' : 'Atenção: Quase Cheio'}
                    </p>
                    <p className="text-xs text-amber-300/80 mt-0.5">
                      {isEn
                        ? 'Your AP is over 90%. Prepare to spend stamina in the next few hours.'
                        : 'Sua estamina está acima de 90%. Prepare-se para jogar antes que o teto seja alcançado.'}
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Quick Adjustment Pills */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  {isEn ? 'Quick AP Adjustments' : 'Ajustes Rápidos de AP'}
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleQuickAdd(-10)}
                    className="px-2.5 py-1.5 rounded-lg bg-purple-950/50 hover:bg-purple-900/60 border border-purple-800/40 text-xs font-semibold text-purple-200 transition-all active:scale-95"
                  >
                    -10 AP
                  </button>
                  <button
                    onClick={() => handleQuickAdd(10)}
                    className="px-2.5 py-1.5 rounded-lg bg-purple-950/50 hover:bg-purple-900/60 border border-purple-800/40 text-xs font-semibold text-purple-200 transition-all active:scale-95"
                  >
                    +10 AP
                  </button>
                  <button
                    onClick={() => handleQuickAdd(20)}
                    className="px-2.5 py-1.5 rounded-lg bg-purple-950/50 hover:bg-purple-900/60 border border-purple-800/40 text-xs font-semibold text-purple-200 transition-all active:scale-95"
                  >
                    +20 AP
                  </button>
                  <button
                    onClick={() => handleQuickAdd(50)}
                    className="px-2.5 py-1.5 rounded-lg bg-purple-950/50 hover:bg-purple-900/60 border border-purple-800/40 text-xs font-semibold text-purple-200 transition-all active:scale-95"
                  >
                    +50 AP
                  </button>
                  <button
                    onClick={() => {
                      playSelect();
                      handleApChange(0);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800/60 border border-slate-700/40 text-xs font-semibold text-slate-300 transition-all active:scale-95"
                  >
                    {isEn ? 'Reset to 0' : 'Zerar (0)'}
                  </button>
                  <button
                    onClick={() => {
                      playSelect();
                      handleApChange(maxAp);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-600/40 text-xs font-semibold text-emerald-300 transition-all active:scale-95"
                  >
                    {isEn ? 'Fill to Max' : 'Completar (Max)'}
                  </button>
                </div>
              </div>

              {/* Number Inputs & Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label htmlFor="current-ap-input" className="text-xs font-semibold text-slate-300">
                    {isEn ? 'Current AP' : 'AP Atual'}
                  </label>
                  <input
                    id="current-ap-input"
                    type="number"
                    min={0}
                    max={maxAp * 3}
                    value={currentAp}
                    onChange={(e) => handleApChange(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 border border-purple-800/40 text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="max-ap-input" className="text-xs font-semibold text-slate-300">
                    {isEn ? 'Max AP (Cap)' : 'Limite Máximo (Cap)'}
                  </label>
                  <input
                    id="max-ap-input"
                    type="number"
                    min={1}
                    max={999}
                    value={maxAp}
                    onChange={(e) => {
                      const val = Math.max(1, Number(e.target.value) || DEFAULT_MAX_AP);
                      setMaxAp(val);
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 border border-purple-800/40 text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="rate-ap-input" className="text-xs font-semibold text-slate-300">
                    {isEn ? 'Recharge (Min/AP)' : 'Recarga (Min/AP)'}
                  </label>
                  <input
                    id="rate-ap-input"
                    type="number"
                    step={0.5}
                    min={0.5}
                    max={60}
                    value={rechargeMinutes}
                    onChange={(e) => {
                      const val = Math.max(0.5, Number(e.target.value) || DEFAULT_RECHARGE_MINUTES_PER_AP);
                      setRechargeMinutes(val);
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 border border-purple-800/40 text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Target Full Time & Real-time Countdown Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-[#140f26]/80 border border-purple-900/40 p-5 flex items-center space-x-4 shadow-lg">
                <div className="p-3 rounded-xl bg-purple-900/40 border border-purple-600/30 text-purple-300">
                  <Clock className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
                    {isEn ? 'Full Recovery Clock' : 'Hora de Recarga Completa'}
                  </span>
                  <span className="text-2xl font-black text-white font-mono">
                    {calc.formattedTime}
                  </span>
                  <p className="text-[11px] text-purple-300/80 mt-0.5">
                    {calc.isFull
                      ? isEn
                        ? 'Currently capped'
                        : 'Estamina cheia agora'
                      : isEn
                      ? `At standard ${rechargeMinutes}m rate`
                      : `Na taxa de ${rechargeMinutes} min/AP`}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-[#140f26]/80 border border-purple-900/40 p-5 flex items-center space-x-4 shadow-lg">
                <div className="p-3 rounded-xl bg-indigo-900/40 border border-indigo-600/30 text-indigo-300">
                  <RefreshCw
                    className={`w-7 h-7 ${calc.isFull ? '' : 'animate-spin'}`}
                    style={{ animationDuration: '4s' }}
                  />
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
                    {isEn ? 'Remaining Countdown' : 'Tempo Restante (Regressivo)'}
                  </span>
                  <span className="text-2xl font-black text-indigo-200 font-mono">
                    {formatSecondsToCountdown(calc.secondsRemaining)}
                  </span>
                  <p className="text-[11px] text-indigo-300/80 mt-0.5">
                    {isEn
                      ? `${calc.minutesRemaining} minutes remaining`
                      : `${calc.minutesRemaining} minutos restantes`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================
            RIGHT COLUMN: DAILY ROUTINE CHECKLIST
           ========================================= */}
        {(activeTab === 'all' || activeTab === 'routine') && (
          <div
            className={`space-y-6 ${
              activeTab === 'all' ? 'lg:col-span-5' : 'lg:col-span-12'
            }`}
          >
            <div className="rounded-2xl bg-[#140f26]/90 border border-purple-800/30 p-6 shadow-xl space-y-5">
              {/* Header with Date Badge & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-900/30">
                <div>
                  <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <ListTodo className="w-5 h-5 text-purple-400" />
                    <span>{isEn ? 'Daily Jujutsu Routine' : 'Rotina Diária Jujutsu'}</span>
                  </h2>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    <span>{todayKey}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleMarkAllRoutine(true)}
                    className="p-1.5 px-2.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/40 text-xs font-medium text-purple-200 flex items-center gap-1 transition-all"
                    title={isEn ? 'Mark All Done' : 'Marcar Todas'}
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isEn ? 'All' : 'Tudo'}</span>
                  </button>
                  <button
                    onClick={() => handleMarkAllRoutine(false)}
                    className="p-1.5 px-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-800/60 border border-slate-700/40 text-xs font-medium text-slate-300 flex items-center gap-1 transition-all"
                    title={isEn ? 'Reset Routine' : 'Limpar'}
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                    <span>{isEn ? 'Clear' : 'Limpar'}</span>
                  </button>
                </div>
              </div>

              {/* Progress Bar for Routine */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs text-slate-300 font-medium">
                  <span>
                    {isEn ? 'Completion Progress:' : 'Progresso da Rotina:'}{' '}
                    <strong className="text-purple-300">
                      {routineStats.done} / {routineStats.total}
                    </strong>
                  </span>
                  <span className="font-bold text-white">{routineStats.pct}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-950/80 rounded-full overflow-hidden border border-purple-950">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-emerald-400 rounded-full transition-all duration-300"
                    style={{ width: `${routineStats.pct}%` }}
                  />
                </div>
              </div>

              {/* Task Items List */}
              <div className="space-y-2.5">
                {DEFAULT_DAILY_ROUTINE.map((task: DailyRoutineTask) => {
                  const isChecked = !!routineState[task.id];

                  return (
                    <div
                      key={task.id}
                      onClick={() => toggleRoutineItem(task.id)}
                      className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                        isChecked
                          ? 'bg-purple-950/20 border-purple-900/30 opacity-70 hover:opacity-90'
                          : 'bg-purple-950/40 border-purple-800/40 hover:border-purple-600/60 hover:bg-purple-900/30'
                      }`}
                    >
                      {/* Checkbox Icon */}
                      <div className="mt-0.5 shrink-0">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                            isChecked
                              ? 'bg-emerald-600 border-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                              : 'border-purple-600/50 bg-purple-950/60 group-hover:border-purple-400'
                          }`}
                        >
                          {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-sm font-semibold transition-all ${
                              isChecked
                                ? 'line-through text-slate-400'
                                : 'text-slate-100 group-hover:text-purple-200'
                            }`}
                          >
                            {isEn ? task.title.en : task.title.pt}
                          </span>

                          <span className="shrink-0 flex items-center gap-1 text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-900/80 border border-purple-800/30 text-slate-300">
                            {getCategoryIcon(task.category)}
                            <span>{getCategoryBadgeLabel(task.category)}</span>
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed">
                          {isEn ? task.description.en : task.description.pt}
                        </p>

                        {task.timeWindow && (
                          <div className="flex items-center gap-1.5 text-[11px] text-amber-300/90 pt-0.5 font-medium">
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>{isEn ? task.timeWindow.en : task.timeWindow.pt}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Extra Tip Banner */}
              <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-900/30 flex items-center gap-2.5 text-xs text-slate-400">
                <Gift className="w-4 h-4 text-purple-400 shrink-0" />
                <span>
                  {isEn
                    ? 'Checklist status is preserved per day in your offline browser storage.'
                    : 'O progresso do checklist fica salvo offline por dia no seu navegador/aplicativo.'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StaminaTracker;
