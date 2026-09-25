import charactersData from '../data/characters.json';
import type { Character } from '../types';
import { getDeviceLocalDateString, getDaysBetweenDates } from './date';
import { playElementalTone, playSuccessFanfare, playKokusenVoice } from './sound';

export type MatchStatus = 'correct' | 'partial' | 'incorrect';
export type DirectionStatus = 'correct' | 'higher' | 'lower'; // higher: alvo lançado mais tarde / mais recente; lower: alvo lançado antes / mais antigo

export interface GuessEvaluation {
  character: Character;
  element: { status: MatchStatus; value: string };
  rarity: { status: MatchStatus; value: string };
  combatType: { status: MatchStatus; value: string }; // Taijutsu, Jujutsu, Hybrid (Misto)
  affiliation: { status: MatchStatus; value: string };
  chronological: { status: DirectionStatus; value: string; formattedDate: string };
  isCorrect: boolean;
}

export interface JujutsudleStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: Record<number, number>; // 1 -> count, 2 -> count, ...
  lastPlayedDate: string;
  lastWonDate: string;
}

export interface DailyGameState {
  date: string;
  targetId: string;
  guesses: string[]; // character IDs
  solved: boolean;
  gameMode: 'classic' | 'silhouette' | 'free';
}

const STATS_STORAGE_KEY = 'jjkppdb-jujutsudle-stats';
const DAILY_STORAGE_KEY = 'jjkppdb-jujutsudle-daily-state';

/**
 * Retorna o catálogo completo de personagens elegíveis para o minigame.
 */
export function getJujutsudleCharacters(): Character[] {
  return (charactersData as Character[]).filter(c => Boolean(c.id && c.name && c.image));
}

/**
 * Implementação do algoritmo de hashing determinístico djb2.
 * Garante o mesmo personagem diário para todos os usuários sem depender de conexões remotas.
 */
export function hashStringDjb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // Converte para 32-bit signed integer
  }
  return Math.abs(hash);
}

/**
 * Obtém o personagem do dia baseado na data local ("YYYY-MM-DD").
 */
export function getDailyCharacter(dateStr: string = getDeviceLocalDateString()): Character {
  const characters = getJujutsudleCharacters();
  if (characters.length === 0) {
    throw new Error('No characters found in database');
  }
  const hash = hashStringDjb2(`jjkppdb-daily-sorcerer-${dateStr}`);
  const index = hash % characters.length;
  return characters[index];
}

/**
 * Obtém um personagem aleatório para o Modo Prática Livre.
 */
export function getRandomCharacter(excludeId?: string): Character {
  const characters = getJujutsudleCharacters();
  const pool = excludeId ? characters.filter(c => c.id !== excludeId) : characters;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

/**
 * Normaliza datas com múltiplos formatos (YYYY-MM-DD ou D-M-YYYY / DD-MM-YYYY)
 * para um timestamp epoch numérico para comparação cronológica precisa.
 */
export function parseReleaseDateToEpoch(dateStr: string): number {
  if (!dateStr) return 0;
  const clean = dateStr.trim();
  
  // Formato YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(clean)) {
    const [y, m, d] = clean.split('-').map(Number);
    return new Date(y, m - 1, d).getTime();
  }

  // Formato D-M-YYYY ou DD-MM-YYYY
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(clean)) {
    const [d, m, y] = clean.split('-').map(Number);
    return new Date(y, m - 1, d).getTime();
  }

  // Fallback padrão
  const parsed = Date.parse(clean);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Normaliza o tipo de combate (focus) para categorização comparativa.
 */
export function normalizeCombatFocus(focus?: string): 'Taijutsu' | 'Jujutsu' | 'Hybrid' {
  if (!focus) return 'Taijutsu';
  const norm = focus.toLowerCase();
  if (norm.includes('hybrid') || norm.includes('misto') || norm.includes('mix') || norm.includes('both')) {
    return 'Hybrid';
  }
  if (norm.includes('juju') || norm.includes('mag')) {
    return 'Jujutsu';
  }
  return 'Taijutsu';
}

/**
 * Extrai o grupo principal de afiliação para permitir correspondências parciais inteligentes.
 * Exemplo: Tóquio (Tokyo Jujutsu High), Kyoto (Kyoto Jujutsu High), Maldição (Cursed Spirit, Curse Users).
 */
