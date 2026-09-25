/**
 * Matriz de Probabilidade Matemática de Gacha
 * Baseada na Distribuição Binomial de Bernoulli:
 * P(X >= k) = 1 - sum_{i=0}^{k-1} binom(n, i) * p^i * (1-p)^(n-i)
 * 
 * Regras e taxas oficiais de Jujutsu Kaisen: Phantom Parade (JJKPP):
 * - Taxa de SSR em destaque (Featured Rate-Up): 0.7% (p = 0.007)
 * - Taxa total de personagens SSR (Base Rate): 2.5% (p = 0.025)
 * - Pity garantido no banner: 250 giros (75.000 cubos) para resgate direto
 */

export const CUBES_PER_PULL = 300;
export const CUBES_PER_MULTI = 3000;
export const PITY_PULLS = 250;
export const PITY_CUBES = PITY_PULLS * CUBES_PER_PULL; // 75.000

export const FEATURED_SSR_RATE = 0.007; // 0.7%
export const BASE_SSR_RATE = 0.025;     // 2.5%
export const BASE_SSR_MEMORY_RATE = 0.050; // 5.0%
export const TOTAL_SSR_RATE = 0.075;    // 7.5%

export interface ProbabilityPoint {
  pulls: number;
  cubes: number;
  prob: number;      // 0 a 1
  percent: number;   // 0 a 100
}

export interface ProbabilityTier {
  id: 'low' | 'moderate' | 'safe' | 'guaranteed';
  labelPt: string;
  labelEn: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  descriptionPt: string;
  descriptionEn: string;
}

/**
 * Converte quantidade de cubos para número de giros possíveis
 */
export function cubesToPulls(cubes: number): number {
  if (cubes <= 0) return 0;
  return Math.floor(cubes / CUBES_PER_PULL);
}

/**
 * Converte quantidade de giros para o custo total em cubos
 */
export function pullsToCubes(pulls: number): number {
  if (pulls <= 0) return 0;
  return pulls * CUBES_PER_PULL;
}

/**
 * Formata um valor de probabilidade (0 a 1) em string percentual legível
 */
export function formatProbability(prob: number, decimals: number = 2): string {
  if (isNaN(prob)) return '0.00%';
  const clamped = Math.max(0, Math.min(1, prob));
  if (clamped >= 0.99995 && decimals <= 2) return '100%';
  return `${(clamped * 100).toFixed(decimals)}%`;
}

/**
 * Calcula a probabilidade de obter pelo menos `targetCopies` cópias em `pulls` giros,
 * dada uma taxa `rate` por giro (ex: 0.007 para 0.7%), com suporte a Pity aos 250 giros.
 *
 * Utiliza relação de recorrência para estabilidade numérica sem overflow de fatoriais:
 * P(X = 0) = (1-p)^n
 * P(X = i) = P(X = i-1) * ((n - i + 1) / i) * (p / (1-p))
 */
export function calculatePullProbability(
  pulls: number,
  rate: number,
  targetCopies: number = 1,
  includePity: boolean = false
): number {
  const n = Math.max(0, Math.floor(pulls));
  const k = Math.max(1, Math.floor(targetCopies));
  const p = rate > 1 ? rate / 100 : Math.max(0, Math.min(1, rate));

  if (k <= 0) return 1.0;
  if (p <= 0) {
    if (includePity && Math.floor(n / PITY_PULLS) >= k) return 1.0;
    return 0.0;
  }
  if (p >= 1) {
    return n >= k ? 1.0 : 0.0;
  }

  // Se Pity estiver habilitado (250 giros = 1 cópia garantida via loja de pity)
  let effectiveNeededCopies = k;
  if (includePity) {
    const pityCopies = Math.floor(n / PITY_PULLS);
    if (pityCopies >= k) {
      return 1.0;
    }
    effectiveNeededCopies = k - pityCopies;
  }

  if (n < effectiveNeededCopies) {
    return 0.0;
  }

  // Caso mais comum e otimizado: 1 cópia
  if (effectiveNeededCopies === 1) {
    // P(X >= 1) = 1 - (1 - p)^n
    const pZero = Math.pow(1 - p, n);
    return Math.max(0, Math.min(1, 1 - pZero));
  }

  // Para k > 1 cópias:
  // P(X >= k) = 1 - sum_{i=0}^{k-1} P(X = i)
  let term = Math.pow(1 - p, n);
  let sum = term;
  const ratio = p / (1 - p);

  for (let i = 1; i < effectiveNeededCopies; i++) {
    term = term * ((n - i + 1) / i) * ratio;
    sum += term;
  }

  return Math.max(0, Math.min(1, 1 - sum));
}

/**
 * Calcula o número de giros necessários para atingir determinado limiar (threshold) de probabilidade
 * (Ex: 0.5 para 50%, 0.8 para 80%, 0.9 para 90%, 0.99 para 99%)
 */
