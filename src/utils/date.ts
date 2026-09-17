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
