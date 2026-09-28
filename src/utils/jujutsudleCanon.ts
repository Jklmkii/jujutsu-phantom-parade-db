import canonicalCharactersData from '../data/canonical_characters.json';
import { getDeviceLocalDateString } from './date';

export type CanonCutoff = 'sendai' | 'shinjuku';

export interface CanonicalCharacter {
  id: string;
  name: string;
  kanji: string;
  species: string;
  gender: string;
  grade: string;
  affiliation: string;
  techniqueType: string;
  combatStyle: string;
  innateTechnique: string;
  hasDomain: boolean;
  domainName?: string;
  debutArc: string;
  cutoff: 'sendai' | 'shinjuku';
  image: string;
  gameImage?: string;
}

export type MatchStatus = 'correct' | 'partial' | 'incorrect';
export type DirectionStatus = 'correct' | 'higher' | 'lower'; // higher: alvo tem grau maior ou estreou depois; lower: alvo tem grau menor ou estreou antes

export interface CanonGuessEvaluation {
  character: CanonicalCharacter;
  species: { status: MatchStatus; value: string };
  gender: { status: MatchStatus; value: string };
  grade: { status: MatchStatus; direction: DirectionStatus; value: string };
  affiliation: { status: MatchStatus; value: string };
  techniqueType: { status: MatchStatus; value: string };
  combatStyle: { status: MatchStatus; value: string };
  hasDomain: { status: MatchStatus; value: string; domainName?: string };
  debutArc: { status: MatchStatus; direction: DirectionStatus; value: string };
  isCorrect: boolean;
}

export interface CanonGameState {
  date: string;
  cutoff: CanonCutoff;
  targetId: string;
  guesses: string[]; // character IDs
  solved: boolean;
}

export const CANON_CUTOFF_STORAGE_KEY = 'jjkppdb-canon-cutoff';
export const CANON_DAILY_STORAGE_KEY = 'jjkppdb-canon-daily-state';

// Ordem hierárquica dos Graus canônicos (do menor ao maior)
export const GRADE_RANK: Record<string, number> = {
  'Civil / Sem Grau': 0,
  'Grau 4': 1,
  'Grau 3': 2,
  'Semi-Grau 2': 3,
  'Grau 2': 4,
  'Semi-Grau 1': 5,
  'Grau 1': 6,
  'Grau 1 Especial': 7,
  'Restrição Celestial': 7.5,
  'Grau Especial': 8,
};

// Ordem cronológica dos Arcos narrativos de Jujutsu Kaisen
export const ARC_CHRONOLOGY: Record<string, number> = {
  'Jujutsu Kaisen 0': 1,
  'Temporada 1': 2,
  'Inventário Oculto': 3,
  'Passado de Gojo': 3,
  'Incidente de Shibuya': 4,
  'Preparação Culling Game': 5,
  'Jogo do Abate': 6,
  'Jogo do Abate (Sendai)': 6,
  'Batalha de Shinjuku': 7,
};

/**
 * Retorna o catálogo canônico filtrado de acordo com o nível anti-spoiler do usuário.
 */
export function getCanonicalCharacters(cutoff: CanonCutoff = 'sendai'): CanonicalCharacter[] {
  const all = canonicalCharactersData as CanonicalCharacter[];
  if (cutoff === 'sendai') {
    return all.filter(c => c.cutoff === 'sendai');
  }
  return all;
}

/**
 * Hash determinístico djb2 para seleção diária de segredo canônico.
 */
export function hashStringDjb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Retorna o personagem canônico do dia baseado na data local e no ponto de corte anti-spoiler.
 */
export function getDailyCanonicalCharacter(
  dateStr: string = getDeviceLocalDateString(),
  cutoff: CanonCutoff = 'sendai'
): CanonicalCharacter {
  const characters = getCanonicalCharacters(cutoff);
  if (characters.length === 0) {
    throw new Error('No canonical characters found for cutoff: ' + cutoff);
  }

  const hash = hashStringDjb2(`jjkppdb-canon-daily-${cutoff}-${dateStr}`);
  const index = hash % characters.length;
  return characters[index];
}

/**
 * Avalia um palpite comparando com o personagem canônico alvo.
 */