export function calculatePullsForThreshold(
  threshold: number,
  rate: number,
  targetCopies: number = 1
): number {
  const t = threshold > 1 ? threshold / 100 : Math.max(0.0001, Math.min(0.999999, threshold));
  const p = rate > 1 ? rate / 100 : Math.max(0.000001, Math.min(0.999999, rate));
  const k = Math.max(1, Math.floor(targetCopies));

  // Para 1 cópia, solução analítica direta:
  // 1 - (1-p)^n >= t  =>  (1-p)^n <= 1 - t  =>  n >= ln(1-t) / ln(1-p)
  if (k === 1) {
    const pulls = Math.ceil(Math.log(1 - t) / Math.log(1 - p));
    return Math.max(1, pulls);
  }

  // Para k > 1 cópias, busca binária monótona rápida
  let low = k;
  let high = 50000;
  let result = high;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const prob = calculatePullProbability(mid, p, k, false);

    if (prob >= t) {
      result = mid;
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  return result;
}

/**
 * Gera os pontos da curva contínua de probabilidade para renderização em SVG
 */
export function generateProbabilityCurve(
  maxPulls: number = 300,
  rate: number = FEATURED_SSR_RATE,
  targetCopies: number = 1,
  includePity: boolean = false,
  stepSize?: number
): ProbabilityPoint[] {
  const limit = Math.max(20, maxPulls);
  const step = stepSize || Math.max(1, Math.round(limit / 80));

  const points: ProbabilityPoint[] = [];
  const pullSet = new Set<number>();

  for (let n = 0; n <= limit; n += step) {
    pullSet.add(n);
  }

  // Garante que marcos críticos estejam na curva
  pullSet.add(0);
  pullSet.add(limit);
  if (includePity && PITY_PULLS <= limit) {
    pullSet.add(PITY_PULLS - 1);
    pullSet.add(PITY_PULLS);
  }

  const sortedPulls = Array.from(pullSet).sort((a, b) => a - b);

  for (const pulls of sortedPulls) {
    const prob = calculatePullProbability(pulls, rate, targetCopies, includePity);
    points.push({
      pulls,
      cubes: pullsToCubes(pulls),
      prob,
      percent: prob * 100
    });
  }

  return points;
}

/**
 * Retorna o escalão (tier) de segurança para um dado nível de probabilidade
 */
export function getProbabilityTier(prob: number, hasPityGuaranteed: boolean = false): ProbabilityTier {
  if (hasPityGuaranteed || prob >= 0.999) {
    return {
      id: 'guaranteed',
      labelPt: 'Garantido (Pity)',
      labelEn: 'Guaranteed (Pity)',
      color: '#10b981', // emerald-500
      badgeBg: 'bg-emerald-950/60',
      badgeBorder: 'border-emerald-500/50',
      badgeText: 'text-emerald-300',
      descriptionPt: 'Certeza matemática absoluta ou 250 giros de pity acumulados.',
      descriptionEn: 'Absolute mathematical certainty or 250 pity pulls achieved.'
    };
  }

  if (prob >= 0.90) {
    return {
      id: 'safe',
      labelPt: 'Zona Segura (Quase Certeza)',
      labelEn: 'Safe Zone (Near Certainty)',
      color: '#06b6d4', // cyan-500
      badgeBg: 'bg-cyan-950/60',
      badgeBorder: 'border-cyan-500/50',
      badgeText: 'text-cyan-300',
      descriptionPt: 'Mais de 90% de probabilidade. Risco estatístico mínimo de shaft.',
      descriptionEn: 'Over 90% probability. Minimal statistical shaft risk.'
    };
  }

  if (prob >= 0.50) {
    return {
      id: 'moderate',
      labelPt: 'Moeda no Ar (Moderada)',
      labelEn: 'Coin Toss (Moderate)',
      color: '#f59e0b', // amber-500
      badgeBg: 'bg-amber-950/60',
      badgeBorder: 'border-amber-500/50',
      badgeText: 'text-amber-300',
      descriptionPt: 'Acima de 50%, mas com risco considerável de não obter a unidade.',
      descriptionEn: 'Above 50%, but still carries substantial shaft risk.'
    };
  }

  return {
    id: 'low',
    labelPt: 'Zona de Alto Risco (Baixa)',
    labelEn: 'High Risk Zone (Low)',
    color: '#ef4444', // red-500
    badgeBg: 'bg-red-950/60',
    badgeBorder: 'border-red-500/50',
    badgeText: 'text-red-400',
    descriptionPt: 'Menos de 50% de probabilidade. Recomenda-se economizar mais cubos.',
    descriptionEn: 'Under 50% probability. Saving more cubes is strongly advised.'
  };
}
