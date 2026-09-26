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

export type GameMode = 'classic' | 'silhouette' | 'skill' | 'free';

export interface TargetSkillInfo {
  character: Character;
  skillName: string;
  skillIcon: string;
  skillType: 'skill' | 'ultimate';
  skillSlot?: number;
  cost?: string;
}

export interface DailyGameState {
  date: string;
  targetId: string;
  guesses: string[]; // character IDs
  solved: boolean;
  gameMode: GameMode;
  targetSkill?: TargetSkillInfo;
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
 * Obtém o personagem do dia baseado na data local ("YYYY-MM-DD") e no modo de jogo ('classic' | 'silhouette' | 'skill').
 * Garante que os modos Silhueta e Habilidade sempre recebam alvos diferentes do modo Clássico no mesmo dia.
 */
export function getDailyCharacter(
  dateStr: string = getDeviceLocalDateString(),
  mode: GameMode = 'classic'
): Character {
  const characters = getJujutsudleCharacters();
  if (characters.length === 0) {
    throw new Error('No characters found in database');
  }

  // Hash determinístico padrão para o modo clássico
  const classicHash = hashStringDjb2(`jjkppdb-daily-sorcerer-classic-${dateStr}`);
  const classicIndex = classicHash % characters.length;

  if (mode === 'silhouette') {
    // Hash determinístico exclusivo para o modo silhueta usando salt distinto
    const silhouetteHash = hashStringDjb2(`jjkppdb-daily-sorcerer-silhouette-${dateStr}`);
    let silhouetteIndex = silhouetteHash % characters.length;

    // Se por coincidência de hash colidir, garante que seja um personagem diferente
    if (silhouetteIndex === classicIndex) {
      silhouetteIndex = (silhouetteIndex + 1) % characters.length;
    }
    return characters[silhouetteIndex];
  }

  if (mode === 'skill') {
    // Hash determinístico exclusivo para o modo habilidade
    const skillTarget = getDailySkill(dateStr, characters[classicIndex].id);
    return skillTarget.character;
  }

  return characters[classicIndex];
}

/**
 * Obtém a Habilidade/Técnica do dia para o Modo Habilidade.
 */
export function getDailySkill(
  dateStr: string = getDeviceLocalDateString(),
  excludeCharId?: string
): TargetSkillInfo {
  const characters = getJujutsudleCharacters();
  const eligibleChars = characters.filter(c => 
    c.id !== excludeCharId &&
    (c.skills?.some(s => Boolean(s.icon)) || Boolean(c.ultimate?.icon))
  );

  const charHash = hashStringDjb2(`jjkppdb-daily-skill-char-${dateStr}`);
  const character = eligibleChars[charHash % eligibleChars.length];

  const allSkills: TargetSkillInfo[] = [];
  if (character.skills) {
    character.skills.forEach((s) => {
      if (s.icon) {
        allSkills.push({
          character,
          skillName: s.name,
          skillIcon: s.icon,
          skillType: 'skill',
          skillSlot: s.slot,
          cost: s.cost || '0'
        });
      }
    });
  }
  if (character.ultimate?.icon) {
    allSkills.push({
      character,
      skillName: character.ultimate.name,
      skillIcon: character.ultimate.icon,
      skillType: 'ultimate',
      cost: 'Special'
    });
  }

  const skillHash = hashStringDjb2(`jjkppdb-daily-skill-pick-${dateStr}`);
  return allSkills[skillHash % allSkills.length];
}

/**
 * Sorteia uma técnica aleatória para o Modo Habilidade em Prática Livre.
 */
export function getRandomSkill(excludeCharId?: string): TargetSkillInfo {
  const characters = getJujutsudleCharacters();
  const eligibleChars = characters.filter(c => 
    c.id !== excludeCharId &&
    (c.skills?.some(s => Boolean(s.icon)) || Boolean(c.ultimate?.icon))
  );
  const character = eligibleChars[Math.floor(Math.random() * eligibleChars.length)];

  const allSkills: TargetSkillInfo[] = [];
  if (character.skills) {
    character.skills.forEach((s) => {
      if (s.icon) {
        allSkills.push({
          character,
          skillName: s.name,
          skillIcon: s.icon,
          skillType: 'skill',
          skillSlot: s.slot,
          cost: s.cost || '0'
        });
      }
    });
  }
  if (character.ultimate?.icon) {
    allSkills.push({
      character,
      skillName: character.ultimate.name,
      skillIcon: character.ultimate.icon,
      skillType: 'ultimate',
      cost: 'Special'
    });
  }

  return allSkills[Math.floor(Math.random() * allSkills.length)];
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
 * Normaliza datas com múltiplos formatos (YYYY-MM-DD, D/M/YYYY, DD-MM-YYYY, etc.)
 * para um timestamp epoch numérico em UTC para comparação cronológica 100% precisa.
 */
export function parseReleaseDateToEpoch(dateStr: string): number {
  if (!dateStr) return 0;
  const clean = dateStr.trim();
  
  // Divide por qualquer separador comum: hífen (-), barra (/), ponto (.) ou espaço
  const parts = clean.split(/[-/.\s]+/);
  if (parts.length === 3) {
    const p0 = parseInt(parts[0], 10);
    const p1 = parseInt(parts[1], 10);
    const p2 = parseInt(parts[2], 10);

    if (!isNaN(p0) && !isNaN(p1) && !isNaN(p2)) {
      // Caso 1: YYYY-MM-DD ou YYYY/MM/DD
      if (p0 > 1000) {
        return Date.UTC(p0, p1 - 1, p2);
      }
      // Caso 2: DD-MM-YYYY, D/M/YYYY ou DD/MM/YYYY (onde o terceiro termo é o ano de 4 dígitos)
      if (p2 > 1000) {
        return Date.UTC(p2, p1 - 1, p0);
      }
    }
  }

  // Fallback padrão se não for 3 partes numéricas
  const parsed = Date.parse(clean);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formata qualquer data de lançamento para a exibição canônica DD/MM/YYYY na tabela.
 */
export function formatReleaseDateDisplay(dateStr: string): string {
  if (!dateStr) return '—';
  const clean = dateStr.trim();
  const parts = clean.split(/[-/.\s]+/);
  if (parts.length === 3) {
    const p0 = parseInt(parts[0], 10);
    const p1 = parseInt(parts[1], 10);
    const p2 = parseInt(parts[2], 10);
    if (!isNaN(p0) && !isNaN(p1) && !isNaN(p2)) {
      if (p0 > 1000) {
        return `${String(p2).padStart(2, '0')}/${String(p1).padStart(2, '0')}/${p0}`;
      }
      if (p2 > 1000) {
        return `${String(p0).padStart(2, '0')}/${String(p1).padStart(2, '0')}/${p2}`;
      }
    }
  }
  return clean;
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
      formattedDate: formatReleaseDateDisplay(guess.release_date) 
    },
    isCorrect,
  };
}

/**
 * Gera string de emojis compartilhável estilo Wordle / Loldle para a área de transferência.
 */
export function generateShareResult(
  evaluations: GuessEvaluation[], 
  gameMode: GameMode, 
  dateStr: string = getDeviceLocalDateString()
): string {
  const modeLabel = 
    gameMode === 'classic' ? 'Clássico' : 
    gameMode === 'silhouette' ? 'Silhueta' : 
    gameMode === 'skill' ? 'Habilidade' : 'Prática Livre';
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
/**
 * Status de resolução de um dia específico no Arquivo do Calendário.
 */
export type ArchiveDayStatus = 'won' | 'lost' | 'played' | 'unplayed';

/**
 * Registra a conclusão de uma partida nas estatísticas persistidas.
 * Se a partida for de um dia anterior (Arquivo Histórico), vitórias somam aos totais sem
 * resetar o streak do jogador atual se perder o dia retrô.
 */
export function recordGameResult(isWin: boolean, guessCount: number, dateStr: string = getDeviceLocalDateString()): JujutsudleStats {
  const stats = loadJujutsudleStats();
  const todayStr = getDeviceLocalDateString();
  const isHistorical = dateStr !== todayStr;

  stats.gamesPlayed += 1;
  stats.lastPlayedDate = todayStr;

  if (isWin) {
    stats.gamesWon += 1;
    
    // Calcula streak diário somente para jogos do dia de hoje (não afeta negativamente ao jogar o arquivo)
    if (!isHistorical) {
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
    }

    // Registra distribuição de palpites
    stats.guessDistribution[guessCount] = (stats.guessDistribution[guessCount] || 0) + 1;
  } else if (!isHistorical) {
    stats.currentStreak = 0;
  }

  saveJujutsudleStats(stats);
  return stats;
}

/**
 * Carrega o progresso diário salvo para uma data específica e modo de jogo,
 * permitindo continuar a partida ou navegar no Arquivo de Dias Anteriores.
 */
export function loadDailyState(
  dateStr: string = getDeviceLocalDateString(),
  mode: GameMode = 'classic'
): DailyGameState | null {
  if (typeof window === 'undefined') return null;
  try {
    // 1. Tenta carregar pela chave indexada por data e modo
    const specificKey = `${DAILY_STORAGE_KEY}-${mode}-${dateStr}`;
    const specificSaved = localStorage.getItem(specificKey);
    if (specificSaved) {
      return JSON.parse(specificSaved);
    }

    // 2. Fallback: chave genérica do modo
    const modeKey = `${DAILY_STORAGE_KEY}-${mode}`;
    let saved = localStorage.getItem(modeKey);
    
    // 3. Fallback retrocompatível para o modo clássico se salvo na chave legada raiz
    if (!saved && mode === 'classic') {
      saved = localStorage.getItem(DAILY_STORAGE_KEY);
    }

    if (!saved) return null;
    const parsed: DailyGameState = JSON.parse(saved);
    if (parsed.date === dateStr) {
      return parsed;
    }
  } catch (err) {
    console.warn('Erro ao carregar daily state:', err);
  }
  return null;
}

/**
 * Salva o progresso diário no localStorage segregado por data e modo de jogo.
 */
export function saveDailyState(state: DailyGameState): void {
  if (typeof window === 'undefined') return;
  try {
    const mode = state.gameMode || 'classic';
    const todayStr = getDeviceLocalDateString();

    // Salva na chave indexada pela data do desafio (preserva histórico perpétuo do calendário)
    const specificKey = `${DAILY_STORAGE_KEY}-${mode}-${state.date}`;
    const serialized = JSON.stringify(state);
    localStorage.setItem(specificKey, serialized);

    // Se for o dia de hoje, mantém sincronizado com a chave do modo para retrocompatibilidade
    if (state.date === todayStr) {
      const modeKey = `${DAILY_STORAGE_KEY}-${mode}`;
      localStorage.setItem(modeKey, serialized);
    }
  } catch (err) {
    console.warn('Erro ao salvar daily state:', err);
  }
}

/**
 * Consulta o status de um dia específico para marcação visual nas células do Calendário.
 */
export function getArchiveDayStatus(dateStr: string, mode: GameMode = 'classic'): ArchiveDayStatus {
  if (typeof window === 'undefined') return 'unplayed';
  try {
    const state = loadDailyState(dateStr, mode);
    if (!state || state.guesses.length === 0) return 'unplayed';
    if (state.solved) return 'won';
    if (state.guesses.length >= 6) return 'lost';
    return 'played';
  } catch {
    return 'unplayed';
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
