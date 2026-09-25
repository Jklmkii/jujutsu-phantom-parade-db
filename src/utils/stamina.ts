/**
 * Jujutsu Kaisen Phantom Parade - Stamina / AP & Daily Routine Engine
 * 100% Offline logic for AP regeneration calculation and persistent daily routine checklist.
 */

export const DEFAULT_RECHARGE_MINUTES_PER_AP = 3;
export const DEFAULT_MAX_AP = 180;
export const DAILY_ROUTINE_STORAGE_PREFIX = 'jjkppdb_daily_routine_';

export interface StaminaCalculation {
  targetDate: Date;
  minutesRemaining: number;
  secondsRemaining: number;
  formattedTime: string;
  formattedCountdown: string;
  isFull: boolean;
  percentage: number;
  missingAp: number;
}

export type RoutineCategory = 'stamina' | 'missions' | 'shop' | 'events';

export interface DailyRoutineTask {
  id: string;
  title: {
    pt: string;
    en: string;
  };
  description: {
    pt: string;
    en: string;
  };
  category: RoutineCategory;
  timeWindow?: {
    pt: string;
    en: string;
  };
  priority?: 'high' | 'medium' | 'normal';
}

/**
 * Default checklist of daily routine tasks in Jujutsu Kaisen: Phantom Parade
 */
export const DEFAULT_DAILY_ROUTINE: DailyRoutineTask[] = [
  {
    id: 'stamina-noon',
    title: {
      pt: 'Coleta Gratuita de AP (Almoço / Meio-dia)',
      en: 'Free AP Collection (Lunch / Midday)',
    },
    description: {
      pt: 'Resgatar +100 de AP gratuito concedido na caixa de presentes durante a tarde.',
      en: 'Claim +100 free AP granted in the gift box during midday hours.',
    },
    category: 'stamina',
    timeWindow: {
      pt: '12:00 - 18:00 (Horário Local/Servidor)',
      en: '12:00 - 18:00 (Local/Server Time)',
    },
    priority: 'high',
  },
  {
    id: 'stamina-evening',
    title: {
      pt: 'Coleta Gratuita de AP (Noturno)',
      en: 'Free AP Collection (Evening / Night)',
    },
    description: {
      pt: 'Resgatar +100 de AP gratuito do segundo lote diário na caixa de presentes.',
      en: 'Claim +100 free AP from the second daily batch in the gift box.',
    },
    category: 'stamina',
    timeWindow: {
      pt: '18:00 - 04:00 (Horário Local/Servidor)',
      en: '18:00 - 04:00 (Local/Server Time)',
    },
    priority: 'high',
  },
  {
    id: 'daily-missions',
    title: {
      pt: 'Missões Diárias de Treino & Exorcismo',
      en: 'Daily Training & Exorcism Missions',
    },
    description: {
      pt: 'Concluir todas as 5 missões diárias para resgatar Gemas (Cubes) e EXP de jogador.',
      en: 'Complete all 5 daily quests to claim Gem Cubes and player EXP.',
    },
    category: 'missions',
    priority: 'high',
  },
  {
    id: 'friendship-shop',
    title: {
      pt: 'Loja de Amizade Diária',
      en: 'Daily Friendship Point Shop',
    },
    description: {
      pt: 'Comprar pacotes de JP, poções de treino ou fragmentos usando pontos de suporte.',
      en: 'Purchase JP packs, training stamina items, or fragments with support points.',
    },
    category: 'shop',
    priority: 'medium',
  },
  {
    id: 'dispatch-patrol',
    title: {
      pt: 'Despacho & Patrulha Escolar',
      en: 'Dispatch & School Patrols',
    },
    description: {
      pt: 'Coletar os espólios acumulados da patrulha e enviar feiticeiros em novas missões de campo.',
      en: 'Collect accumulated patrol spoils and dispatch sorcerers on new field missions.',
    },
    category: 'missions',
    priority: 'medium',
  },
  {
    id: 'event-exchange',
    title: {
      pt: 'Troca de Medalhas do Evento Ativo',
      en: 'Active Event Medal Exchange',
    },
    description: {
      pt: 'Gastar AP no evento da temporada e resgatar itens limitados da loja de troca.',
      en: 'Spend AP on the current event stage and purchase limited exchange shop items.',
    },
    category: 'events',
    priority: 'normal',
  },
];