export function evaluateCanonGuess(
  guessedChar: CanonicalCharacter,
  targetChar: CanonicalCharacter
): CanonGuessEvaluation {
  const isCorrect = guessedChar.id === targetChar.id;

  // 1. Espécie
  const speciesMatch: MatchStatus = guessedChar.species.toLowerCase() === targetChar.species.toLowerCase()
    ? 'correct'
    : 'incorrect';

  // 2. Gênero
  const genderMatch: MatchStatus = guessedChar.gender.toLowerCase() === targetChar.gender.toLowerCase()
    ? 'correct'
    : 'incorrect';

  // 3. Grau / Grade com direção
  const guessedGradeRank = GRADE_RANK[guessedChar.grade] ?? 0;
  const targetGradeRank = GRADE_RANK[targetChar.grade] ?? 0;
  let gradeStatus: MatchStatus = 'incorrect';
  let gradeDirection: DirectionStatus = 'correct';

  if (guessedChar.grade.toLowerCase() === targetChar.grade.toLowerCase()) {
    gradeStatus = 'correct';
    gradeDirection = 'correct';
  } else {
    // Se a diferença for pequena (+-1 nível de grau), pode ser partial
    if (Math.abs(guessedGradeRank - targetGradeRank) <= 1) {
      gradeStatus = 'partial';
    }
    gradeDirection = targetGradeRank > guessedGradeRank ? 'higher' : 'lower';
  }

  // 4. Afiliação
  let affiliationStatus: MatchStatus = 'incorrect';
  const gAffil = guessedChar.affiliation.toLowerCase();
  const tAffil = targetChar.affiliation.toLowerCase();

  if (gAffil === tAffil) {
    affiliationStatus = 'correct';
  } else if (
    (gAffil.includes('tóquio') && tAffil.includes('tóquio')) ||
    (gAffil.includes('quioto') && tAffil.includes('quioto')) ||
    (gAffil.includes('zen\'in') && tAffil.includes('zen\'in')) ||
    (gAffil.includes('kenjaku') && tAffil.includes('kenjaku')) ||
    (gAffil.includes('culling game') && tAffil.includes('culling game')) ||
    (gAffil.includes('jogo do abate') && tAffil.includes('jogo do abate')) ||
    (gAffil.includes('maldições do desastre') && tAffil.includes('maldições do desastre'))
  ) {
    affiliationStatus = 'partial';
  }

  // 5. Tipo de Técnica (Técnica Inata vs Restrição Celestial vs Sem Técnica Inata)
  const gTech = (guessedChar.techniqueType || 'Técnica Inata').toLowerCase();
  const tTech = (targetChar.techniqueType || 'Técnica Inata').toLowerCase();
  let techStatus: MatchStatus = 'incorrect';
  if (gTech === tTech) {
    techStatus = 'correct';
  } else if (
    (gTech.includes('sem') && tTech.includes('restrição')) ||
    (gTech.includes('restrição') && tTech.includes('sem'))
  ) {
    // Parcial: ambos são casos de lutadores que não possuem técnica inata gravada
    techStatus = 'partial';
  }

  // 6. Estilo de Combate / Foco de Luta
  const gStyle = (guessedChar.combatStyle || 'Feitiçaria Pura').toLowerCase();
  const tStyle = (targetChar.combatStyle || 'Feitiçaria Pura').toLowerCase();
  let styleStatus: MatchStatus = 'incorrect';
  if (gStyle === tStyle) {
    styleStatus = 'correct';
  } else if (
    (gStyle.includes('corpo a corpo') && tStyle.includes('corpo a corpo')) ||
    (gStyle.includes('espada') && tStyle.includes('espada')) ||
    (gStyle.includes('ferramenta') && tStyle.includes('ferramenta')) ||
    (gStyle.includes('disparo') && tStyle.includes('disparo')) ||
    (gStyle.includes('suporte') && tStyle.includes('suporte')) ||
    (gStyle.includes('feitiçaria') && tStyle.includes('feitiçaria'))
  ) {
    styleStatus = 'partial';
  }

  // 7. Expansão de Domínio
  const domainStatus: MatchStatus = guessedChar.hasDomain === targetChar.hasDomain
    ? 'correct'
    : 'incorrect';

  // 8. Arco de Estreia com direção cronológica
  const guessedArcRank = ARC_CHRONOLOGY[guessedChar.debutArc] ?? 1;
  const targetArcRank = ARC_CHRONOLOGY[targetChar.debutArc] ?? 1;
  let arcStatus: MatchStatus = 'incorrect';
  let arcDirection: DirectionStatus = 'correct';

  if (guessedChar.debutArc.toLowerCase() === targetChar.debutArc.toLowerCase()) {
    arcStatus = 'correct';
    arcDirection = 'correct';
  } else {
    if (Math.abs(guessedArcRank - targetArcRank) <= 1) {
      arcStatus = 'partial';
    }
    arcDirection = targetArcRank > guessedArcRank ? 'higher' : 'lower';
  }

  return {
    character: guessedChar,
    species: { status: speciesMatch, value: guessedChar.species },
    gender: { status: genderMatch, value: guessedChar.gender },
    grade: { status: gradeStatus, direction: gradeDirection, value: guessedChar.grade },
    affiliation: { status: affiliationStatus, value: guessedChar.affiliation },
    techniqueType: { status: techStatus, value: guessedChar.techniqueType || 'Técnica Inata' },
    combatStyle: { status: styleStatus, value: guessedChar.combatStyle || 'Feitiçaria Pura' },
    hasDomain: {
      status: domainStatus,
      value: guessedChar.hasDomain ? 'Sim' : 'Não',
      domainName: guessedChar.domainName
    },
    debutArc: { status: arcStatus, direction: arcDirection, value: guessedChar.debutArc },
    isCorrect,
  };
}

