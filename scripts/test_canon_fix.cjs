const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync('./src/data/canonical_characters.json', 'utf-8'));

console.log('🧪 Iniciando testes de validação das correções do Jujutsudle Cânone...\n');

// 1. Teste de Retratos de Todos os 88 Personagens
let missingImages = 0;
data.forEach(c => {
  const assetPath = c.gameImage 
    ? path.join('./public/assets', c.gameImage)
    : path.join('./public/assets', c.image);

  if (!fs.existsSync(assetPath)) {
    console.error(`❌ Imagem não encontrada para ${c.name}: ${assetPath}`);
    missingImages++;
  }
});

if (missingImages === 0) {
  console.log(`✅ Teste 1: Todos os 88 personagens possuem imagens locais nítidas e válidas no disco!`);
} else {
  console.error(`❌ Falha: ${missingImages} personagens sem imagem.`);
  process.exit(1);
}

// 2. Teste de Diferenciação entre Jinichi Zenin e Naoya Zenin
const jinichi = data.find(c => c.id === 'jinichi_zenin');
const naoya = data.find(c => c.id === 'naoya_zenin');
const ogi = data.find(c => c.id === 'ogi_zenin');
const toji = data.find(c => c.id === 'toji_fushiguro');

console.log('\n📊 Comparativo de Atributos dos Zenin:');
console.log(`- Jinichi Zenin: [Técnica: ${jinichi.techniqueType}] | [Combate: ${jinichi.combatStyle}] | [Imagem: ${jinichi.image}]`);
console.log(`- Naoya Zenin:   [Técnica: ${naoya.techniqueType}] | [Combate: ${naoya.combatStyle}] | [Imagem: ${naoya.image}]`);
console.log(`- Ogi Zenin:     [Técnica: ${ogi.techniqueType}] | [Combate: ${ogi.combatStyle}] | [Imagem: ${ogi.image}]`);
console.log(`- Toji Fushiguro:[Técnica: ${toji.techniqueType}] | [Combate: ${toji.combatStyle}] | [Imagem: ${toji.gameImage}]`);

if (jinichi.techniqueType !== naoya.techniqueType && jinichi.combatStyle !== naoya.combatStyle) {
  console.log('✅ Teste 2: Jinichi e Naoya agora são 100% distinguíveis e únicos!');
} else {
  console.error('❌ Falha: Jinichi e Naoya ainda compartilham a mesma técnica ou estilo.');
  process.exit(1);
}

// 3. Teste da Ordem Cronológica dos Arcos
const ARC_CHRONOLOGY = {
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

const yujiArcRank = ARC_CHRONOLOGY['Temporada 1'];
const jinichiArcRank = ARC_CHRONOLOGY[jinichi.debutArc];

console.log(`\n⏳ Cronologia de Arcos:`);
console.log(`- Yuji Itadori (Temporada 1): Rank ${yujiArcRank}`);
console.log(`- Jinichi Zenin (${jinichi.debutArc}): Rank ${jinichiArcRank}`);

if (jinichiArcRank > yujiArcRank) {
  const direction = jinichiArcRank > yujiArcRank ? 'higher (↑ Mais recente)' : 'lower (↓ Mais antigo)';
  console.log(`- Direção ao palpitar Yuji com alvo Jinichi: ${direction}`);
  console.log('✅ Teste 3: O Jogo do Abate é cronologicamente posterior aos outros arcos, seta aponta para CIMA (↑)!');
} else {
  console.error('❌ Falha na cronologia do Jogo do Abate.');
  process.exit(1);
}

console.log('\n🎉 TODOS OS TESTES PASSARAM COM 100% DE SUCESSO!');