/**
 * Formats a given number of seconds into HH:mm:ss or mm:ss
 */
export function formatSecondsToCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return '00:00:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `00:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Formats a Date object to local HH:mm string (with day marker if tomorrow)
 */
export function formatTargetClock(targetDate: Date, nowDate: Date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const hours = pad(targetDate.getHours());
  const minutes = pad(targetDate.getMinutes());

  const isNextDay =
    targetDate.getDate() !== nowDate.getDate() ||
    targetDate.getMonth() !== nowDate.getMonth() ||
    targetDate.getFullYear() !== nowDate.getFullYear();

  return isNextDay ? `${hours}:${minutes} (+1d)` : `${hours}:${minutes}`;
}

/**
 * Calculates when AP will reach 100% (maxAp) based on current value and recharge rate.
 * Phantom Parade standard: 1 AP every 3 minutes.
 */
export function calculateFullTime(
  currentAp: number,
  maxAp: number,
  rechargeMinutesPerAp = DEFAULT_RECHARGE_MINUTES_PER_AP
): StaminaCalculation {
  const safeCurrent = Math.max(0, Math.floor(Number.isFinite(currentAp) ? currentAp : 0));
  const safeMax = Math.max(1, Math.floor(Number.isFinite(maxAp) ? maxAp : DEFAULT_MAX_AP));
  const safeRate = Math.max(0.1, Number.isFinite(rechargeMinutesPerAp) ? rechargeMinutesPerAp : DEFAULT_RECHARGE_MINUTES_PER_AP);

  const missingAp = Math.max(0, safeMax - safeCurrent);
  const isFull = safeCurrent >= safeMax;
  const percentage = Math.min(100, Math.round((safeCurrent / safeMax) * 100));

  const totalMinutesRemaining = isFull ? 0 : Math.ceil(missingAp * safeRate);
  const totalSecondsRemaining = totalMinutesRemaining * 60;

  const now = new Date();
  const targetDate = new Date(now.getTime() + totalSecondsRemaining * 1000);

  const formattedCountdown = isFull ? '00:00:00' : formatSecondsToCountdown(totalSecondsRemaining);
  const formattedTime = isFull ? 'Agora (Cheio)' : formatTargetClock(targetDate, now);

  return {
    targetDate,
    minutesRemaining: totalMinutesRemaining,
    secondsRemaining: totalSecondsRemaining,
    formattedTime,
    formattedCountdown,
    isFull,
    percentage,
    missingAp,
  };
}

/**
 * Generates storage key for a specific date (YYYY-MM-DD local format)
 */
export function getDailyStorageDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Loads daily routine checklist state from localStorage
 */
export function loadDailyRoutineProgress(dateKey?: string): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  const resolvedKey = `${DAILY_ROUTINE_STORAGE_PREFIX}${dateKey || getDailyStorageDateKey()}`;
  try {
    const raw = localStorage.getItem(resolvedKey);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to load daily routine progress from localStorage', err);
    return {};
  }
}

/**
 * Saves daily routine checklist state to localStorage
 */
export function saveDailyRoutineProgress(
  progress: Record<string, boolean>,
  dateKey?: string
): void {
  if (typeof window === 'undefined') return;
  const resolvedKey = `${DAILY_ROUTINE_STORAGE_PREFIX}${dateKey || getDailyStorageDateKey()}`;
  try {
    localStorage.setItem(resolvedKey, JSON.stringify(progress));
  } catch (err) {
    console.warn('Failed to save daily routine progress to localStorage', err);
  }
}