/**
 * Salva a preferência de corte anti-spoiler no localStorage.
 */
export function saveCanonCutoffPreference(cutoff: CanonCutoff): void {
  try {
    localStorage.setItem(CANON_CUTOFF_STORAGE_KEY, cutoff);
  } catch (err) {
    console.error('Failed to save canon cutoff preference:', err);
  }
}

/**
 * Carrega a preferência de corte anti-spoiler do localStorage (padrão 'sendai').
 */
export function loadCanonCutoffPreference(): CanonCutoff {
  try {
    const val = localStorage.getItem(CANON_CUTOFF_STORAGE_KEY);
    if (val === 'shinjuku' || val === 'sendai') {
      return val;
    }
  } catch (err) {
    console.error('Failed to load canon cutoff preference:', err);
  }
  return 'sendai';
}

/**
 * Salva o estado da partida canônica do dia.
 */
export function saveDailyCanonGameState(state: CanonGameState): void {
  try {
    const existing = loadAllCanonDailyStates();
    existing[state.date] = state;
    localStorage.setItem(CANON_DAILY_STORAGE_KEY, JSON.stringify(existing));
  } catch (err) {
    console.error('Failed to save daily canon state:', err);
  }
}

/**
 * Carrega todos os estados de partidas canônicas gravados.
 */
export function loadAllCanonDailyStates(): Record<string, CanonGameState> {
  try {
    const data = localStorage.getItem(CANON_DAILY_STORAGE_KEY);
    if (data) {
      return JSON.parse(data) as Record<string, CanonGameState>;
    }
  } catch (err) {
    console.error('Failed to load all daily canon states:', err);
  }
  return {};
}

/**
 * Carrega o estado da partida canônica para uma data específica.
 */
export function loadDailyCanonGameState(
  dateStr: string = getDeviceLocalDateString(),
  cutoff: CanonCutoff = 'sendai'
): CanonGameState {
  const all = loadAllCanonDailyStates();
  if (all[dateStr] && all[dateStr].cutoff === cutoff) {
    return all[dateStr];
  }
  const target = getDailyCanonicalCharacter(dateStr, cutoff);
  return {
    date: dateStr,
    cutoff,
    targetId: target.id,
    guesses: [],
    solved: false,
  };
}

/**
 * Formata os resultados de tentativas canônicas em emojis compartilháveis (estilo Wordle).
 */
export function generateCanonShareText(
  evaluations: CanonGuessEvaluation[],
  dateStr: string,
  cutoff: CanonCutoff
): string {
  const solved = evaluations.some(e => e.isCorrect);
  const cutoffLabel = cutoff === 'sendai' ? 'Até Sendai (Anime/Mangá)' : 'Mangá Completo (Shinjuku)';
  let text = `Jujutsudle Cânone ${dateStr} [${cutoffLabel}]\n`;
  text += solved ? `Concluído em ${evaluations.length} tentativas! 🏆\n\n` : `Derrota... ${evaluations.length} tentativas.\n\n`;

  const statusToEmoji = (status: MatchStatus, direction?: DirectionStatus) => {
    if (status === 'correct') return '🟩';
    if (status === 'partial') {
      if (direction === 'higher') return '🔼';
      if (direction === 'lower') return '🔽';
      return '🟨';
    }
    if (direction === 'higher') return '⬆️';
    if (direction === 'lower') return '⬇️';
    return '🟥';
  };

  evaluations.forEach(ev => {
    const spEmoji = statusToEmoji(ev.species.status);
    const genEmoji = statusToEmoji(ev.gender.status);
    const grEmoji = statusToEmoji(ev.grade.status, ev.grade.direction);
    const afEmoji = statusToEmoji(ev.affiliation.status);
    const techEmoji = statusToEmoji(ev.techniqueType.status);
    const combatEmoji = statusToEmoji(ev.combatStyle.status);
    const dmEmoji = statusToEmoji(ev.hasDomain.status);
    const arcEmoji = statusToEmoji(ev.debutArc.status, ev.debutArc.direction);

    text += `${spEmoji}${genEmoji}${grEmoji}${afEmoji}${techEmoji}${combatEmoji}${dmEmoji}${arcEmoji}\n`;
  });

  text += '\nJogue em: JJKPPDB Offline';
  return text;
}