export function getAffiliationGroup(affiliation?: string): string {
  if (!affiliation) return 'Outro';
  const norm = affiliation.toLowerCase();

  if (norm.includes('tokyo') || norm.includes('tóquio')) return 'Tokyo High';
  if (norm.includes('kyoto') || norm.includes('quioto')) return 'Kyoto High';
  if (norm.includes('cursed spirit') || norm.includes('maldição') || norm.includes('death painting')) return 'Curse';
  if (norm.includes('curse user') || norm.includes('sorcerer killer')) return 'Curse User';
  if (norm.includes('fukuoka')) return 'Fukuoka High';
  if (norm.includes('jujutsu high')) return 'Tokyo High';
  return affiliation;
}

/**
 * Avalia um palpite comparando suas propriedades com o feiticeiro alvo.
 */
export function evaluateGuess(guess: Character, target: Character): GuessEvaluation {
  // 1. Elemento: Match Exato (Verde) ou Diferente (Vermelho)
  const isElementMatch = guess.element?.toLowerCase() === target.element?.toLowerCase();
  const elementStatus: MatchStatus = isElementMatch ? 'correct' : 'incorrect';

  // 2. Raridade (SSR, SR, R): Match Exato ou Diferente
  const isRarityMatch = guess.rarity === target.rarity;
  const rarityStatus: MatchStatus = isRarityMatch ? 'correct' : 'incorrect';

  // 3. Tipo de Combate (Taijutsu, Jujutsu, Hybrid/Misto):
  // Match Exato (Verde), Parcial (Amarelo se um for Híbrido), Diferente (Vermelho)
  const guessCombat = normalizeCombatFocus(guess.focus);
  const targetCombat = normalizeCombatFocus(target.focus);
  let combatStatus: MatchStatus = 'incorrect';
  if (guessCombat === targetCombat) {
    combatStatus = 'correct';
  } else if (guessCombat === 'Hybrid' || targetCombat === 'Hybrid') {
    combatStatus = 'partial';
  }

  // 4. Afiliação / Origem:
  // Match exato (Verde), Parcial se pertencerem ao mesmo cluster/escola (Amarelo), ou Diferente (Vermelho)
  const guessAffil = guess.affiliation?.trim() || 'Desconhecida';
  const targetAffil = target.affiliation?.trim() || 'Desconhecida';
  const guessGroup = getAffiliationGroup(guessAffil);
  const targetGroup = getAffiliationGroup(targetAffil);

  let affiliationStatus: MatchStatus = 'incorrect';
  if (guessAffil.toLowerCase() === targetAffil.toLowerCase()) {
    affiliationStatus = 'correct';
  } else if (guessGroup === targetGroup && guessGroup !== 'Outro') {
    affiliationStatus = 'partial';
  }

  // 5. Comparação Cronológica (Data de Lançamento / Ordem):
  const guessEpoch = parseReleaseDateToEpoch(guess.release_date);
  const targetEpoch = parseReleaseDateToEpoch(target.release_date);

  let chronologicalStatus: DirectionStatus = 'correct';
  if (targetEpoch > guessEpoch) {
    // Alvo é mais recente que o palpite -> Seta para cima (Mais Novo)
    chronologicalStatus = 'higher';
  } else if (targetEpoch < guessEpoch) {
    // Alvo é mais antigo que o palpite -> Seta para baixo (Mais Antigo)
    chronologicalStatus = 'lower';
  }

  const isCorrect = guess.id === target.id;

  return {
    character: guess,
    element: { status: elementStatus, value: guess.element },
    rarity: { status: rarityStatus, value: guess.rarity },
    combatType: { status: combatStatus, value: guessCombat },
    affiliation: { status: affiliationStatus, value: guessAffil },
    chronological: { 
      status: chronologicalStatus, 
      value: guess.release_date,
      formattedDate: guess.release_date 
    },
    isCorrect,
  };
}

/**
 * Gera string de emojis compartilhável estilo Wordle / Loldle para a área de transferência.
 */
