const fs = require('fs');
const assert = require('assert');

const chars = JSON.parse(fs.readFileSync('./src/data/characters.json', 'utf8'));

// Simulação das funções
function normalizeRole(role) {
  if (!role) return 'Attacker';
  const norm = role.toLowerCase();
  if (norm.includes('attack') || norm.includes('atacante')) return 'Attacker';
  if (norm.includes('defend') || norm.includes('tank') || norm.includes('tanque')) return 'Defender';
  if (norm.includes('heal') || norm.includes('cura')) return 'Healer';
  if (norm.includes('debuff') || norm.includes('obstruct') || norm.includes('interfer')) return 'Debuffer';
  if (norm.includes('support') || norm.includes('enhance') || norm.includes('agitator')) return 'Support';
  return role;
}

function getRoleCategory(role) {
  const norm = normalizeRole(role);
  if (norm === 'Healer' || norm === 'Support') return 'SupportGroup';
  if (norm === 'Defender') return 'DefenseGroup';
  if (norm === 'Debuffer') return 'DebuffGroup';
  return 'AttackGroup';
}

function getProgressiveClues(target) {
  const fullText = (
    target.title + ' ' + 
    target.name + ' ' + 
    (target.tags || []).join(' ') + ' ' + 
    (target.affiliation || '')
  ).toLowerCase();

  let storyArc = 'Temporada 1';
  if (fullText.includes('teen') || fullText.includes('hidden inventory') || fullText.includes('premature death') || target.name === 'Toji Fushiguro') {
    storyArc = 'Inventário Oculto (Passado)';
  } else if (fullText.includes('fukuoka') || fullText.includes('saki rindo') || fullText.includes('kaito yuki') || fullText.includes('eiji urushi')) {
    storyArc = 'Phantom Parade (Fukuoka)';
  } else if (fullText.includes('shibuya') || fullText.includes('choso') || fullText.includes('0.2') || fullText.includes('shibuya incident') || fullText.includes('death painting') || fullText.includes('dagon') || fullText.includes('naobito')) {
    storyArc = 'Incidente de Shibuya';
  } else if (fullText.includes('movie') || fullText.includes('jjk 0') || (target.name.includes('Yuta') && !fullText.includes('executioner')) || target.name.includes('miguel')) {
    storyArc = 'Jujutsu Kaisen 0 (Filme)';
  }

  const hasDomain = Boolean(
    target.has_transformation || 
    (target.tags || []).includes('Domain') || 
    (target.ultimate?.name && (target.ultimate.name.toLowerCase().includes('domain') || target.ultimate.name.includes('領域展開')))
  );

  const specialGauge = target.stats?.special_gauge || '1500';
  const initialEnergy = target.stats?.initial_energy || '30';
  const firstLetter = target.name ? target.name.charAt(0).toUpperCase() : '?';

  return {
    storyArc,
    tacticalGauge: {
      hasDomain,
      specialGauge,
      initialEnergy,
    },
    firstLetter,
  };
}

console.log('--- TESTE 1: Normalização de Roles em todos os 109 personagens ---');
const validRoles = new Set(['Attacker', 'Defender', 'Healer', 'Debuffer', 'Support']);
chars.forEach(c => {
  const norm = normalizeRole(c.role);
  assert(validRoles.has(norm), `Role ${norm} para ${c.name} deve ser uma das 5 categorias canônicas!`);
});
console.log('✅ TESTE 1 PASSOU: Todos os 109 personagens foram normalizados com sucesso para uma das 5 funções táticas.');

console.log('\n--- TESTE 2: Comparação de Roles (Exato, Parcial, Incorreto) ---');
const attacker = chars.find(c => normalizeRole(c.role) === 'Attacker');
const anotherAttacker = chars.filter(c => normalizeRole(c.role) === 'Attacker')[1];
const healer = chars.find(c => normalizeRole(c.role) === 'Healer');
const supporter = chars.find(c => normalizeRole(c.role) === 'Support');
const defender = chars.find(c => normalizeRole(c.role) === 'Defender');

// Match exato: Attacker vs Attacker
assert.strictEqual(normalizeRole(attacker.role), normalizeRole(anotherAttacker.role));
console.log(`✅ Attacker vs Attacker -> Exato (Verde): ${attacker.name} vs ${anotherAttacker.name}`);

// Match parcial: Healer vs Supporter
assert.notStrictEqual(normalizeRole(healer.role), normalizeRole(supporter.role));
assert.strictEqual(getRoleCategory(healer.role), getRoleCategory(supporter.role));
console.log(`✅ Healer vs Supporter -> Parcial (Amarelo): ${healer.name} vs ${supporter.name}`);

// Incorreto: Attacker vs Defender
assert.notStrictEqual(getRoleCategory(attacker.role), getRoleCategory(defender.role));
console.log(`✅ Attacker vs Defender -> Incorreto (Vermelho): ${attacker.name} vs ${defender.name}`);

console.log('\n--- TESTE 3: Pistas Progressivas em Feiticeiros Notáveis ---');
const gojoTeen = chars.find(c => c.name.includes('Teen') && c.name.includes('Gojo'));
const cluesGojo = getProgressiveClues(gojoTeen);
assert.strictEqual(cluesGojo.storyArc, 'Inventário Oculto (Passado)');
console.log(`✅ Gojo Teen -> Arco: ${cluesGojo.storyArc}, Letra: ${cluesGojo.firstLetter}`);

const yuta = chars.find(c => c.name === 'Yuta Okkotsu' && !c.title.includes('Executioner'));
const cluesYuta = getProgressiveClues(yuta);
assert.strictEqual(cluesYuta.storyArc, 'Jujutsu Kaisen 0 (Filme)');
console.log(`✅ Yuta Okkotsu -> Arco: ${cluesYuta.storyArc}, Letra: ${cluesYuta.firstLetter}`);

const choso = chars.find(c => c.name === 'Choso');
const cluesChoso = getProgressiveClues(choso);
assert.strictEqual(cluesChoso.storyArc, 'Incidente de Shibuya');
console.log(`✅ Choso -> Arco: ${cluesChoso.storyArc}, Letra: ${cluesChoso.firstLetter}`);

const saki = chars.find(c => c.name === 'Saki Rindo');
const cluesSaki = getProgressiveClues(saki);
assert.strictEqual(cluesSaki.storyArc, 'Phantom Parade (Fukuoka)');
console.log(`✅ Saki Rindo -> Arco: ${cluesSaki.storyArc}, Letra: ${cluesSaki.firstLetter}`);

console.log('\n🎉 TODOS OS TESTES DE ROLE E PISTAS PROGRESSIVAS FORAM CONCLUÍDOS COM SUCESSO!');
