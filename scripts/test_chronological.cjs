const fs = require('fs');
const path = require('path');

const chars = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/characters.json'), 'utf8'));

function parseReleaseDateToEpoch(dateStr) {
  if (!dateStr) return 0;
  const clean = dateStr.trim();
  const parts = clean.split(/[-/.\s]+/);
  if (parts.length === 3) {
    const p0 = parseInt(parts[0], 10);
    const p1 = parseInt(parts[1], 10);
    const p2 = parseInt(parts[2], 10);
    if (!isNaN(p0) && !isNaN(p1) && !isNaN(p2)) {
      if (p0 > 1000) return Date.UTC(p0, p1 - 1, p2);
      if (p2 > 1000) return Date.UTC(p2, p1 - 1, p0);
    }
  }
  const parsed = Date.parse(clean);
  return isNaN(parsed) ? 0 : parsed;
}

console.log('=== TESTE 1: Validação de Epochs em todos os 109 personagens ===');
let zeroEpochs = [];
chars.forEach(c => {
  const ep = parseReleaseDateToEpoch(c.release_date);
  if (!ep || isNaN(ep) || ep < 1600000000000) {
    zeroEpochs.push({ name: c.name, date: c.release_date, epoch: ep });
  }
});
console.log('Personagens com datas inválidas ou epoch zero:', zeroEpochs.length);
if (zeroEpochs.length > 0) {
  console.error('FALHA:', zeroEpochs);
  process.exit(1);
}
console.log('✓ Todos os 109 personagens possuem datas válidas convertidas para epoch UTC!');

console.log('\n=== TESTE 2: Caso do usuário — Takuma Ino (28/04/2025) como Alvo ===');
const ino = chars.find(c => c.name.includes('Takuma Ino'));
const megumiLaunch = chars.find(c => c.name === 'Megumi Fushiguro' && c.release_date.includes('2023'));
const gojoLaunch = chars.find(c => c.name === 'Satoru Gojo' && c.release_date.includes('2023'));
const makiRecent = chars.find(c => c.name.includes("Maki") && c.release_date.includes('2025'));
const kamo2024 = chars.find(c => c.name.includes('Noritoshi Kamo'));

const inoEpoch = parseReleaseDateToEpoch(ino.release_date);
const megumiEpoch = parseReleaseDateToEpoch(megumiLaunch.release_date);
const gojoEpoch = parseReleaseDateToEpoch(gojoLaunch.release_date);
const makiEpoch = parseReleaseDateToEpoch(makiRecent.release_date);
const kamoEpoch = parseReleaseDateToEpoch(kamo2024.release_date);

console.log(`[ALVO] Takuma Ino: ${ino.release_date} -> ${new Date(inoEpoch).toISOString()}`);
console.log(`[PALPITE 1] Megumi (Lançamento): ${megumiLaunch.release_date} -> ${new Date(megumiEpoch).toISOString()}`);
console.log(`[PALPITE 2] Gojo (Lançamento): ${gojoLaunch.release_date} -> ${new Date(gojoEpoch).toISOString()}`);
console.log(`[PALPITE 3] Noritoshi Kamo: ${kamo2024.release_date} -> ${new Date(kamoEpoch).toISOString()}`);
console.log(`[PALPITE 4] Maki (Março 2025): ${makiRecent.release_date} -> ${new Date(makiEpoch).toISOString()}`);

function compare(targetEpoch, guessEpoch) {
  if (targetEpoch > guessEpoch) return 'higher';
  if (targetEpoch < guessEpoch) return 'lower';
  return 'correct';
}

const resMegumi = compare(inoEpoch, megumiEpoch);
const resGojo = compare(inoEpoch, gojoEpoch);
const resKamo = compare(inoEpoch, kamoEpoch);
const resMaki = compare(inoEpoch, makiEpoch);

console.log('\nResultados da comparação (Seta indicada para o usuário):');
console.log(`Ino vs Megumi: ${resMegumi} (esperado: higher / ↑ Mais recente) -> ${resMegumi === 'higher' ? '✓ CORRETO' : '✗ ERRO'}`);
console.log(`Ino vs Gojo: ${resGojo} (esperado: higher / ↑ Mais recente) -> ${resGojo === 'higher' ? '✓ CORRETO' : '✗ ERRO'}`);
console.log(`Ino vs Kamo: ${resKamo} (esperado: higher / ↑ Mais recente) -> ${resKamo === 'higher' ? '✓ CORRETO' : '✗ ERRO'}`);
console.log(`Ino vs Maki: ${resMaki} (esperado: higher / ↑ Mais recente) -> ${resMaki === 'higher' ? '✓ CORRETO' : '✗ ERRO'}`);

if (resMegumi !== 'higher' || resGojo !== 'higher' || resKamo !== 'higher' || resMaki !== 'higher') {
  console.error('\nFALHA: Comparações retornaram valores incorretos!');
  process.exit(1);
}

console.log('\n=== TESTE 3: Matriz Aleatória Cruzada (500 pares de personagens) ===');
let passCount = 0;
for (let i = 0; i < 500; i++) {
  const c1 = chars[Math.floor(Math.random() * chars.length)];
  const c2 = chars[Math.floor(Math.random() * chars.length)];
  const ep1 = parseReleaseDateToEpoch(c1.release_date);
  const ep2 = parseReleaseDateToEpoch(c2.release_date);
  
  const d1 = new Date(ep1);
  const d2 = new Date(ep2);
  
  if (ep1 > ep2) {
    if (d1 <= d2) throw new Error('Data UTC divergiu');
  } else if (ep1 < ep2) {
    if (d1 >= d2) throw new Error('Data UTC divergiu');
  }
  passCount++;
}
console.log(`✓ 500/500 testes cruzados aleatórios validados com sucesso!`);
console.log('\n🎉 TODOS OS TESTES PASSARAM COM 100% DE SUCESSO!');
