/**
 * Utilitários de Data com Segurança de Fuso Horário Local (Anti-UTC Regression)
 * Em conformidade com AGENTS.md Regra 5.A: nunca usar new Date().toISOString() para resets diários.
 */

/**
 * Retorna a data do dispositivo no fuso horário local formatada como "YYYY-MM-DD".
 */
export const getDeviceLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Calcula a diferença em dias corridos inteiros de calendário entre duas datas "YYYY-MM-DD" (dataB - dataA).
 */
export const getDaysBetweenDates = (dateAStr: string, dateBStr: string): number => {
  if (!dateAStr || !dateBStr) return 0;
  const partsA = dateAStr.split('-').map(Number);
  const partsB = dateBStr.split('-').map(Number);
  if (partsA.length < 3 || partsB.length < 3) return 0;

  const utcA = Date.UTC(partsA[0], partsA[1] - 1, partsA[2]);
  const utcB = Date.UTC(partsB[0], partsB[1] - 1, partsB[2]);
  return Math.floor((utcB - utcA) / (1000 * 60 * 60 * 24));
};

/**
 * Formata "YYYY-MM-DD" para exibição amigável "DD/MM/YYYY".
 */
export const formatDateDisplay = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

/**
 * Converte string no formato "DD/MM/YYYY" para objeto Date normalizado (meio-dia UTC).
 */
export const parseDMY = (s: string): Date => {
  if (!s) return new Date();
  const clean = s.split(' ')[0]; // remove "(12:00)" se presente
  const parts = clean.split('/');
  if (parts.length < 3) return new Date();
  return new Date(Date.UTC(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10), 12, 0, 0));
};

/**
 * Formata um objeto Date para string "DD/MM/YYYY".
 */
export const formatDMY = (date: Date): string => {
  const d = String(date.getUTCDate()).padStart(2, '0');
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const y = date.getUTCFullYear();
  return `${d}/${m}/${y}`;
};

export interface RealtimeEventStatus {
  status: 'released' | 'current' | 'upcoming';
  statusLabelPt: string;
  statusLabelEn: string;
  daysBadgePt: string;
  daysBadgeEn: string;
  predictedGlobalFormatted: string;
  diffDays: number;
}

/**
 * Calcula o status em tempo real de um evento no Global com base na data do dispositivo e no lag calibrado.
 * @param jpDateStr Data no Japão no formato "DD/MM/YYYY"
 * @param lagDays Dias de defasagem JP -> Global (padrão 79)
 * @param now Data atual do dispositivo (padrão new Date())
 * @param eventDurationDays Duração estimada do evento ativo (padrão 14 dias)
 */
export const calculateRealtimeEventStatus = (
  jpDateStr: string,
  lagDays: number = 79,
  now: Date = new Date(),
  eventDurationDays: number = 14,
  forceReleased: boolean = false
): RealtimeEventStatus => {
  const jpDate = parseDMY(jpDateStr);
  const predictedGlobal = new Date(jpDate.getTime());
  predictedGlobal.setUTCDate(predictedGlobal.getUTCDate() + lagDays);

  // Normaliza a data atual do dispositivo para meio-dia UTC para cálculo de dias de calendário inteiros
  const nowNorm = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0));
  const diffMs = predictedGlobal.getTime() - nowNorm.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const predictedGlobalFormatted = formatDMY(predictedGlobal);

  if (forceReleased) {
    return {
      status: 'released',
      statusLabelPt: 'Já Lançado no Global',
      statusLabelEn: 'Already Released in Global',
      daysBadgePt: '',
      daysBadgeEn: '',
      predictedGlobalFormatted,
      diffDays,
    };
  }

  if (diffDays === 0) {
    return {
      status: 'current',
      statusLabelPt: '🔥 Em Andamento no Global (Lançado Hoje)',
      statusLabelEn: '🔥 Active in Global (Launched Today)',
      daysBadgePt: 'Hoje às 12:00',
      daysBadgeEn: 'Today at 12:00',
      predictedGlobalFormatted,
      diffDays,
    };
  }

  if (diffDays < 0) {
    const daysSinceLaunch = Math.abs(diffDays);
    if (daysSinceLaunch <= eventDurationDays) {
      const remainingDays = Math.max(1, eventDurationDays - daysSinceLaunch);
      return {
        status: 'current',
        statusLabelPt: daysSinceLaunch === 1 
          ? '🔥 Em Andamento no Global (Lançado Ontem)' 
          : `🔥 Em Andamento no Global (Lançado há ${daysSinceLaunch} dias)`,
        statusLabelEn: daysSinceLaunch === 1 
          ? '🔥 Active in Global (Launched Yesterday)' 
          : `🔥 Active in Global (Launched ${daysSinceLaunch} days ago)`,
        daysBadgePt: remainingDays === 1 ? 'Ativo (1d restante)' : `Ativo (${remainingDays}d restantes)`,
        daysBadgeEn: remainingDays === 1 ? 'Active (1d left)' : `Active (${remainingDays}d left)`,
        predictedGlobalFormatted,
        diffDays,
      };
    }

    return {
      status: 'released',
      statusLabelPt: 'Já Lançado no Global',
      statusLabelEn: 'Already Released in Global',
      daysBadgePt: '',
      daysBadgeEn: '',
      predictedGlobalFormatted,
      diffDays,
    };
  }

  // diffDays > 0 (Futuro / Upcoming)
  return {
    status: 'upcoming',
    statusLabelPt: diffDays === 1 
      ? '⌛ Próximo no Global (em 1 dia)' 
      : `⌛ Próximo no Global (em ${diffDays} dias)`,
    statusLabelEn: diffDays === 1 
      ? '⌛ Upcoming in Global (in 1 day)' 
      : `⌛ Upcoming in Global (in ${diffDays} days)`,
    daysBadgePt: diffDays === 1 ? 'Em 1 dia' : `Em ${diffDays} dias`,
    daysBadgeEn: diffDays === 1 ? 'In 1 day' : `In ${diffDays} days`,
    predictedGlobalFormatted,
    diffDays,
  };
};
