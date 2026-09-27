import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Character } from '../types';
import { 
  getJujutsudleCharacters, 
  getDailyCharacter, 
  getDailySkill,
  getRandomCharacter,
  getRandomSkill,
  evaluateGuess, 
  generateShareResult,
  normalizeAffiliation,
  getProgressiveClues,
  playJujutsudleClueAudio,
  playJujutsudleVictorySound,
  loadJujutsudleStats,
  recordGameResult,
  loadDailyState,
  saveDailyState,
  type GuessEvaluation,
  type JujutsudleStats,
  type MatchStatus,
  type DirectionStatus,
  type TargetSkillInfo,
  type GameMode
} from '../utils/jujutsudle';
import {
  getCanonicalCharacters,
  getDailyCanonicalCharacter,
  evaluateCanonGuess,
  generateCanonShareText,
  loadCanonCutoffPreference,
  saveCanonCutoffPreference,
  loadDailyCanonGameState,
  saveDailyCanonGameState,
  type CanonicalCharacter,
  type CanonCutoff,
  type CanonGuessEvaluation
} from '../utils/jujutsudleCanon';
import { getAssetUrl } from '../utils/assets';
import { playClick, playTabSwitch, playKokusenVoice } from '../utils/sound';
import { useTranslation, translateElement, translateFocus, translateRole } from '../i18n';
import { ElementBadge, RarityBadge } from './Badges';
import { JujutsudleCalendarModal } from './JujutsudleCalendarModal';
import { JujutsudleSpoilerModal } from './JujutsudleSpoilerModal';
import { 
  Sparkles, 
  Volume2, 
  Share2, 
  RotateCcw, 
  Search, 
  CheckCircle2, 
  XCircle, 
  ArrowUp, 
  ArrowDown, 
  Flame, 
  Trophy, 
  Eye, 
  Check,
  BarChart2,
  Zap,
  Lock,
  Unlock,
  Calendar as CalendarIcon,
  Focus,
  BookOpen,
  ShieldAlert
} from 'lucide-react';
import { getDeviceLocalDateString, formatDateDisplay } from '../utils/date';

interface JujutsudleProps {
  onSelectCharacter?: (char: Character) => void;
}

function getInitialDailyState(
  allCharacters: Character[], 
  todayStr: string, 
  mode: GameMode = 'classic'
) {
  const dailyChar = getDailyCharacter(todayStr, mode);
  const dailySkill = mode === 'skill' ? getDailySkill(todayStr) : undefined;
  const savedState = loadDailyState(todayStr, mode);
  if (savedState && savedState.guesses.length > 0) {
    const restoredGuesses = savedState.guesses
      .map(id => allCharacters.find(c => c.id === id))
      .filter((c): c is Character => Boolean(c));
    const target = savedState.targetSkill?.character || dailyChar;
    const restoredEvals = restoredGuesses.map(g => evaluateGuess(g, target));
    return { 
      dailyChar: target, 
      dailySkill: savedState.targetSkill || dailySkill, 
      guesses: restoredGuesses, 
      evals: restoredEvals 
    };
  }
  return { dailyChar, dailySkill, guesses: [], evals: [] };
}

