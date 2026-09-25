/**
 * Ascension & Skill Leveling Materials Calculator for Jujutsu Kaisen: Phantom Parade
 * 100% Offline Tactical Progression Engine
 */

export type ElementType = 'Blue' | 'Red' | 'Green' | 'Yellow';

export type GradeTier = 
  | 'Grade 4' 
  | 'Grade 3' 
  | 'Grade 2' 
  | 'Semi-Grade 1' 
  | 'Grade 1' 
  | 'Special Grade';

export interface MilestoneRequirement {
  level: number;
  fromGrade: GradeTier;
  toGrade: GradeTier;
  labelPt: string;
  labelEn: string;
  jpCost: number;
  crystals: {
    grade4?: number;
    grade3?: number;
    grade2?: number;
    semiGrade1?: number;
    grade1?: number;
    specialGrade?: number;
  };
}

export interface SkillStepCost {
  fromLevel: number;
  toLevel: number;
  jpCost: number;
  scrollTier1: number;
  scrollTier2: number;
  scrollTier3: number;
  domainShards: number;
}

export interface ResourceDetail {
  id: string;
  namePt: string;
  nameEn: string;
  category: 'currency' | 'xp' | 'crystal' | 'skill';
  amount: number;
  rarity?: GradeTier | 'Common' | 'Rare' | 'Legendary';
  color?: string;
  element?: string;
  subtextPt?: string;
  subtextEn?: string;
}

export interface AscensionCostResult {
  startLevel: number;
  targetLevel: number;
  element: string;
  startSkillLevel: number;
  targetSkillLevel: number;
  numSkills: number;
  includeUltimate: boolean;
  totalXp: number;
  levelingJp: number;
  ascensionJp: number;
  skillJp: number;
  totalJp: number;
  xpOrbs: {
    small: number;   // 100 XP cada
    medium: number;  // 1.000 XP cada
    large: number;   // 10.000 XP cada
  };
  elementalCrystals: {
    grade4: number;
    grade3: number;
    grade2: number;
    semiGrade1: number;
    grade1: number;
    specialGrade: number;
  };
  skillMaterials: {
    scrollTier1: number;
    scrollTier2: number;
    scrollTier3: number;
    domainShards: number;
  };
  milestonesPassed: MilestoneRequirement[];
  resourcesList: ResourceDetail[];
}

/** Marcos de Grau e Requisitos de Ascensão Oficiais */
export const GRADE_MILESTONES: MilestoneRequirement[] = [
  {
    level: 20,
    fromGrade: 'Grade 4',
    toGrade: 'Grade 3',
    labelPt: 'Ascensão Grau 4 → Grau 3 (Nível 20)',
    labelEn: 'Ascension Grade 4 → Grade 3 (Level 20)',
    jpCost: 15000,
    crystals: {
      grade4: 20,
      grade3: 10,
    },
  },
  {
    level: 40,
    fromGrade: 'Grade 3',
    toGrade: 'Grade 2',
    labelPt: 'Ascensão Grau 3 → Grau 2 (Nível 40)',
    labelEn: 'Ascension Grade 3 → Grade 2 (Level 40)',
    jpCost: 60000,
    crystals: {
      grade3: 30,
      grade2: 15,
    },
  },
  {
    level: 60,
    fromGrade: 'Grade 2',
    toGrade: 'Semi-Grade 1',
    labelPt: 'Ascensão Grau 2 → Semi-Grau 1 (Nível 60)',
    labelEn: 'Ascension Grade 2 → Semi-Grade 1 (Level 60)',
    jpCost: 200000,
    crystals: {
      grade2: 40,
      semiGrade1: 20,
    },
  },
  {
    level: 80,
    fromGrade: 'Semi-Grade 1',
    toGrade: 'Grade 1',
    labelPt: 'Ascensão Semi-Grau 1 → Grau 1 (Nível 80)',
    labelEn: 'Ascension Semi-Grade 1 → Grade 1 (Level 80)',
    jpCost: 500000,
    crystals: {
      semiGrade1: 50,
      grade1: 25,
    },
  },
  {
    level: 100,
    fromGrade: 'Grade 1',
    toGrade: 'Special Grade',
    labelPt: 'Ascensão Grau 1 → Grau Especial (Nível 90/100)',
    labelEn: 'Ascension Grade 1 → Special Grade (Level 90/100)',
    jpCost: 1200000,
    crystals: {
      grade1: 60,
      specialGrade: 15,
    },
  },
];

