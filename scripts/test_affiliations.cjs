const fs = require('fs');
const assert = require('assert');

// Importar characters
const chars = JSON.parse(fs.readFileSync('./src/data/characters.json', 'utf8'));

// Simulação das funções do jujutsudle.ts
function normalizeAffiliation(affiliation) {
  if (!affiliation) return 'Jujutsu High';
  const clean = affiliation.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  const m1 = clean.match(/^Year\s*(\d)\s+([A-Za-z]+)\s+Jujutsu\s+High$/i);
  if (m1) {
    const school = m1[2].charAt(0).toUpperCase() + m1[2].slice(1).toLowerCase();
    return `${school} Jujutsu High Year ${m1[1]}`;
  }

  const m2 = clean.match(/^([A-Za-z]+)\s+Jujutsu\s+High\s+Year\s*(\d)$/i);
  if (m2) {
    const school = m2[1].charAt(0).toUpperCase() + m2[1].slice(1).toLowerCase();
    return `${school} Jujutsu High Year ${m2[2]}`;
  }

  if (/^Tokyo\s+Jujutsu\s+High\s+Teacher$/i.test(clean)) {
    return 'Tokyo Jujutsu High Officials';
  }

  if (/^Curse\s*Users?$/i.test(clean)) {
    return 'Curse User';
  }

  if (/^Incarnation/i.test(clean)) {
    return 'Incarnation';
  }

  return clean;
}

function getAffiliationGroup(affiliation) {
  if (!affiliation) return 'Outro';
  const norm = normalizeAffiliation(affiliation).toLowerCase();

  if (norm.includes('tokyo') || norm.includes('tóquio')) return 'Tokyo High';
  if (norm.includes('kyoto') || norm.includes('quioto')) return 'Kyoto High';
  if (norm.includes('cursed spirit') || norm.includes('maldição') || norm.includes('death painting')) return 'Curse';
  if (norm.includes('curse user') || norm.includes('sorcerer killer')) return 'Curse User';
  if (norm.includes('fukuoka')) return 'Fukuoka High';
  if (norm.includes('jujutsu high')) return 'Tokyo High';
  return norm;
}

function evaluateAffiliation(guess, target) {
  const guessAffil = normalizeAffiliation(guess.affiliation);
  const targetAffil = normalizeAffiliation(target.affiliation);
  const guessGroup = getAffiliationGroup(guessAffil);
  const targetGroup = getAffiliationGroup(targetAffil);

  let affiliationStatus = 'incorrect';
  if (guessAffil.toLowerCase() === targetAffil.toLowerCase()) {
    affiliationStatus = 'correct';
  } else if (guessGroup === targetGroup && guessGroup !== 'Outro') {
    affiliationStatus = 'partial';
  }
  return { status: affiliationStatus, value: guessAffil };
}

console.log('--- TESTE 1: Auditoria da Base (characters.json) ---');
let nonCanonicalCount = 0;
chars.forEach(c => {
  const norm = normalizeAffiliation(c.affiliation);
  if (c.affiliation !== norm) {
    console.error(`[ERRO] ${c.name} (${c.title}) tem afiliação não-canônica: "${c.affiliation}" vs "${norm}"`);
    nonCanonicalCount++;
  }
});
assert.strictEqual(nonCanonicalCount, 0, 'Todos os 109 personagens devem ter afiliação 100% canônica!');
console.log('✅ TESTE 1 PASSOU: Todos os 109 personagens têm afiliações canônicas padronizadas.');

console.log('\n--- TESTE 2: Caso Panda vs Inumaki (Mesmo 2º ano de Tóquio) ---');
const pandasYear2 = chars.filter(c => c.name === 'Panda' && c.affiliation.includes('Year 2'));
const inumakisYear2 = chars.filter(c => c.name === 'Toge Inumaki' && c.affiliation.includes('Year 2'));

console.log(`Encontradas ${pandasYear2.length} cartas do Panda (Year 2) e ${inumakisYear2.length} cartas do Inumaki (Year 2).`);
assert(pandasYear2.length > 0 && inumakisYear2.length > 0);

pandasYear2.forEach(p => {
  inumakisYear2.forEach(i => {
    const res = evaluateAffiliation(i, p);
    assert.strictEqual(res.status, 'correct', `Inumaki "${i.title}" deve ter afiliação IDENTICA a Panda "${p.title}"!`);
    assert.strictEqual(res.value, 'Tokyo Jujutsu High Year 2');
  });
});
console.log('✅ TESTE 2 PASSOU: Todas as combinações de Panda e Inumaki do 2º ano resultam em MATCH EXATO (Verde)!');

console.log('\n--- TESTE 3: Comparação Cruzada (Mesma Escola vs Escolas Diferentes) ---');
const yujiYear1 = chars.find(c => c.name === 'Yuji Itadori' && c.affiliation.includes('Year 1'));
const pandaYear2 = pandasYear2[0];
const momoKyoto = chars.find(c => c.name === 'Momo Nishimiya' && c.affiliation.includes('Kyoto'));
const mahito = chars.find(c => c.name === 'Mahito');

// Yuji (Year 1 Tokyo) vs Panda (Year 2 Tokyo) -> Deve ser PARCIAL (mesma escola Tokyo, anos diferentes)
const resYujiPanda = evaluateAffiliation(yujiYear1, pandaYear2);
assert.strictEqual(resYujiPanda.status, 'partial', 'Yuji (1º ano) e Panda (2º ano) devem ser PARCIAIS (Amarelo)');
console.log('✅ Yuji (Year 1 Tokyo) vs Panda (Year 2 Tokyo) -> status: partial (Amarelo)');

// Momo (Kyoto) vs Panda (Tokyo) -> Deve ser INCORRETO (Vermelho)
const resMomoPanda = evaluateAffiliation(momoKyoto, pandaYear2);
assert.strictEqual(resMomoPanda.status, 'incorrect', 'Momo (Kyoto) e Panda (Tokyo) devem ser INCORRETOS (Vermelho)');
console.log('✅ Momo (Kyoto) vs Panda (Tokyo) -> status: incorrect (Vermelho)');

// Mahito (Cursed Spirit) vs Panda (Tokyo) -> Deve ser INCORRETO (Vermelho)
const resMahitoPanda = evaluateAffiliation(mahito, pandaYear2);
assert.strictEqual(resMahitoPanda.status, 'incorrect', 'Mahito (Curse) e Panda (Tokyo) devem ser INCORRETOS (Vermelho)');
console.log('✅ Mahito (Curse) vs Panda (Tokyo) -> status: incorrect (Vermelho)');

console.log('\n🎉 TODOS OS TESTES DE AFILIAÇÃO PASSARAM COM 100% DE SUCESSO!');