export const Jujutsudle: React.FC<JujutsudleProps> = ({ onSelectCharacter }) => {
  const { t } = useTranslation();
  const allCharacters = useMemo(() => getJujutsudleCharacters(), []);
  const todayStr = useMemo(() => getDeviceLocalDateString(), []);

  // Data ativa selecionada (padrão: hoje; permite escolher qualquer dia passado via Calendário)
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [showCalendarModal, setShowCalendarModal] = useState<boolean>(false);
  const isToday = selectedDate === todayStr;

  // Modos de jogo: Clássico Diário, Silhueta, Habilidade, Cânone ou Prática Livre
  const [gameMode, setGameMode] = useState<GameMode>('classic');

  // Alvo atual e palpites da sessão
  const [initialData] = useState(() => getInitialDailyState(getJujutsudleCharacters(), getDeviceLocalDateString(), 'classic'));
  const [targetChar, setTargetChar] = useState<Character>(initialData.dailyChar);
  const [targetSkill, setTargetSkill] = useState<TargetSkillInfo | undefined>(initialData.dailySkill);
  const [guesses, setGuesses] = useState<Character[]>(initialData.guesses);
  const [evaluations, setEvaluations] = useState<GuessEvaluation[]>(initialData.evals);

  // Estados do Modo Cânone (Anime & Mangá com proteção anti-spoiler)
  const [canonCutoff, setCanonCutoff] = useState<CanonCutoff>(() => loadCanonCutoffPreference());
  const [showSpoilerModal, setShowSpoilerModal] = useState<boolean>(false);
  const [canonTargetChar, setCanonTargetChar] = useState<CanonicalCharacter>(() => 
    getDailyCanonicalCharacter(todayStr, loadCanonCutoffPreference())
  );
  const [canonGuesses, setCanonGuesses] = useState<CanonicalCharacter[]>(() => {
    const pref = loadCanonCutoffPreference();
    const saved = loadDailyCanonGameState(todayStr, pref);
    const allCanon = getCanonicalCharacters(pref);
    return saved.guesses.map(id => allCanon.find(c => c.id === id)).filter(Boolean) as CanonicalCharacter[];
  });
  const [canonEvaluations, setCanonEvaluations] = useState<CanonGuessEvaluation[]>(() => {
    const pref = loadCanonCutoffPreference();
    const saved = loadDailyCanonGameState(todayStr, pref);
    const allCanon = getCanonicalCharacters(pref);
    const target = getDailyCanonicalCharacter(todayStr, pref);
    const restored = saved.guesses.map(id => allCanon.find(c => c.id === id)).filter(Boolean) as CanonicalCharacter[];
    return restored.map(g => evaluateCanonGuess(g, target));
  });

  // Estados de busca autocomplete
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Estados de UI e feedback
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showKokusenEffect, setShowKokusenEffect] = useState(false);
  const [stats, setStats] = useState<JujutsudleStats>(() => loadJujutsudleStats());

  const maxGuesses = 6;
  const isWon = evaluations.some(e => e.isCorrect);
  const isGameOver = isWon || (gameMode !== 'free' && guesses.length >= maxGuesses);

  const isCanonWon = canonEvaluations.some(e => e.isCorrect);
  const isCanonGameOver = isCanonWon || canonGuesses.length >= maxGuesses;

  // Pistas progressivas calculadas deterministicamente para o personagem alvo
  const progressiveClues = useMemo(() => getProgressiveClues(targetChar), [targetChar]);

  // Alternar entre abas/modos de jogo com transição limpa e carregamento do personagem específico do modo
  const handleSwitchMode = (mode: GameMode) => {
    playTabSwitch();
    setGameMode(mode);
    setSearchQuery('');
    setIsDropdownOpen(false);

    if (mode === 'free') {
      const randomChar = getRandomCharacter(targetChar.id);
      setTargetChar(randomChar);
      setTargetSkill(undefined);
      setGuesses([]);
      setEvaluations([]);
    } else if (mode === 'skill') {
      const skillTarget = getDailySkill(selectedDate);
      setTargetSkill(skillTarget);
      setTargetChar(skillTarget.character);

      const savedState = loadDailyState(selectedDate, 'skill');
      if (savedState && savedState.guesses.length > 0) {
        const restoredGuesses = savedState.guesses
          .map(id => allCharacters.find(c => c.id === id))
          .filter((c): c is Character => Boolean(c));

        setGuesses(restoredGuesses);
        setEvaluations(restoredGuesses.map(g => evaluateGuess(g, skillTarget.character)));
      } else {
        setGuesses([]);
        setEvaluations([]);
      }
    } else if (mode === 'canon') {
      const canonTarget = getDailyCanonicalCharacter(selectedDate, canonCutoff);
      setCanonTargetChar(canonTarget);
      const savedState = loadDailyCanonGameState(selectedDate, canonCutoff);
      const allCanon = getCanonicalCharacters(canonCutoff);
      const restored = savedState.guesses.map(id => allCanon.find(c => c.id === id)).filter(Boolean) as CanonicalCharacter[];
      setCanonGuesses(restored);
      setCanonEvaluations(restored.map(g => evaluateCanonGuess(g, canonTarget)));
    } else {
      // Obtém o feiticeiro diário específico para o modo (o modo silhueta possui personagem diferente do clássico)
      const modeDailyChar = getDailyCharacter(selectedDate, mode);
      setTargetChar(modeDailyChar);
      setTargetSkill(undefined);

      const savedState = loadDailyState(selectedDate, mode);
      if (savedState && savedState.guesses.length > 0) {
        const restoredGuesses = savedState.guesses
          .map(id => allCharacters.find(c => c.id === id))
          .filter((c): c is Character => Boolean(c));

        setGuesses(restoredGuesses);
        setEvaluations(restoredGuesses.map(g => evaluateGuess(g, modeDailyChar)));
      } else {
        setGuesses([]);
        setEvaluations([]);
      }
    }
  };

  // Seleciona corte anti-spoiler
  const handleSelectCutoff = (newCutoff: CanonCutoff) => {
    saveCanonCutoffPreference(newCutoff);
    setCanonCutoff(newCutoff);
    const newTarget = getDailyCanonicalCharacter(selectedDate, newCutoff);
    setCanonTargetChar(newTarget);
    const savedState = loadDailyCanonGameState(selectedDate, newCutoff);
    const allCanon = getCanonicalCharacters(newCutoff);
    const restored = savedState.guesses.map(id => allCanon.find(c => c.id === id)).filter(Boolean) as CanonicalCharacter[];
    setCanonGuesses(restored);
    setCanonEvaluations(restored.map(g => evaluateCanonGuess(g, newTarget)));
  };

  // Seleciona uma data (Hoje ou dia anterior do Arquivo do Calendário)
  const handleSelectDate = (newDate: string) => {
    playTabSwitch();
    setSelectedDate(newDate);
    setShowCalendarModal(false);
    setSearchQuery('');
    setIsDropdownOpen(false);

    // Se estiver no modo livre, comuta para o modo clássico para carregar o enigma daquela data
    const activeMode = gameMode === 'free' ? 'classic' : gameMode;
    if (gameMode === 'free') {
      setGameMode('classic');
    }

    if (activeMode === 'canon') {
      const canonTarget = getDailyCanonicalCharacter(newDate, canonCutoff);
      setCanonTargetChar(canonTarget);
      const savedState = loadDailyCanonGameState(newDate, canonCutoff);
      const allCanon = getCanonicalCharacters(canonCutoff);
      const restored = savedState.guesses.map(id => allCanon.find(c => c.id === id)).filter(Boolean) as CanonicalCharacter[];
      setCanonGuesses(restored);
      setCanonEvaluations(restored.map(g => evaluateCanonGuess(g, canonTarget)));
    } else if (activeMode === 'skill') {
      const skillTarget = getDailySkill(newDate);
      setTargetSkill(skillTarget);
      setTargetChar(skillTarget.character);

      const savedState = loadDailyState(newDate, 'skill');
      if (savedState && savedState.guesses.length > 0) {
        const restoredGuesses = savedState.guesses
          .map(id => allCharacters.find(c => c.id === id))
          .filter((c): c is Character => Boolean(c));

        setGuesses(restoredGuesses);
        setEvaluations(restoredGuesses.map(g => evaluateGuess(g, skillTarget.character)));
      } else {
        setGuesses([]);
        setEvaluations([]);
      }
    } else {
      const modeDailyChar = getDailyCharacter(newDate, activeMode);
      setTargetChar(modeDailyChar);
      setTargetSkill(undefined);

      const savedState = loadDailyState(newDate, activeMode);
      if (savedState && savedState.guesses.length > 0) {
        const restoredGuesses = savedState.guesses
          .map(id => allCharacters.find(c => c.id === id))
          .filter((c): c is Character => Boolean(c));

        setGuesses(restoredGuesses);
        setEvaluations(restoredGuesses.map(g => evaluateGuess(g, modeDailyChar)));
      } else {
        setGuesses([]);
        setEvaluations([]);
      }
    }
  };

  // Catálogo canônico filtrado por corte
  const canonicalCharacters = useMemo(() => getCanonicalCharacters(canonCutoff), [canonCutoff]);
  const guessedCanonIds = useMemo(() => new Set(canonGuesses.map(g => g.id)), [canonGuesses]);
  const filteredCanonCharacters = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return canonicalCharacters
      .filter(c => !guessedCanonIds.has(c.id))
      .filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.kanji.includes(q) ||
        c.innateTechnique.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [canonicalCharacters, guessedCanonIds, searchQuery]);

  // Lista de personagens do jogo filtrados para o autocomplete (excluindo já palpitados)
  const guessedIds = useMemo(() => new Set(guesses.map(g => g.id)), [guesses]);
  const filteredCharacters = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return allCharacters
      .filter(c => !guessedIds.has(c.id))
      .filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.title.toLowerCase().includes(q) ||
        (c.epithet && c.epithet.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [allCharacters, guessedIds, searchQuery]);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node) &&
        searchInputRef.current && 
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Envia palpite
  const handleMakeGuess = (char: Character) => {
    if (isGameOver || guessedIds.has(char.id)) return;
    playClick();

    const evaluation = evaluateGuess(char, targetChar);
    const newGuesses = [...guesses, char];
    const newEvals = [...evaluations, evaluation];

    setGuesses(newGuesses);
    setEvaluations(newEvals);
    setSearchQuery('');
    setIsDropdownOpen(false);

    // Se for modo diário (classic, silhouette ou skill), persiste progresso no localStorage indexado por selectedDate
    if (gameMode !== 'free') {
      saveDailyState({
        date: selectedDate,
        targetId: targetChar.id,
        guesses: newGuesses.map(g => g.id),
        solved: evaluation.isCorrect,
        gameMode,
        targetSkill: gameMode === 'skill' ? targetSkill : undefined,
      });
    }

    // Vitória!
    if (evaluation.isCorrect) {
      setShowKokusenEffect(true);
      setTimeout(() => {
        playKokusenVoice();
      }, 100);
      setTimeout(() => {
        playJujutsudleVictorySound();
      }, 500);
      setTimeout(() => {
        setShowKokusenEffect(false);
      }, 2500);
      const updatedStats = recordGameResult(true, newGuesses.length, selectedDate);
      setStats(updatedStats);
    } else if (gameMode !== 'free' && newGuesses.length >= maxGuesses) {
      // Derrota
      const updatedStats = recordGameResult(false, newGuesses.length, selectedDate);
      setStats(updatedStats);
    }
  };

  // Envia palpite no Modo Cânone (Anime & Mangá)
  const handleMakeCanonGuess = (chosen: CanonicalCharacter) => {
    if (isCanonGameOver || guessedCanonIds.has(chosen.id)) return;
    playClick();

    const evaluation = evaluateCanonGuess(chosen, canonTargetChar);
    const newGuesses = [...canonGuesses, chosen];
    const newEvals = [...canonEvaluations, evaluation];

    setCanonGuesses(newGuesses);
    setCanonEvaluations(newEvals);
    setSearchQuery('');
    setIsDropdownOpen(false);

    saveDailyCanonGameState({
      date: selectedDate,
      cutoff: canonCutoff,
      targetId: canonTargetChar.id,
      guesses: newGuesses.map(g => g.id),
      solved: evaluation.isCorrect,
    });

    if (evaluation.isCorrect) {
      setShowKokusenEffect(true);
      setTimeout(() => {
        playKokusenVoice();
      }, 100);
      setTimeout(() => {
        playJujutsudleVictorySound();
      }, 500);
      setTimeout(() => {
        setShowKokusenEffect(false);
      }, 2500);
    }
  };

  // Teclas no campo de busca (suporta catálogo do jogo ou cânone)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (gameMode === 'canon') {
      if (!isDropdownOpen || filteredCanonCharacters.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCanonCharacters.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCanonCharacters.length) % filteredCanonCharacters.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const chosen = filteredCanonCharacters[selectedIndex];
        if (chosen) handleMakeCanonGuess(chosen);
      } else if (e.key === 'Escape') {
        setIsDropdownOpen(false);
      }
      return;
    }

    if (!isDropdownOpen || filteredCharacters.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCharacters.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCharacters.length) % filteredCharacters.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const chosen = filteredCharacters[selectedIndex];
      if (chosen) handleMakeGuess(chosen);
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  // Copiar compartilhamento em emojis do modo cânone
  const handleShareCanonResult = async () => {
    playClick();
    const text = generateCanonShareText(canonEvaluations, selectedDate, canonCutoff);
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2500);
      }
    } catch (err) {
      console.warn('Erro ao copiar para clipboard:', err);
    }
  };

  // Tocar pista sonora
  const handlePlayAudioClue = () => {
    if (isAudioPlaying) return;
    setIsAudioPlaying(true);
    playJujutsudleClueAudio(targetChar);
    setTimeout(() => {
      setIsAudioPlaying(false);
    }, 1800);
  };

  // Reiniciar no modo livre ou passar para o Próximo Desafio
  const handleResetFreePractice = () => {
    playTabSwitch();
    if (gameMode === 'skill') {
      const nextSkill = getRandomSkill(targetChar.id);
      setTargetSkill(nextSkill);
      setTargetChar(nextSkill.character);
    } else {
      const nextChar = getRandomCharacter(targetChar.id);
      setTargetChar(nextChar);
      setTargetSkill(undefined);
    }
    setGuesses([]);
    setEvaluations([]);
    setSearchQuery('');
  };

  // Copiar compartilhamento em emojis
  const handleShareResult = async () => {
    playClick();
    const text = generateShareResult(evaluations, gameMode, todayStr);
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2500);
      }
    } catch (err) {
      console.warn('Erro ao copiar para clipboard:', err);
    }
  };

  // Cálculo de nitidez óptica da silhueta conforme palpites errados (Lente de Foco Progressivo)
  const silhouetteFocusData = useMemo(() => {
    if (isWon || (isGameOver && !isWon)) {
      return {
        filterClass: 'blur-none brightness-100 contrast-100 drop-shadow-[0_0_25px_rgba(168,85,247,0.7)]',
        scaleClass: 'scale-100',
        percent: 100,
      };
    }
    const count = evaluations.length;
    switch (count) {
      case 0:
        return {
          filterClass: 'blur-[28px] brightness-90 contrast-125 saturate-125',
          scaleClass: 'scale-125',
          percent: 15,
        };
      case 1:
        return {
          filterClass: 'blur-[20px] brightness-90 contrast-120 saturate-120',
          scaleClass: 'scale-118',
          percent: 30,
        };
      case 2:
        return {
          filterClass: 'blur-[13px] brightness-95 contrast-115 saturate-110',
          scaleClass: 'scale-112',
          percent: 45,
        };
      case 3:
        return {
          filterClass: 'blur-[8px] brightness-95 contrast-110 saturate-105',
          scaleClass: 'scale-107',
          percent: 60,
        };
      case 4:
        return {
          filterClass: 'blur-[4.5px] brightness-100 contrast-105 saturate-100',
          scaleClass: 'scale-103',
          percent: 75,
        };
      case 5:
        return {
          filterClass: 'blur-[2px] brightness-100 contrast-100',
          scaleClass: 'scale-100',
          percent: 90,
        };
      default:
        return {
          filterClass: 'blur-none brightness-100 contrast-100',
          scaleClass: 'scale-100',
          percent: 100,
        };
    }
  }, [evaluations.length, isGameOver, isWon]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fadeIn relative">
      {/* Overlay Visual de Impacto Kokusen (Black Flash) na Vitória */}
      {showKokusenEffect && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden animate-fadeIn">
          <div className="absolute inset-0 bg-black/90 mix-blend-multiply" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-600/70 via-purple-950/50 to-black/95 animate-pulse" />
          <div className="relative z-10 flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="relative">
              <Zap className="w-24 h-24 sm:w-32 sm:h-32 text-red-500 animate-bounce drop-shadow-[0_0_35px_rgba(239,68,68,1)]" />
              <div className="absolute inset-0 text-red-400 blur-md animate-ping flex items-center justify-center">
                <Zap className="w-24 h-24 sm:w-32 sm:h-32" />
              </div>
            </div>
            <h2 className="text-4xl sm:text-6xl font-black italic tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-300 to-red-600 drop-shadow-[0_0_25px_rgba(255,0,0,0.9)] uppercase">
              {t.jujutsudle.kokusenImpact}
            </h2>
            <p className="text-sm sm:text-base font-bold text-red-200 tracking-wider">
              120% DE POTENCIAL LIBERADO!
            </p>
          </div>
        </div>
      )}

      {/* Header com Título, Streak, Calendário e Ações */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-purple-500/20">
        <div className="text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-300">
              {t.jujutsudle.title}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/20">
              {gameMode === 'free' ? t.jujutsudle.freeBadge : t.jujutsudle.dailyBadge}
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            {t.jujutsudle.subtitle}
          </p>
        </div>

        {/* Barra de utilitários: Calendário, Sequência, Pista Sonora e Estatísticas */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
          {/* Botão de Calendário / Arquivo de Dias Anteriores */}
          <button
            onClick={() => { playClick(); setShowCalendarModal(true); }}
            aria-label={t.jujutsudle.calendarBtn}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              !isToday
                ? 'bg-amber-950/60 border-amber-500/70 text-amber-300 shadow-sm shadow-amber-950/40 animate-pulse'
                : 'bg-[#15102a] border-purple-500/30 text-purple-300 hover:text-purple-200 hover:border-purple-400'
            }`}
            title={t.jujutsudle.calendarTitle}
          >
            <CalendarIcon className="w-4 h-4 text-purple-400" />
            <span>{isToday ? t.jujutsudle.calendarToday : formatDateDisplay(selectedDate)}</span>
          </button>

          {/* Badge de Streak */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#15102a] border border-orange-500/30 text-orange-400 shadow-sm" title={t.jujutsudle.currentStreak}>
            <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
            <span className="text-xs font-black">{stats.currentStreak}</span>
            <span className="text-[10px] text-gray-400 hidden sm:inline">Streak</span>
          </div>

          {/* Botão de Pista de Áudio */}
          <button
            onClick={handlePlayAudioClue}
            disabled={isAudioPlaying}
            aria-label={t.jujutsudle.clueSound}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer ${
              isAudioPlaying
                ? 'bg-purple-600/40 border-purple-400 text-purple-200 animate-pulse'
                : 'bg-[#15102a] border-purple-500/30 text-purple-300 hover:bg-purple-900/30 hover:border-purple-400'
            }`}
            title={t.jujutsudle.clueSound}
          >
            <Volume2 className={`w-4 h-4 ${isAudioPlaying ? 'animate-bounce' : ''}`} />
            <span className="hidden sm:inline">
              {isAudioPlaying ? t.jujutsudle.clueSoundPlaying : t.jujutsudle.clueSound}
            </span>
          </button>

          {/* Botão de Estatísticas */}
          <button
            onClick={() => { playClick(); setShowStatsModal(true); }}
            aria-label={t.jujutsudle.statsTitle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#15102a] border border-purple-500/30 text-gray-300 hover:text-purple-300 hover:border-purple-400 transition cursor-pointer"
            title={t.jujutsudle.statsTitle}
          >
            <BarChart2 className="w-4 h-4" />
            <span className="hidden sm:inline">{t.jujutsudle.played}</span>
          </button>
        </div>
      </div>

      {/* Faixa Informativa de Modo Arquivo Histórico se dia selecionado for passado */}
      {!isToday && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs sm:text-sm animate-fadeIn gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <CalendarIcon className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">
              {t.jujutsudle.calendarPlayingPast.replace('{date}', formatDateDisplay(selectedDate))}
            </span>
          </div>
          <button
            onClick={() => handleSelectDate(todayStr)}
            className="px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition cursor-pointer shadow-sm shrink-0"
          >
            {t.jujutsudle.calendarReturnToday}
          </button>
        </div>
      )}

      {/* Seletor de Modo: Clássico, Silhueta, Habilidade, Prática Livre */}
      <div className="flex justify-center">
        <div className="inline-flex flex-wrap justify-center p-1 rounded-2xl bg-[#120d24] border border-purple-500/30 shadow-inner gap-1">
          <button
            onClick={() => handleSwitchMode('classic')}
            data-testid="tab-classic"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
              gameMode === 'classic'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{t.jujutsudle.tabClassic}</span>
          </button>

          <button
            onClick={() => handleSwitchMode('silhouette')}
            data-testid="tab-silhouette"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
              gameMode === 'silhouette'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>{t.jujutsudle.tabSilhouette}</span>
          </button>

          <button
            onClick={() => handleSwitchMode('skill')}
            data-testid="tab-skill"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
              gameMode === 'skill'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>{t.jujutsudle.tabSkill}</span>
          </button>

          <button
            onClick={() => handleSwitchMode('canon')}
            data-testid="tab-canon"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
              gameMode === 'canon'
                ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-600 text-white shadow-md shadow-purple-600/30'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-300" />
            <span>{t.jujutsudle.tabCanon}</span>
            <span className="px-1.5 py-0.2 text-[9px] rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-mono">
              {canonCutoff === 'sendai' ? 'Sendai' : 'Manga'}
            </span>
          </button>

          <button
            onClick={() => handleSwitchMode('free')}
            data-testid="tab-free"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
              gameMode === 'free'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t.jujutsudle.tabFree}</span>
          </button>
        </div>
      </div>

      {/* Banner Informativo & Seletor de Filtro Anti-Spoiler para o Modo Cânone */}
      {gameMode === 'canon' && (
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-3xl bg-gradient-to-r from-[#1b1233] via-[#140e28] to-[#1a112e] border border-amber-500/30 shadow-xl gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">
                  {t.jujutsudle.antiSpoilerConfig}:
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono">
                  {canonCutoff === 'sendai' ? t.jujutsudle.canonCutoffBadgeSendai : t.jujutsudle.canonCutoffBadgeShinjuku}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {t.jujutsudle.canonSubtitle} ({canonicalCharacters.length} {t.jujutsudle.colCharacter.toLowerCase()}s)
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowSpoilerModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800/80 border border-purple-400/40 text-purple-200 text-xs font-bold transition shadow-sm cursor-pointer shrink-0"
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>{t.jujutsudle.antiSpoilerConfig}</span>
          </button>
        </div>
      )}

      {/* Card Visual Especial para Modo Silhueta com Desfoque Óptico Progressivo */}
      {gameMode === 'silhouette' && (
        <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-gradient-to-b from-[#181133] to-[#0c081d] border border-purple-500/30 shadow-xl relative overflow-hidden space-y-4">
          <div className="w-full flex items-center justify-between text-xs text-purple-300/70 font-mono px-2">
            <span className="flex items-center gap-1.5">
              <Focus className="w-4 h-4 text-purple-400" />
              <span>{t.jujutsudle.focusLevel.replace('{percent}', String(silhouetteFocusData.percent))}</span>
            </span>
            <span>
              {guesses.length} / {maxGuesses} {t.jujutsudle.guessButton.toLowerCase()}s
            </span>
          </div>

          {/* Barra de Progresso de Foco da Lente */}
          <div className="w-full max-w-sm h-1.5 rounded-full bg-[#0e091d] overflow-hidden border border-purple-500/20">
            <div 
              className="h-full bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-400 transition-all duration-700 rounded-full"
              style={{ width: `${silhouetteFocusData.percent}%` }}
            />
          </div>

          <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden bg-[#090616] border-2 border-purple-500/40 p-2 flex items-center justify-center">
            <img 
              src={getAssetUrl(targetChar.image)} 
              alt="Focus Target"
              className={`w-full h-full object-contain transition-all duration-700 select-none pointer-events-none ${silhouetteFocusData.filterClass} ${silhouetteFocusData.scaleClass}`}
            />
            {isWon && (
              <div className="absolute inset-0 bg-emerald-950/20 backdrop-blur-[0.5px] flex items-center justify-center">
                <span className="text-emerald-400 font-black text-lg bg-black/70 px-4 py-1.5 rounded-xl border border-emerald-500/40">
                  {targetChar.name}
                </span>
              </div>
            )}
          </div>

          {/* Grade de 4 Pistas Progressivas com Cadeados Destrancáveis por Palpite */}
          <div className="w-full max-w-xl grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
            {/* Pista 1: Raridade (Palpite 2) */}
            <div className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center min-h-[64px] ${
              guesses.length >= 2 || isWon
                ? 'bg-purple-950/40 border-purple-500/40 text-purple-200'
                : 'bg-[#100b24] border-gray-800 text-gray-500'
            }`}>
              <span className="text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                {guesses.length >= 2 || isWon ? <Unlock className="w-3 h-3 text-emerald-400" /> : <Lock className="w-3 h-3" />}
                {t.jujutsudle.clueRarity}
              </span>
              {guesses.length >= 2 || isWon ? (
                <RarityBadge rarity={targetChar.rarity} />
              ) : (
                <span className="text-[11px] font-mono">{t.jujutsudle.clueLocked.replace('{count}', '2')}</span>
              )}
            </div>

            {/* Pista 2: Elemento (Palpite 3) */}
            <div className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center min-h-[64px] ${
              guesses.length >= 3 || isWon
                ? 'bg-purple-950/40 border-purple-500/40 text-purple-200'
                : 'bg-[#100b24] border-gray-800 text-gray-500'
            }`}>
              <span className="text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                {guesses.length >= 3 || isWon ? <Unlock className="w-3 h-3 text-emerald-400" /> : <Lock className="w-3 h-3" />}
                {t.jujutsudle.clueElement}
              </span>
              {guesses.length >= 3 || isWon ? (
                <ElementBadge element={targetChar.element} />
              ) : (
                <span className="text-[11px] font-mono">{t.jujutsudle.clueLocked.replace('{count}', '3')}</span>
              )}
            </div>

            {/* Pista 3: Afiliação (Palpite 4) */}
            <div className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center min-h-[64px] ${
              guesses.length >= 4 || isWon
                ? 'bg-purple-950/40 border-purple-500/40 text-purple-200'
                : 'bg-[#100b24] border-gray-800 text-gray-500'
            }`}>
              <span className="text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                {guesses.length >= 4 || isWon ? <Unlock className="w-3 h-3 text-emerald-400" /> : <Lock className="w-3 h-3" />}
                {t.jujutsudle.clueAffiliation}
              </span>
              {guesses.length >= 4 || isWon ? (
                <span className="text-[11px] font-bold truncate max-w-[120px]">{normalizeAffiliation(targetChar.affiliation)}</span>
              ) : (
                <span className="text-[11px] font-mono">{t.jujutsudle.clueLocked.replace('{count}', '4')}</span>
              )}
            </div>

            {/* Pista 4: Áudio (Palpite 5) */}
            <div className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center min-h-[64px] ${
              guesses.length >= 5 || isWon
                ? 'bg-purple-950/40 border-purple-500/40 text-purple-200'
                : 'bg-[#100b24] border-gray-800 text-gray-500'
            }`}>
              <span className="text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                {guesses.length >= 5 || isWon ? <Unlock className="w-3 h-3 text-emerald-400" /> : <Lock className="w-3 h-3" />}
                {t.jujutsudle.clueAudio}
              </span>
              {guesses.length >= 5 || isWon ? (
                <button
                  onClick={handlePlayAudioClue}
                  className="px-2 py-0.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>Ouvir</span>
                </button>
              ) : (
                <span className="text-[11px] font-mono">{t.jujutsudle.clueLocked.replace('{count}', '5')}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Card Visual Especial para Modo Habilidade / Técnica */}
      {gameMode === 'skill' && targetSkill && (
        <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-gradient-to-b from-[#181133] to-[#0c081d] border border-purple-500/30 shadow-xl relative overflow-hidden space-y-4">
          <div className="w-full flex items-center justify-between text-xs text-purple-300/70 font-mono px-2">
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.jujutsudle.skillHint}</span>
            </span>
            <span>
              {guesses.length} / {maxGuesses} {t.jujutsudle.guessButton.toLowerCase()}s
            </span>
          </div>

          {/* Ícone Oficial da Técnica */}
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-3xl overflow-hidden bg-[#090616] border-2 border-purple-500/50 p-3 flex flex-col items-center justify-center shadow-2xl group">
            <img 
              src={getAssetUrl(targetSkill.skillIcon)} 
              alt={targetSkill.skillName}
              className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-transform duration-300 group-hover:scale-105"
            />
            {isWon && (
              <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-2 text-center">
                <span className="text-emerald-400 font-black text-sm sm:text-base">
                  {targetSkill.skillName}
                </span>
                <span className="text-[10px] text-gray-300 mt-1">
                  {targetSkill.character.name}
                </span>
              </div>
            )}
          </div>

          <div className="text-center">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-900/40 text-purple-300 border border-purple-500/30">
              {targetSkill.skillType === 'ultimate' ? '⚡ Técnica Suprema' : '🥋 Habilidade de Combate'}
            </span>
          </div>

          {/* Grade de 3 Pistas da Habilidade Destrancadas por Palpites */}
          <div className="w-full max-w-lg grid grid-cols-3 gap-2.5 pt-2">
            {/* Pista 1: Tipo / Custo (Palpite 2) */}
            <div className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center min-h-[64px] ${
              guesses.length >= 2 || isWon
                ? 'bg-purple-950/40 border-purple-500/40 text-purple-200'
                : 'bg-[#100b24] border-gray-800 text-gray-500'
            }`}>
              <span className="text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                {guesses.length >= 2 || isWon ? <Unlock className="w-3 h-3 text-emerald-400" /> : <Lock className="w-3 h-3" />}
                {t.jujutsudle.clueSkillCost}
              </span>
              {guesses.length >= 2 || isWon ? (
                <span className="text-xs font-bold font-mono text-purple-300">
                  {targetSkill.cost ? `${targetSkill.cost} CE` : 'Passiva / Zero'}
                </span>
              ) : (
                <span className="text-[11px] font-mono">{t.jujutsudle.clueLocked.replace('{count}', '2')}</span>
              )}
            </div>

            {/* Pista 2: Elemento do Feiticeiro (Palpite 3) */}
            <div className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center min-h-[64px] ${
              guesses.length >= 3 || isWon
                ? 'bg-purple-950/40 border-purple-500/40 text-purple-200'
                : 'bg-[#100b24] border-gray-800 text-gray-500'
            }`}>
              <span className="text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                {guesses.length >= 3 || isWon ? <Unlock className="w-3 h-3 text-emerald-400" /> : <Lock className="w-3 h-3" />}
                {t.jujutsudle.clueElement}
              </span>
              {guesses.length >= 3 || isWon ? (
                <ElementBadge element={targetChar.element} />
              ) : (
                <span className="text-[11px] font-mono">{t.jujutsudle.clueLocked.replace('{count}', '3')}</span>
              )}
            </div>

            {/* Pista 3: 1ª Letra do Feiticeiro (Palpite 4) */}
            <div className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center min-h-[64px] ${
              guesses.length >= 4 || isWon
                ? 'bg-purple-950/40 border-purple-500/40 text-purple-200'
                : 'bg-[#100b24] border-gray-800 text-gray-500'
            }`}>
              <span className="text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                {guesses.length >= 4 || isWon ? <Unlock className="w-3 h-3 text-emerald-400" /> : <Lock className="w-3 h-3" />}
                {t.jujutsudle.clueSkillFirstLetter}
              </span>
              {guesses.length >= 4 || isWon ? (
                <span className="text-sm font-black text-amber-400 font-mono">
                  {targetChar.name.charAt(0)}...
                </span>
              ) : (
                <span className="text-[11px] font-mono">{t.jujutsudle.clueLocked.replace('{count}', '4')}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Banner de Vitória ou Derrota para o Modo Cânone */}
      {gameMode === 'canon' && isCanonGameOver && (
        <div className={`p-6 rounded-3xl border shadow-2xl relative overflow-hidden animate-slideDown ${
          isCanonWon
            ? 'bg-gradient-to-r from-emerald-950/80 via-[#13271d] to-[#0a1811] border-emerald-500/40 text-emerald-200 shadow-emerald-950/50'
            : 'bg-gradient-to-r from-rose-950/80 via-[#271317] to-[#180a0d] border-rose-500/40 text-rose-200 shadow-rose-950/50'
        }`}>
          <div className="flex flex-col sm:flex-row items-center gap-6 justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-purple-500/50 bg-[#090616] shrink-0 shadow-lg flex items-center justify-center">
                {canonTargetChar.gameImage || canonTargetChar.image ? (
                  <img 
                    src={getAssetUrl(canonTargetChar.gameImage || canonTargetChar.image)} 
                    alt={canonTargetChar.name} 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-2xl font-black text-purple-300 font-mono">
                    {canonTargetChar.kanji.slice(0, 2)}
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black flex items-center gap-2">
                  {isCanonWon ? (
                    <>
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      <span>{t.jujutsudle.winTitle}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-6 h-6 text-rose-400" />
                      <span>{t.jujutsudle.lossTitle}</span>
                    </>
                  )}
                </h3>
                <p className="text-sm text-gray-300 mt-1">
                  {isCanonWon 
                    ? t.jujutsudle.winSubtitle.replace('{guesses}', String(canonEvaluations.length))
                    : t.jujutsudle.lossSubtitle.replace('{name}', `${canonTargetChar.name} (${canonTargetChar.kanji})`)
                  }
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    {canonTargetChar.grade}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    {canonTargetChar.species}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30">
                    {canonTargetChar.debutArc}
                  </span>
                </div>
                {canonTargetChar.innateTechnique && (
                  <p className="text-xs text-purple-300/80 mt-1.5 font-mono">
                    ✦ Técnica Inata: {canonTargetChar.innateTechnique}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleShareCanonResult}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-700/30 transition cursor-pointer"
              >
                {copyFeedback ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{t.jujutsudle.shareSuccess}</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>{t.jujutsudle.shareBtn}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner de Vitória ou Derrota quando encerrado (Modos de Jogo Padrão) */}
      {gameMode !== 'canon' && isGameOver && (
        <div className={`p-6 rounded-3xl border shadow-2xl relative overflow-hidden animate-slideDown ${
          isWon
            ? 'bg-gradient-to-r from-emerald-950/80 via-[#13271d] to-[#0a1811] border-emerald-500/40 text-emerald-200 shadow-emerald-950/50'
            : 'bg-gradient-to-r from-rose-950/80 via-[#271317] to-[#180a0d] border-rose-500/40 text-rose-200 shadow-rose-950/50'
        }`}>
          <div className="flex flex-col sm:flex-row items-center gap-6 justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-purple-500/50 bg-[#090616] shrink-0 shadow-lg">
                <img 
                  src={getAssetUrl(targetChar.image)} 
                  alt={targetChar.name} 
                  className="w-full h-full object-contain"
                />
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black flex items-center gap-2">
                  {isWon ? (
                    <>
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      <span>{t.jujutsudle.winTitle}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-6 h-6 text-rose-400" />
                      <span>{t.jujutsudle.lossTitle}</span>
                    </>
                  )}
                </h3>
                <p className="text-sm text-gray-300 mt-1">
                  {isWon 
                    ? t.jujutsudle.winSubtitle.replace('{guesses}', String(evaluations.length))
                    : t.jujutsudle.lossSubtitle.replace('{name}', targetChar.title)
                  }
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <ElementBadge element={targetChar.element} />
                  <RarityBadge rarity={targetChar.rarity} />
                  <span className="text-xs text-gray-400 font-mono">
                    {targetChar.release_date}
                  </span>
                </div>
              </div>
            </div>

            {/* Ações pós-jogo: Compartilhar / Praticar Novamente */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleShareResult}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-700/30 transition cursor-pointer"
              >
                {copyFeedback ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{t.jujutsudle.shareSuccess}</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>{t.jujutsudle.shareBtn}</span>
                  </>
                )}
              </button>

              {gameMode === 'free' ? (
                <button
                  onClick={handleResetFreePractice}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-purple-600 hover:bg-purple-500 border border-purple-400/40 text-white shadow-lg shadow-purple-900/40 transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{t.jujutsudle.nextFreeChallenge}</span>
                </button>
              ) : (
                <button
                  onClick={() => handleSwitchMode('free')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-purple-900/50 hover:bg-purple-800/60 border border-purple-400/40 text-purple-200 transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{t.jujutsudle.tabFree}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pistas Táticas Desbloqueáveis Progressivas (Modos Clássico e Livre) */}
      {(gameMode === 'classic' || gameMode === 'free') && (
        <div className="max-w-xl mx-auto rounded-2xl p-3 sm:p-4 bg-[#120d24]/90 border border-purple-500/25 shadow-lg space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-gray-300">
            <span className="flex items-center gap-1.5 text-purple-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
              {t.jujutsudle.progressiveHintsTitle}
            </span>
            <span className="text-[11px] font-mono text-purple-400">
              {Math.min(
                (guesses.length >= 3 || isWon ? 1 : 0) + (guesses.length >= 5 || isWon ? 1 : 0) + (guesses.length >= 7 || isWon ? 1 : 0),
                3
              )} / 3
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Pista 1: Arco / Origem (Palpite 3) */}
            <div className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center min-h-[58px] ${
              guesses.length >= 3 || isWon 
                ? 'bg-purple-950/40 border-purple-500/40 text-purple-200 shadow-sm' 
                : 'bg-[#100b24] border-gray-800 text-gray-500'
            }`}>
              <span className="text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                {guesses.length >= 3 || isWon ? <Unlock className="w-3 h-3 text-emerald-400" /> : <Lock className="w-3 h-3" />}
                {t.jujutsudle.clueArc}
              </span>
              {guesses.length >= 3 || isWon ? (
                <span className="text-[11px] font-bold text-amber-300 truncate max-w-full">
                  {progressiveClues.storyArc}
                </span>
              ) : (
                <span className="text-[11px] font-mono">{t.jujutsudle.progressiveHintUnlockAt.replace('{count}', '3')}</span>
              )}
            </div>

            {/* Pista 2: Mecânica Tática / Especial (Palpite 5) */}
            <div className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center min-h-[58px] ${
              guesses.length >= 5 || isWon 
                ? 'bg-purple-950/40 border-purple-500/40 text-purple-200 shadow-sm' 
                : 'bg-[#100b24] border-gray-800 text-gray-500'
            }`}>
              <span className="text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                {guesses.length >= 5 || isWon ? <Unlock className="w-3 h-3 text-emerald-400" /> : <Lock className="w-3 h-3" />}
                {t.jujutsudle.clueSpecial}
              </span>
              {guesses.length >= 5 || isWon ? (
                <span className="text-[11px] font-bold text-teal-300 truncate max-w-full">
                  {progressiveClues.tacticalGauge.hasDomain
                    ? t.jujutsudle.domainYes
                    : t.jujutsudle.domainNo.replace('{gauge}', progressiveClues.tacticalGauge.specialGauge)}
                </span>
              ) : (
                <span className="text-[11px] font-mono">{t.jujutsudle.progressiveHintUnlockAt.replace('{count}', '5')}</span>
              )}
            </div>

            {/* Pista 3: Primeira Letra (Palpite 7) */}
            <div className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center min-h-[58px] ${
              guesses.length >= 7 || isWon 
                ? 'bg-purple-950/40 border-purple-500/40 text-purple-200 shadow-sm' 
                : 'bg-[#100b24] border-gray-800 text-gray-500'
            }`}>
              <span className="text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                {guesses.length >= 7 || isWon ? <Unlock className="w-3 h-3 text-emerald-400" /> : <Lock className="w-3 h-3" />}
                {t.jujutsudle.clueFirstLetter}
              </span>
              {guesses.length >= 7 || isWon ? (
                <span className="text-xs font-bold text-purple-200">
                  {t.jujutsudle.letterHint.replace('{letter}', progressiveClues.firstLetter)}
                </span>
              ) : (
                <span className="text-[11px] font-mono">{t.jujutsudle.progressiveHintUnlockAt.replace('{count}', '7')}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Caixa de Entrada e Autocomplete */}
      {!(gameMode === 'canon' ? isCanonGameOver : isGameOver) && (
        <div className="relative max-w-xl mx-auto space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400 px-1">
            <span>
              {t.jujutsudle.guessesCount
                .replace('{current}', String((gameMode === 'canon' ? canonGuesses.length : guesses.length) + 1))
                .replace('{max}', String(gameMode === 'free' ? '∞' : maxGuesses))}
            </span>
            {gameMode !== 'free' && (
              <span className="text-purple-400 font-mono">
                {t.jujutsudle.remaining.replace('{count}', String(maxGuesses - (gameMode === 'canon' ? canonGuesses.length : guesses.length)))}
              </span>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400">
              <Search className="w-5 h-5" />
            </div>

            <input
              ref={searchInputRef}
              type="text"
              data-testid="jujutsudle-search-input"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
                setSelectedIndex(0);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={t.jujutsudle.searchPlaceholder}
              className="w-full pl-11 pr-24 py-3.5 bg-[#120d24] border border-purple-500/30 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-2xl text-sm text-gray-100 placeholder-gray-500 outline-none transition shadow-inner"
            />

            {gameMode === 'canon' ? (
              filteredCanonCharacters.length > 0 && searchQuery.trim() && (
                <button
                  onClick={() => handleMakeCanonGuess(filteredCanonCharacters[0])}
                  data-testid="jujutsudle-guess-button"
                  className="absolute right-2 top-2 bottom-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  {t.jujutsudle.guessButton}
                </button>
              )
            ) : (
              filteredCharacters.length > 0 && searchQuery.trim() && (
                <button
                  onClick={() => handleMakeGuess(filteredCharacters[0])}
                  data-testid="jujutsudle-guess-button"
                  className="absolute right-2 top-2 bottom-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  {t.jujutsudle.guessButton}
                </button>
              )
            )}
          </div>

          {/* Dropdown Autocomplete com Miniaturas */}
          {isDropdownOpen && searchQuery.trim() && (
            <div 
              ref={dropdownRef}
              className="absolute z-40 left-0 right-0 mt-1 max-h-72 overflow-y-auto rounded-2xl bg-[#140e28] border border-purple-500/40 shadow-2xl divide-y divide-purple-500/10 custom-scrollbar"
            >
              {gameMode === 'canon' ? (
                filteredCanonCharacters.length > 0 ? (
                  filteredCanonCharacters.map((cChar, index) => {
                    const isSelected = index === selectedIndex;
                    return (
                      <div
                        key={cChar.id}
                        onClick={() => handleMakeCanonGuess(cChar)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        data-testid="jujutsudle-autocomplete-option"
                        className={`flex items-center gap-3 p-2.5 transition cursor-pointer ${
                          isSelected ? 'bg-purple-600/30 text-purple-100' : 'hover:bg-purple-900/20 text-gray-300'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#090616] border border-purple-500/30 shrink-0 flex items-center justify-center">
                          {cChar.gameImage || cChar.image ? (
                            <img 
                              src={getAssetUrl(cChar.gameImage || cChar.image)} 
                              alt={cChar.name} 
                              className="w-full h-full object-contain"
                              loading="lazy"
                            />
                          ) : (
                            <span className="text-xs font-black text-purple-300 font-mono">
                              {cChar.kanji ? cChar.kanji.slice(0, 2) : cChar.name.slice(0, 2)}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-bold truncate flex items-center gap-1.5">
                            <span>{cChar.name}</span>
                            <span className="text-[10px] text-purple-400 font-mono">({cChar.kanji})</span>
                          </p>
                          <p className="text-[11px] text-gray-400 truncate">
                            {cChar.species} • {cChar.affiliation}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            {cChar.grade}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30">
                            {cChar.debutArc}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-xs text-gray-400">
                    {t.jujutsudle.noResults}
                  </div>
                )
              ) : (
                filteredCharacters.length > 0 ? (
                  filteredCharacters.map((char, index) => {
                    const isSelected = index === selectedIndex;
                    return (
                      <div
                        key={char.id}
                        onClick={() => handleMakeGuess(char)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        data-testid="jujutsudle-autocomplete-option"
                        className={`flex items-center gap-3 p-2.5 transition cursor-pointer ${
                          isSelected ? 'bg-purple-600/30 text-purple-100' : 'hover:bg-purple-900/20 text-gray-300'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#090616] border border-purple-500/30 shrink-0">
                          <img 
                            src={getAssetUrl(char.image)} 
                            alt={char.name} 
                            className="w-full h-full object-contain"
                            loading="lazy"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-bold truncate">
                            {char.title}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate">
                            {char.name} • {normalizeAffiliation(char.affiliation)}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <ElementBadge element={char.element} showLabel={false} />
                          <RarityBadge rarity={char.rarity} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-xs text-gray-400">
                    {t.jujutsudle.noResults}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}

      {/* Legenda de Pistas (Verde, Amarelo, Vermelho, Setas) */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-gray-400 px-2 py-2.5 rounded-xl bg-[#120d24]/60 border border-purple-500/20">
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-md bg-emerald-500/40 border border-emerald-400 shrink-0"></span>
          <span>{t.jujutsudle.legendExact}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-md bg-amber-500/40 border border-amber-400 shrink-0"></span>
          <span>{t.jujutsudle.legendPartial}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-md bg-rose-500/40 border border-rose-400 shrink-0"></span>
          <span>{t.jujutsudle.legendWrong}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ArrowUp className="w-3.5 h-3.5 text-purple-400" />
          <span>{t.jujutsudle.legendNewer}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ArrowDown className="w-3.5 h-3.5 text-purple-400" />
          <span>{t.jujutsudle.legendOlder}</span>
        </div>
      </div>

      {/* Tabela de Palpites estilo Wordle */}
      <div className="space-y-3">
        {/* Cabeçalho da Grade */}
        {gameMode === 'canon' ? (
          <div className="grid grid-cols-9 gap-1 sm:gap-1.5 text-center text-[8px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1">
            <div>{t.jujutsudle.colCharacter}</div>
            <div>{t.jujutsudle.colSpecies}</div>
            <div>{t.jujutsudle.colGender}</div>
            <div>{t.jujutsudle.colGrade}</div>
            <div>{t.jujutsudle.colAffiliation}</div>
            <div>{t.jujutsudle.colTechniqueType}</div>
            <div>{t.jujutsudle.colCombatStyle}</div>
            <div>{t.jujutsudle.colDomain}</div>
            <div>{t.jujutsudle.colDebut}</div>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
            <div>{t.jujutsudle.colCharacter}</div>
            <div>{t.jujutsudle.colElement}</div>
            <div>{t.jujutsudle.colRarity}</div>
            <div>{t.jujutsudle.colCombat}</div>
            <div>{t.jujutsudle.colRole}</div>
            <div>{t.jujutsudle.colAffiliation}</div>
            <div>{t.jujutsudle.colRelease}</div>
          </div>
        )}

        {/* Linhas de Palpites avaliados */}
        {gameMode === 'canon' ? (
          canonEvaluations.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#120d24]/40 border border-dashed border-purple-500/20 text-gray-500 text-sm">
              {t.jujutsudle.searchPlaceholder}
            </div>
          ) : (
            <div className="space-y-2">
              {canonEvaluations.map((evalItem, rowIndex) => (
                <CanonGuessRow 
                  key={`${evalItem.character.id}-${rowIndex}`} 
                  evaluation={evalItem} 
                  rowIndex={rowIndex}
                />
              ))}
            </div>
          )
        ) : (
          evaluations.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#120d24]/40 border border-dashed border-purple-500/20 text-gray-500 text-sm">
              {t.jujutsudle.searchPlaceholder}
            </div>
          ) : (
            <div className="space-y-2">
              {evaluations.map((evalItem, rowIndex) => (
                <GuessRow 
                  key={`${evalItem.character.id}-${rowIndex}`} 
                  evaluation={evalItem} 
                  rowIndex={rowIndex}
                  onSelectCharacter={onSelectCharacter}
                />
              ))}
            </div>
          )
        )}
      </div>

      {/* Modal de Estatísticas */}
      {showStatsModal && (
        <StatsModal 
          stats={stats} 
          onClose={() => setShowStatsModal(false)} 
        />
      )}

      {/* Modal de Calendário / Arquivo de Dias Anteriores */}
      {showCalendarModal && (
        <JujutsudleCalendarModal
          selectedDate={selectedDate}
          todayStr={todayStr}
          gameMode={gameMode}
          onSelectDate={handleSelectDate}
          onClose={() => setShowCalendarModal(false)}
        />
      )}

      {/* Modal Anti-Spoiler para o Modo Cânone */}
      <JujutsudleSpoilerModal
        isOpen={showSpoilerModal}
        onClose={() => setShowSpoilerModal(false)}
        currentCutoff={canonCutoff}
        onSelectCutoff={handleSelectCutoff}
      />
    </div>
  );
};

// Subcomponente de Linha de Palpite com Animação
interface GuessRowProps {
  evaluation: GuessEvaluation;
  rowIndex: number;
  onSelectCharacter?: (char: Character) => void;
}

const GuessRow: React.FC<GuessRowProps> = ({ evaluation, rowIndex, onSelectCharacter }) => {
  const { language } = useTranslation();
  const { character, element, rarity, combatType, role, affiliation, chronological, isCorrect } = evaluation;

  const getStatusColor = (status: MatchStatus) => {
    if (status === 'correct') {
      return 'bg-emerald-950/60 border-emerald-500/70 text-emerald-300 shadow-sm shadow-emerald-950/40';
    }
    if (status === 'partial') {
      return 'bg-amber-950/60 border-amber-500/70 text-amber-300 shadow-sm shadow-amber-950/40';
    }
    return 'bg-rose-950/60 border-rose-700/60 text-rose-300 shadow-sm shadow-rose-950/40';
  };

  const getChronoColor = (status: DirectionStatus) => {
    if (status === 'correct') {
      return 'bg-emerald-950/60 border-emerald-500/70 text-emerald-300 shadow-sm shadow-emerald-950/40';
    }
    return 'bg-rose-950/60 border-rose-700/60 text-rose-300 shadow-sm shadow-rose-950/40';
  };

  return (
    <div className="grid grid-cols-7 gap-1.5 sm:gap-2" data-testid="guess-row">
      {/* 1. Feiticeiro (Retrato + Nome) */}
      <div 
        onClick={() => onSelectCharacter && onSelectCharacter(character)}
        style={{ animationDelay: `${rowIndex * 100}ms` }}
        className={`p-1.5 sm:p-2 rounded-2xl border flex flex-col items-center justify-center text-center transition animate-flipIn ${
          isCorrect ? 'bg-emerald-950/70 border-emerald-500/80 shadow-md' : 'bg-[#150f29] border-purple-500/30'
        } ${onSelectCharacter ? 'cursor-pointer hover:border-purple-400' : ''}`}
      >
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl overflow-hidden bg-[#090616] border border-purple-500/30 mb-1">
          <img 
            src={getAssetUrl(character.image)} 
            alt={character.name} 
            className="w-full h-full object-contain"
          />
        </div>
        <span className="text-[10px] sm:text-xs font-bold text-gray-200 line-clamp-1">
          {character.name}
        </span>
      </div>

      {/* 2. Elemento */}
      <div 
        style={{ animationDelay: `${rowIndex * 100 + 80}ms` }}
        className={`p-1.5 sm:p-2 rounded-2xl border flex flex-col items-center justify-center text-center animate-flipIn ${getStatusColor(element.status)}`}
      >
        <ElementBadge element={character.element} showLabel={false} />
        <span className="text-[9px] sm:text-xs font-semibold mt-1">
          {translateElement(character.element, language).split(' ')[0]}
        </span>
      </div>

      {/* 3. Raridade */}
      <div 
        style={{ animationDelay: `${rowIndex * 100 + 160}ms` }}
        className={`p-1.5 sm:p-2 rounded-2xl border flex flex-col items-center justify-center text-center animate-flipIn ${getStatusColor(rarity.status)}`}
      >
        <RarityBadge rarity={character.rarity} />
      </div>

      {/* 4. Tipo de Combate (Taijutsu, Jujutsu, Misto) */}
      <div 
        style={{ animationDelay: `${rowIndex * 100 + 240}ms` }}
        className={`p-1.5 sm:p-2 rounded-2xl border flex flex-col items-center justify-center text-center px-1 animate-flipIn ${getStatusColor(combatType.status)}`}
      >
        <span className="text-[9px] sm:text-xs font-bold">
          {translateFocus(character.focus || combatType.value, language).split(' ')[0]}
        </span>
      </div>

      {/* 5. Função de Combate (Role) */}
      <div 
        style={{ animationDelay: `${rowIndex * 100 + 320}ms` }}
        className={`p-1.5 sm:p-2 rounded-2xl border flex flex-col items-center justify-center text-center px-1 animate-flipIn ${getStatusColor(role.status)}`}
      >
        <span className="text-[9px] sm:text-xs font-bold truncate max-w-full">
          {translateRole(role.value || character.role, language).split(' ')[0]}
        </span>
      </div>

      {/* 6. Afiliação */}
      <div 
        style={{ animationDelay: `${rowIndex * 100 + 400}ms` }}
        className={`p-1.5 sm:p-2 rounded-2xl border flex flex-col items-center justify-center text-center px-1 animate-flipIn ${getStatusColor(affiliation.status)}`}
      >
        <span className="text-[8px] sm:text-xs font-medium line-clamp-2 leading-tight">
          {affiliation.value}
        </span>
      </div>

      {/* 7. Lançamento Cronológico */}
      <div 
        data-testid="guess-chrono-cell"
        style={{ animationDelay: `${rowIndex * 100 + 480}ms` }}
        className={`p-1.5 sm:p-2 rounded-2xl border flex flex-col items-center justify-center text-center animate-flipIn ${getChronoColor(chronological.status)}`}
      >
        <div className="flex items-center gap-1 font-bold">
          {chronological.status === 'higher' && <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-300 animate-bounce" />}
          {chronological.status === 'lower' && <ArrowDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-300 animate-bounce" />}
          {chronological.status === 'correct' && <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />}
        </div>
        <span className="text-[8px] sm:text-[11px] font-mono mt-0.5">
          {chronological.formattedDate || '—'}
        </span>
      </div>
    </div>
  );
};

// Subcomponente de Linha de Palpite do Modo Cânone (Anime & Mangá)
interface CanonGuessRowProps {
  evaluation: CanonGuessEvaluation;
  rowIndex: number;
}

const CanonGuessRow: React.FC<CanonGuessRowProps> = ({ evaluation, rowIndex }) => {
  const { character, species, gender, grade, affiliation, techniqueType, combatStyle, hasDomain, debutArc, isCorrect } = evaluation;

  const getStatusColor = (status: MatchStatus) => {
    if (status === 'correct') {
      return 'bg-emerald-950/60 border-emerald-500/70 text-emerald-300 shadow-sm shadow-emerald-950/40';
    }
    if (status === 'partial') {
      return 'bg-amber-950/60 border-amber-500/70 text-amber-300 shadow-sm shadow-amber-950/40';
    }
    return 'bg-rose-950/60 border-rose-700/60 text-rose-300 shadow-sm shadow-rose-950/40';
  };

  const getDirectionArrow = (direction: DirectionStatus) => {
    if (direction === 'higher') return <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-300 animate-bounce" />;
    if (direction === 'lower') return <ArrowDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-300 animate-bounce" />;
    return <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />;
  };

  const imgSource = character.gameImage 
    ? getAssetUrl(character.gameImage) 
    : character.image 
    ? getAssetUrl(character.image) 
    : null;

  return (
    <div className="grid grid-cols-9 gap-1 sm:gap-1.5" data-testid="canon-guess-row">
      {/* 1. Feiticeiro (Retrato/Kanji + Nome) */}
      <div 
        style={{ animationDelay: `${rowIndex * 100}ms` }}
        className={`p-1 sm:p-1.5 rounded-2xl border flex flex-col items-center justify-center text-center transition animate-flipIn ${
          isCorrect ? 'bg-emerald-950/70 border-emerald-500/80 shadow-md' : 'bg-[#150f29] border-purple-500/30'
        }`}
      >
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden bg-[#090616] border border-purple-500/30 mb-0.5 flex items-center justify-center">
          {imgSource ? (
            <img 
              src={imgSource} 
              alt={character.name} 
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="text-[10px] sm:text-xs font-black text-purple-300 font-mono">
              {character.kanji ? character.kanji.slice(0, 2) : character.name.slice(0, 2)}
            </span>
          )}
        </div>
        <span className="text-[9px] sm:text-[11px] font-bold text-gray-200 line-clamp-1">
          {character.name}
        </span>
        <span className="text-[7px] sm:text-[8px] text-purple-400 font-mono line-clamp-1">
          {character.kanji}
        </span>
      </div>

      {/* 2. Espécie */}
      <div 
        style={{ animationDelay: `${rowIndex * 100 + 60}ms` }}
        className={`p-1 sm:p-1.5 rounded-2xl border flex flex-col items-center justify-center text-center animate-flipIn ${getStatusColor(species.status)}`}
      >
        <span className="text-[8px] sm:text-[11px] font-semibold leading-tight">
          {species.value}
        </span>
      </div>

      {/* 3. Gênero */}
      <div 
        style={{ animationDelay: `${rowIndex * 100 + 120}ms` }}
        className={`p-1 sm:p-1.5 rounded-2xl border flex flex-col items-center justify-center text-center animate-flipIn ${getStatusColor(gender.status)}`}
      >
        <span className="text-[8px] sm:text-[11px] font-bold">
          {gender.value}
        </span>
      </div>

      {/* 4. Grau (com indicador de direção ↑/↓) */}
      <div 
        style={{ animationDelay: `${rowIndex * 100 + 180}ms` }}
        className={`p-1 sm:p-1.5 rounded-2xl border flex flex-col items-center justify-center text-center px-0.5 animate-flipIn ${getStatusColor(grade.status)}`}
      >
        <div className="flex items-center gap-0.5 font-bold">
          {getDirectionArrow(grade.direction)}
        </div>
        <span className="text-[7px] sm:text-[10px] font-bold leading-tight mt-0.5">
          {grade.value}
        </span>
      </div>

      {/* 5. Afiliação */}
      <div 
        style={{ animationDelay: `${rowIndex * 100 + 240}ms` }}
        className={`p-1 sm:p-1.5 rounded-2xl border flex flex-col items-center justify-center text-center px-0.5 animate-flipIn ${getStatusColor(affiliation.status)}`}
      >
        <span className="text-[7px] sm:text-[10px] font-medium line-clamp-2 leading-tight">
          {affiliation.value}
        </span>
      </div>

      {/* 6. Tipo de Técnica */}
      <div 
        style={{ animationDelay: `${rowIndex * 100 + 300}ms` }}
        className={`p-1 sm:p-1.5 rounded-2xl border flex flex-col items-center justify-center text-center px-0.5 animate-flipIn ${getStatusColor(techniqueType.status)}`}
      >
        <span className="text-[7px] sm:text-[10px] font-bold leading-tight">
          {techniqueType.value}
        </span>
      </div>

      {/* 7. Estilo de Combate */}
      <div 
        style={{ animationDelay: `${rowIndex * 100 + 360}ms` }}
        className={`p-1 sm:p-1.5 rounded-2xl border flex flex-col items-center justify-center text-center px-0.5 animate-flipIn ${getStatusColor(combatStyle.status)}`}
      >
        <span className="text-[7px] sm:text-[10px] font-semibold leading-tight line-clamp-2">
          {combatStyle.value}
        </span>
      </div>

      {/* 8. Expansão de Domínio */}
      <div 
        style={{ animationDelay: `${rowIndex * 100 + 420}ms` }}
        title={hasDomain.domainName ? `Domínio: ${hasDomain.domainName}` : undefined}
        className={`p-1 sm:p-1.5 rounded-2xl border flex flex-col items-center justify-center text-center px-0.5 animate-flipIn ${getStatusColor(hasDomain.status)}`}
      >
        <span className="text-[8px] sm:text-[11px] font-bold">
          {hasDomain.value}
        </span>
        {hasDomain.domainName && (
          <span className="text-[6px] sm:text-[8px] text-amber-300 font-mono line-clamp-1 mt-0.5" title={hasDomain.domainName}>
            🌌 {hasDomain.domainName}
          </span>
        )}
      </div>

      {/* 9. Estreia na Obra (com indicador de direção cronológica ↑/↓) */}
      <div 
        style={{ animationDelay: `${rowIndex * 100 + 480}ms` }}
        className={`p-1 sm:p-1.5 rounded-2xl border flex flex-col items-center justify-center text-center animate-flipIn ${getStatusColor(debutArc.status)}`}
      >
        <div className="flex items-center gap-0.5 font-bold">
          {getDirectionArrow(debutArc.direction)}
        </div>
        <span className="text-[7px] sm:text-[10px] font-mono leading-tight mt-0.5">
          {debutArc.value}
        </span>
      </div>
    </div>
  );
};

// Modal de Estatísticas e Histórico
interface StatsModalProps {
  stats: JujutsudleStats;
  onClose: () => void;
}

const StatsModal: React.FC<StatsModalProps> = ({ stats, onClose }) => {
  const { t } = useTranslation();
  const winRate = stats.gamesPlayed > 0 
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) 
    : 0;

  const maxFreq = Math.max(...Object.values(stats.guessDistribution), 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-[#140e28] border border-purple-500/40 rounded-3xl p-6 shadow-2xl space-y-6 animate-scaleUp">
        <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-black text-white">{t.jujutsudle.statsTitle}</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-xl text-gray-400 hover:text-white hover:bg-purple-900/30 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* 4 KPIs de Estatísticas */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2.5 rounded-2xl bg-[#0e091d] border border-purple-500/20">
            <p className="text-xl sm:text-2xl font-black text-purple-300">{stats.gamesPlayed}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">{t.jujutsudle.played}</p>
          </div>
          <div className="p-2.5 rounded-2xl bg-[#0e091d] border border-purple-500/20">
            <p className="text-xl sm:text-2xl font-black text-emerald-400">{winRate}%</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">{t.jujutsudle.winRate}</p>
          </div>
          <div className="p-2.5 rounded-2xl bg-[#0e091d] border border-purple-500/20">
            <p className="text-xl sm:text-2xl font-black text-orange-400">{stats.currentStreak}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Streak</p>
          </div>
          <div className="p-2.5 rounded-2xl bg-[#0e091d] border border-purple-500/20">
            <p className="text-xl sm:text-2xl font-black text-amber-400">{stats.maxStreak}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Max</p>
          </div>
        </div>

        {/* Gráfico de Barras de Distribuição de Palpites */}
        <div>
          <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">
            {t.jujutsudle.guessDistribution}
          </h4>
          <div className="space-y-1.5">
            {[1, 2, 3, 4, 5, 6].map((num) => {
              const count = stats.guessDistribution[num] || 0;
              const percent = Math.round((count / maxFreq) * 100);
              return (
                <div key={num} className="flex items-center gap-2 text-xs">
                  <span className="w-3 font-mono font-bold text-gray-400 text-right">{num}</span>
                  <div className="flex-1 h-5 rounded-lg bg-[#0e091d] overflow-hidden p-0.5 border border-purple-500/10">
                    <div 
                      className={`h-full rounded-md transition-all duration-500 flex items-center justify-end pr-1.5 font-mono text-[10px] font-bold ${
                        count > 0 
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-500 text-white min-w-[24px]' 
                          : 'bg-transparent text-gray-600'
                      }`}
                      style={{ width: `${Math.max(percent, count > 0 ? 8 : 0)}%` }}
                    >
                      {count}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white transition cursor-pointer"
        >
          {t.settings.close}
        </button>
      </div>
    </div>
  );
};