/** Tabela de Custos de Upgrade por Habilidade (Nível 1 até 10) */
export const SKILL_UPGRADE_STEPS: SkillStepCost[] = [
  { fromLevel: 1, toLevel: 2, jpCost: 5000, scrollTier1: 5, scrollTier2: 0, scrollTier3: 0, domainShards: 0 },
  { fromLevel: 2, toLevel: 3, jpCost: 10000, scrollTier1: 10, scrollTier2: 0, scrollTier3: 0, domainShards: 0 },
  { fromLevel: 3, toLevel: 4, jpCost: 25000, scrollTier1: 15, scrollTier2: 5, scrollTier3: 0, domainShards: 0 },
  { fromLevel: 4, toLevel: 5, jpCost: 50000, scrollTier1: 0, scrollTier2: 15, scrollTier3: 0, domainShards: 0 },
  { fromLevel: 5, toLevel: 6, jpCost: 100000, scrollTier1: 0, scrollTier2: 25, scrollTier3: 5, domainShards: 0 },
  { fromLevel: 6, toLevel: 7, jpCost: 200000, scrollTier1: 0, scrollTier2: 0, scrollTier3: 20, domainShards: 0 },
  { fromLevel: 7, toLevel: 8, jpCost: 400000, scrollTier1: 0, scrollTier2: 0, scrollTier3: 35, domainShards: 2 },
  { fromLevel: 8, toLevel: 9, jpCost: 750000, scrollTier1: 0, scrollTier2: 0, scrollTier3: 50, domainShards: 5 },
  { fromLevel: 9, toLevel: 10, jpCost: 1500000, scrollTier1: 0, scrollTier2: 0, scrollTier3: 75, domainShards: 10 },
];

/**
 * Gera a tabela cumulativa de XP para os níveis de 1 a 100
 * Baseada na progressão de Jujutsu Kaisen: Phantom Parade
 */
function buildCumulativeXpTable(): number[] {
  const table = new Array(101).fill(0);
  let currentTotal = 0;

  for (let lv = 1; lv <= 100; lv++) {
    if (lv === 1) {
      table[lv] = 0;
      continue;
    }
    let step = 0;
    if (lv <= 20) {
      // 1-20: ~25.000 XP total (~1.315 por nível)
      step = 1200 + (lv * 15);
    } else if (lv <= 40) {
      // 20-40: ~125.000 XP total (~6.250 por nível)
      step = 4000 + ((lv - 20) * 225);
    } else if (lv <= 60) {
      // 40-60: ~450.000 XP total (~22.500 por nível)
      step = 14000 + ((lv - 40) * 850);
    } else if (lv <= 80) {
      // 60-80: ~1.400.000 XP total (~70.000 por nível)
      step = 45000 + ((lv - 60) * 2500);
    } else {
      // 80-100: ~3.500.000 XP total (~175.000 por nível)
      step = 115000 + ((lv - 80) * 6000);
    }
    currentTotal += Math.round(step);
    table[lv] = currentTotal;
  }
  return table;
}

export const CUMULATIVE_XP_TABLE: number[] = buildCumulativeXpTable();

/**
 * Calcula a decomposição ótima de Orbes de XP (Grande, Médio, Pequeno)
 */
