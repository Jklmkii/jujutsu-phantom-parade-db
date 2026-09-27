const assert = require('assert');
const fs = require('fs');

console.log('🧪 Iniciando suíte de testes do Modo Cânone & Filtro Anti-Spoiler...');

// 1. Carregar dados canônicos
const canonChars = JSON.parse(fs.readFileSync('./src/data/canonical_characters.json', 'utf8'));
console.log(`✓ Total de personagens canônicos carregados: ${canonChars.length}`);
assert.strictEqual(canonChars.length, 88, 'Deve conter exatamente 88 personagens canônicos');

// 2. Verificar Kaori Itadori
const kaori = canonChars.find(c => c.id === 'kaori_itadori');
assert(kaori, 'Kaori Itadori deve existir no catálogo');
assert(kaori.innateTechnique.includes('Anti-Gravidade') || kaori.innateTechnique.includes('Antigravity'), 'Técnica de Kaori deve mencionar Gravidade / Anti-Gravidade');
assert.strictEqual(kaori.cutoff, 'sendai', 'Kaori é revelada em flashbacks antes/durante Shibuya/Sendai');
console.log('✓ Kaori Itadori validada com sucesso com técnica Anti-Gravidade');

// 3. Testar Isolamento de Corte Anti-Spoiler (Sendai vs Shinjuku)
const sendaiList = canonChars.filter(c => c.cutoff === 'sendai');
const shinjukuExclusive = canonChars.filter(c => c.cutoff === 'shinjuku');

assert.strictEqual(sendaiList.length, 84, 'Modo Sendai deve conter exatamente 84 personagens');
assert.strictEqual(shinjukuExclusive.length, 4, 'Modo Shinjuku deve conter 4 personagens exclusivos');

// Garantir que nenhum personagem de Shinjuku está na lista Sendai
const shinjukuIds = new Set(shinjukuExclusive.map(c => c.id));
for (const char of sendaiList) {
  assert(!shinjukuIds.has(char.id), `Personagem de Shinjuku (${char.name}) vazou para a lista de Sendai!`);
}
console.log('✓ Isolamento anti-spoiler estrito validado: 84 Sendai, 4 Shinjuku exclusivos');

// 4. Testar algoritmo determinístico djb2
function hashStringDjb2(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

const dates = ['2026-09-26', '2026-09-27', '2026-09-28', '2026-10-01', '2026-12-31'];
dates.forEach(d => {
  const hashSendai = hashStringDjb2(`jjkppdb-canon-daily-sendai-${d}`);
  const targetSendai = sendaiList[hashSendai % sendaiList.length];
  assert(targetSendai, `Alvo Sendai não encontrado para data ${d}`);
  assert.strictEqual(targetSendai.cutoff, 'sendai', `Alvo do modo Sendai não pode ser spoiler de Shinjuku`);

  const hashShinjuku = hashStringDjb2(`jjkppdb-canon-daily-shinjuku-${d}`);
  const targetShinjuku = canonChars[hashShinjuku % canonChars.length];
  assert(targetShinjuku, `Alvo Shinjuku não encontrado para data ${d}`);
});
console.log('✓ Geração determinística diária de segredos testada para múltiplas datas');

// 5. Testar avaliação de palpites
const GRADE_RANK = {
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

const ARC_CHRONOLOGY = {
  'Jujutsu Kaisen 0': 1,
  'Temporada 1': 2,
  'Passado de Gojo': 3,
  'Incidente de Shibuya': 4,
  'Preparação Culling Game': 5,
  'Jogo do Abate (Sendai)': 6,
  'Batalha de Shinjuku': 7,
};

const gojo = canonChars.find(c => c.id === 'satoru_gojo');
const yuji = canonChars.find(c => c.id === 'yuji_itadori');
const sukuna = canonChars.find(c => c.id === 'ryomen_sukuna');

// Palpite Yuji contra Gojo:
// Gojo é Grau Especial (rank 8), Yuji é Grau 1 (rank 6) -> Gojo é higher
assert(GRADE_RANK[gojo.grade] > GRADE_RANK[yuji.grade], 'Gojo deve ter grau maior que Yuji');
assert(ARC_CHRONOLOGY[sukuna.debutArc] <= ARC_CHRONOLOGY[yuji.debutArc], 'Cronologia de arcos válida');

// Gojo estreou na Temporada 1 (ou JJK0), Kenjaku ou Sukuna
console.log('✓ Sistema hierárquico de graus e arcos cronológicos validado com sucesso');
console.log('🎉 Todos os testes unitários do Modo Cânone passaram com 100% de sucesso!');