export function generateShareResult(
  evaluations: GuessEvaluation[], 
  gameMode: 'classic' | 'silhouette' | 'free', 
  dateStr: string = getDeviceLocalDateString()
): string {
  const modeLabel = gameMode === 'classic' ? 'Clássico' : gameMode === 'silhouette' ? 'Silhueta' : 'Prática Livre';
  const isWon = evaluations.some(e => e.isCorrect);
  const count = isWon ? evaluations.length : 'X';

  const rows = evaluations.map((e) => {
    const toEmoji = (status: MatchStatus) => {
      if (status === 'correct') return '🟩';
      if (status === 'partial') return '🟨';
      return '🟥';
    };

    const chronoEmoji = (status: DirectionStatus) => {
      if (status === 'correct') return '🟩';
      if (status === 'higher') return '⬆️';
      return '⬇️';
    };

    return [
      toEmoji(e.element.status),
      toEmoji(e.rarity.status),
      toEmoji(e.combatType.status),
      toEmoji(e.affiliation.status),
      chronoEmoji(e.chronological.status),
    ].join('');
  });

  return [
    `🥋 Jujutsudle (${modeLabel}) #${dateStr}`,
    `Palpites: ${count}/6`,
    '',
    ...rows,
    '',
    'JJKPPDB Offline • Jujutsu Kaisen: Phantom Parade',
  ].join('\n');
}

/**
 * Toca áudio ou pista sonora de acordo com o elemento ou voz do feiticeiro alvo.
 */
export function playJujutsudleClueAudio(target: Character): void {
  // Toca o tom elemental característico do feiticeiro
  if (target.element) {
    playElementalTone(target.element);
  }
  // Se for Yuji, toca o famoso grito Kokusen como Easter Egg de áudio
  if (target.name.toLowerCase().includes('yuji') || target.name.toLowerCase().includes('itadori')) {
    setTimeout(() => {
      playKokusenVoice();
    }, 150);
  }
}

/**
 * Toca efeito de celebração sonora de vitória.
 */
export function playJujutsudleVictorySound(): void {
  playSuccessFanfare();
}

/**
 * Carrega as estatísticas do jogador do localStorage.
 */
export function loadJujutsudleStats(): JujutsudleStats {
  if (typeof window === 'undefined') {
    return getInitialStats();
  }
  try {
    const saved = localStorage.getItem(STATS_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.warn('Erro ao carregar estatísticas do Jujutsudle:', err);
  }
  return getInitialStats();
}

/**
 * Salva as estatísticas do jogador no localStorage.
 */
export function saveJujutsudleStats(stats: JujutsudleStats): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (err) {
    console.warn('Erro ao salvar estatísticas do Jujutsudle:', err);
  }
}

/**
 * Registra a conclusão de uma partida nas estatísticas persistidas.
 */
export function recordGameResult(isWin: boolean, guessCount: number, dateStr: string = getDeviceLocalDateString()): JujutsudleStats {
  const stats = loadJujutsudleStats();

  stats.gamesPlayed += 1;
  stats.lastPlayedDate = dateStr;

  if (isWin) {
    stats.gamesWon += 1;
    
    // Calcula streak diário
    if (stats.lastWonDate) {
      const daysDiff = getDaysBetweenDates(stats.lastWonDate, dateStr);
      if (daysDiff === 1) {
        stats.currentStreak += 1;
      } else if (daysDiff > 1) {
        stats.currentStreak = 1; // Quebrou o streak
      }
    } else {
      stats.currentStreak = 1;
    }

    if (stats.currentStreak > stats.maxStreak) {
      stats.maxStreak = stats.currentStreak;
    }

    stats.lastWonDate = dateStr;

    // Registra distribuição de palpites
    stats.guessDistribution[guessCount] = (stats.guessDistribution[guessCount] || 0) + 1;
  } else {
    stats.currentStreak = 0;
  }

  saveJujutsudleStats(stats);
  return stats;
}

/**
 * Carrega o progresso diário salvo para permitir continuar a partida ao recarregar a tela.
 */
export function loadDailyState(today: string = getDeviceLocalDateString()): DailyGameState | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(DAILY_STORAGE_KEY);
    if (!saved) return null;
    const parsed: DailyGameState = JSON.parse(saved);
    if (parsed.date === today) {
      return parsed;
    }
  } catch (err) {
    console.warn('Erro ao carregar daily state:', err);
  }
  return null;
}

/**
 * Salva o progresso diário no localStorage.
 */
export function saveDailyState(state: DailyGameState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Erro ao salvar daily state:', err);
  }
}

function getInitialStats(): JujutsudleStats {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    lastPlayedDate: '',
    lastWonDate: '',
  };
}