export function calculateOrbBreakdown(totalXp: number): { small: number; medium: number; large: number } {
  if (totalXp <= 0) {
    return { small: 0, medium: 0, large: 0 };
  }
  const large = Math.floor(totalXp / 10000);
  const remAfterLarge = totalXp % 10000;

  const medium = Math.floor(remAfterLarge / 1000);
  const remAfterMedium = remAfterLarge % 1000;

  const small = Math.ceil(remAfterMedium / 100);

  return { small, medium, large };
}

/**
 * Informações visuais e de cores elementais para os cristais
 */
export function getElementMeta(element: string) {
  const norm = (element || '').toLowerCase();
  if (norm.includes('blue') || norm.includes('azul') || norm.includes('蒼')) {
    return {
      namePt: 'Azul (蒼)',
      nameEn: 'Blue (蒼)',
      colorHex: '#3b82f6',
      badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      borderClass: 'border-blue-500/40',
      glowClass: 'shadow-blue-500/20',
      bgGrad: 'from-blue-950/40 to-blue-900/20',
    };
  }
  if (norm.includes('red') || norm.includes('vermelho') || norm.includes('幻')) {
    return {
      namePt: 'Vermelho (幻)',
      nameEn: 'Red (幻)',
      colorHex: '#ef4444',
      badgeClass: 'bg-red-500/10 text-red-400 border-red-500/30',
      borderClass: 'border-red-500/40',
      glowClass: 'shadow-red-500/20',
      bgGrad: 'from-red-950/40 to-red-900/20',
    };
  }
  if (norm.includes('green') || norm.includes('verde') || norm.includes('夜') || norm.includes('shadow')) {
    return {
      namePt: 'Verde (夜)',
      nameEn: 'Green (夜)',
      colorHex: '#10b981',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      borderClass: 'border-emerald-500/40',
      glowClass: 'shadow-emerald-500/20',
      bgGrad: 'from-emerald-950/40 to-emerald-900/20',
    };
  }
  // Padrão: Yellow / Amarelo
  return {
    namePt: 'Amarelo (行)',
    nameEn: 'Yellow (行)',
    colorHex: '#eab308',
    badgeClass: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    borderClass: 'border-yellow-500/40',
    glowClass: 'shadow-yellow-500/20',
    bgGrad: 'from-yellow-950/40 to-yellow-900/20',
  };
}

export interface CalculateAscensionOptions {
  numSkills?: number;
  includeUltimate?: boolean;
}

/**
 * Calcula o custo total e detalhado de ascensão de nível e habilidades de um feiticeiro
 * 
 * @param startLevel Nível inicial (1 a 100)
 * @param targetLevel Nível final desejado (1 a 100)
 * @param element Elemento do feiticeiro ('Blue' | 'Red' | 'Green' | 'Yellow')
 * @param startSkillLevel Nível inicial das habilidades (1 a 10, default 1)
 * @param targetSkillLevel Nível almejado das habilidades (1 a 10, default 1)
 * @param options Opções adicionais (número de habilidades ativas e inclusão da técnica suprema)
 */
export function calculateAscensionCost(
  startLevel: number,
  targetLevel: number,
  element: string,
  startSkillLevel = 1,
  targetSkillLevel = 1,
  options?: CalculateAscensionOptions
): AscensionCostResult {
  const safeStartLv = Math.max(1, Math.min(100, Math.floor(startLevel || 1)));
  const safeTargetLv = Math.max(safeStartLv, Math.min(100, Math.floor(targetLevel || safeStartLv)));

  const safeStartSkill = Math.max(1, Math.min(10, Math.floor(startSkillLevel || 1)));
  const safeTargetSkill = Math.max(safeStartSkill, Math.min(10, Math.floor(targetSkillLevel || safeStartSkill)));

  const numSkills = options?.numSkills ?? 3;
  const includeUltimate = options?.includeUltimate ?? true;

  // 1. Cálculo de XP e Ouro de Nivelamento
  const startXp = CUMULATIVE_XP_TABLE[safeStartLv] || 0;
  const targetXp = CUMULATIVE_XP_TABLE[safeTargetLv] || 0;
  const totalXp = Math.max(0, targetXp - startXp);
  const levelingJp = Math.round(totalXp * 0.5);

  const xpOrbs = calculateOrbBreakdown(totalXp);

  // 2. Marcos de Ascensão de Grau ultrapassados
  let ascensionJp = 0;
  const elementalCrystals = {
    grade4: 0,
    grade3: 0,
    grade2: 0,
    semiGrade1: 0,
    grade1: 0,
    specialGrade: 0,
  };

  const milestonesPassed: MilestoneRequirement[] = [];

  for (const milestone of GRADE_MILESTONES) {
    // Se o nível inicial é menor que o marco e o nível alvo atinge ou ultrapassa o marco
    if (safeStartLv < milestone.level && safeTargetLv >= milestone.level) {
      milestonesPassed.push(milestone);
      ascensionJp += milestone.jpCost;

      if (milestone.crystals.grade4) elementalCrystals.grade4 += milestone.crystals.grade4;
      if (milestone.crystals.grade3) elementalCrystals.grade3 += milestone.crystals.grade3;
      if (milestone.crystals.grade2) elementalCrystals.grade2 += milestone.crystals.grade2;
      if (milestone.crystals.semiGrade1) elementalCrystals.semiGrade1 += milestone.crystals.semiGrade1;
      if (milestone.crystals.grade1) elementalCrystals.grade1 += milestone.crystals.grade1;
      if (milestone.crystals.specialGrade) elementalCrystals.specialGrade += milestone.crystals.specialGrade;
    }
  }

  // 3. Materiais de Habilidade
  let singleSkillJp = 0;
  let singleScrollTier1 = 0;
  let singleScrollTier2 = 0;
  let singleScrollTier3 = 0;
  let singleDomainShards = 0;

  for (const step of SKILL_UPGRADE_STEPS) {
    if (step.fromLevel >= safeStartSkill && step.toLevel <= safeTargetSkill) {
      singleSkillJp += step.jpCost;
      singleScrollTier1 += step.scrollTier1;
      singleScrollTier2 += step.scrollTier2;
      singleScrollTier3 += step.scrollTier3;
      singleDomainShards += step.domainShards;
    }
  }

  // Multiplicador: Habilidades ativas + Técnica Suprema (se ativada, tratada como 1 habilidade de mesmo custo)
  const totalSkillSlots = numSkills + (includeUltimate ? 1 : 0);
  const skillJp = singleSkillJp * totalSkillSlots;
  const skillMaterials = {
    scrollTier1: singleScrollTier1 * totalSkillSlots,
    scrollTier2: singleScrollTier2 * totalSkillSlots,
    scrollTier3: singleScrollTier3 * totalSkillSlots,
    domainShards: singleDomainShards * totalSkillSlots,
  };

  const totalJp = levelingJp + ascensionJp + skillJp;
  const elemMeta = getElementMeta(element);

  // 4. Lista Unificada de Recursos para Cards e Checklist de Farm
  const resourcesList: ResourceDetail[] = [
    {
      id: 'currency_jp',
      namePt: 'Ouro (JP Currency)',
      nameEn: 'Gold (JP Currency)',
      category: 'currency',
      amount: totalJp,
      rarity: 'Common',
      color: '#eab308',
      subtextPt: `${milestonesPassed.length} marcos + nvl. + hab.`,
      subtextEn: `${milestonesPassed.length} milestones + lvl + skills`,
    },
    {
      id: 'xp_total',
      namePt: 'Experiência Amaldiçoada Total',
      nameEn: 'Total Cursed XP',
      category: 'xp',
      amount: totalXp,
      rarity: 'Common',
      color: '#a855f7',
      subtextPt: `Lv ${safeStartLv} → Lv ${safeTargetLv}`,
      subtextEn: `Lv ${safeStartLv} → Lv ${safeTargetLv}`,
    },
    {
      id: 'xp_orb_large',
      namePt: 'Orbe de XP Grande (10k)',
      nameEn: 'Large XP Orb (10k)',
      category: 'xp',
      amount: xpOrbs.large,
      rarity: 'Grade 1',
      color: '#a855f7',
      subtextPt: '修練の燈 (Grande)',
      subtextEn: 'Training Light (Large)',
    },
    {
      id: 'xp_orb_medium',
      namePt: 'Orbe de XP Médio (1k)',
      nameEn: 'Medium XP Orb (1k)',
      category: 'xp',
      amount: xpOrbs.medium,
      rarity: 'Grade 2',
      color: '#8b5cf6',
      subtextPt: '修練の燈 (Médio)',
      subtextEn: 'Training Light (Medium)',
    },
    {
      id: 'xp_orb_small',
      namePt: 'Orbe de XP Pequeno (100)',
      nameEn: 'Small XP Orb (100)',
      category: 'xp',
      amount: xpOrbs.small,
      rarity: 'Grade 4',
      color: '#6366f1',
      subtextPt: '修練の燈 (Pequeno)',
      subtextEn: 'Training Light (Small)',
    },
  ];

  // Cristais elementais
  if (elementalCrystals.grade4 > 0) {
    resourcesList.push({
      id: `crystal_g4_${element.toLowerCase()}`,
      namePt: `Cristal Elemental Grau 4 (${elemMeta.namePt})`,
      nameEn: `Grade 4 Crystal (${elemMeta.nameEn})`,
      category: 'crystal',
      amount: elementalCrystals.grade4,
      rarity: 'Grade 4',
      color: elemMeta.colorHex,
      element,
      subtextPt: 'Ascensão Lv 20',
      subtextEn: 'Ascension Lv 20',
    });
  }

  if (elementalCrystals.grade3 > 0) {
    resourcesList.push({
      id: `crystal_g3_${element.toLowerCase()}`,
      namePt: `Cristal Elemental Grau 3 (${elemMeta.namePt})`,
      nameEn: `Grade 3 Crystal (${elemMeta.nameEn})`,
      category: 'crystal',
      amount: elementalCrystals.grade3,
      rarity: 'Grade 3',
      color: elemMeta.colorHex,
      element,
      subtextPt: 'Ascensão Lv 20 e 40',
      subtextEn: 'Ascension Lv 20 & 40',
    });
  }

  if (elementalCrystals.grade2 > 0) {
    resourcesList.push({
      id: `crystal_g2_${element.toLowerCase()}`,
      namePt: `Cristal Elemental Grau 2 (${elemMeta.namePt})`,
      nameEn: `Grade 2 Crystal (${elemMeta.nameEn})`,
      category: 'crystal',
      amount: elementalCrystals.grade2,
      rarity: 'Grade 2',
      color: elemMeta.colorHex,
      element,
      subtextPt: 'Ascensão Lv 40 e 60',
      subtextEn: 'Ascension Lv 40 & 60',
    });
  }

  if (elementalCrystals.semiGrade1 > 0) {
    resourcesList.push({
      id: `crystal_sg1_${element.toLowerCase()}`,
      namePt: `Cristal Semi-Grau 1 (${elemMeta.namePt})`,
      nameEn: `Semi-Grade 1 Crystal (${elemMeta.nameEn})`,
      category: 'crystal',
      amount: elementalCrystals.semiGrade1,
      rarity: 'Semi-Grade 1',
      color: elemMeta.colorHex,
      element,
      subtextPt: 'Ascensão Lv 60 e 80',
      subtextEn: 'Ascension Lv 60 & 80',
    });
  }

  if (elementalCrystals.grade1 > 0) {
    resourcesList.push({
      id: `crystal_g1_${element.toLowerCase()}`,
      namePt: `Cristal Nobre Grau 1 (${elemMeta.namePt})`,
      nameEn: `Grade 1 Noble Crystal (${elemMeta.nameEn})`,
      category: 'crystal',
      amount: elementalCrystals.grade1,
      rarity: 'Grade 1',
      color: elemMeta.colorHex,
      element,
      subtextPt: 'Ascensão Lv 80 e 100',
      subtextEn: 'Ascension Lv 80 & 100',
    });
  }

  if (elementalCrystals.specialGrade > 0) {
    resourcesList.push({
      id: `crystal_sp_${element.toLowerCase()}`,
      namePt: `Núcleo Grau Especial (${elemMeta.namePt})`,
      nameEn: `Special Grade Core (${elemMeta.nameEn})`,
      category: 'crystal',
      amount: elementalCrystals.specialGrade,
      rarity: 'Special Grade',
      color: elemMeta.colorHex,
      element,
      subtextPt: 'Ascensão Máxima Lv 100',
      subtextEn: 'Max Ascension Lv 100',
    });
  }

  // Materiais de Habilidade
  if (skillMaterials.scrollTier1 > 0) {
    resourcesList.push({
      id: 'skill_scroll_t1',
      namePt: 'Pergaminho de Técnica I (Básico)',
      nameEn: 'Technique Scroll I (Basic)',
      category: 'skill',
      amount: skillMaterials.scrollTier1,
      rarity: 'Common',
      color: '#38bdf8',
      subtextPt: `${totalSkillSlots} Técnicas Lv ${safeStartSkill} → ${safeTargetSkill}`,
      subtextEn: `${totalSkillSlots} Skills Lv ${safeStartSkill} → ${safeTargetSkill}`,
    });
  }

  if (skillMaterials.scrollTier2 > 0) {
    resourcesList.push({
      id: 'skill_scroll_t2',
      namePt: 'Pergaminho de Técnica II (Intermediário)',
      nameEn: 'Technique Scroll II (Intermediate)',
      category: 'skill',
      amount: skillMaterials.scrollTier2,
      rarity: 'Grade 2',
      color: '#a855f7',
      subtextPt: `${totalSkillSlots} Técnicas Lv ${safeStartSkill} → ${safeTargetSkill}`,
      subtextEn: `${totalSkillSlots} Skills Lv ${safeStartSkill} → ${safeTargetSkill}`,
    });
  }

  if (skillMaterials.scrollTier3 > 0) {
    resourcesList.push({
      id: 'skill_scroll_t3',
      namePt: 'Pergaminho de Técnica III (Avançado)',
      nameEn: 'Technique Scroll III (Advanced)',
      category: 'skill',
      amount: skillMaterials.scrollTier3,
      rarity: 'Grade 1',
      color: '#f59e0b',
      subtextPt: `${totalSkillSlots} Técnicas Lv ${safeStartSkill} → ${safeTargetSkill}`,
      subtextEn: `${totalSkillSlots} Skills Lv ${safeStartSkill} → ${safeTargetSkill}`,
    });
  }

  if (skillMaterials.domainShards > 0) {
    resourcesList.push({
      id: 'skill_domain_shard',
      namePt: 'Fragmento de Expansão de Domínio',
      nameEn: 'Domain Expansion Shard',
      category: 'skill',
      amount: skillMaterials.domainShards,
      rarity: 'Special Grade',
      color: '#ef4444',
      subtextPt: 'Para Habilidades Nível 8 a 10',
      subtextEn: 'For Skills Level 8 to 10',
    });
  }

  return {
    startLevel: safeStartLv,
    targetLevel: safeTargetLv,
    element,
    startSkillLevel: safeStartSkill,
    targetSkillLevel: safeTargetSkill,
    numSkills,
    includeUltimate,
    totalXp,
    levelingJp,
    ascensionJp,
    skillJp,
    totalJp,
    xpOrbs,
    elementalCrystals,
    skillMaterials,
    milestonesPassed,
    resourcesList,
  };
}

/** Formata números inteiros com separadores de milhares amigáveis (ex: 1.250.000) */
export function formatResourceNumber(num: number): string {
  return (num || 0).toLocaleString('pt-BR');
}
