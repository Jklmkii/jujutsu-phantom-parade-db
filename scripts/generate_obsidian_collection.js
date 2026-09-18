import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const charactersPath = path.resolve(__dirname, '../src/data/characters.json');
const storePath = path.resolve(__dirname, '../src/store/useJjkStore.ts');
const targetMdPath = 'C:\\Users\\lucas\\OneDrive\\Área de Trabalho\\code\\Obsidian-Vault\\Projetos\\Jujutsu\\Minha Colecao JJKPP.md';

const characters = JSON.parse(fs.readFileSync(charactersPath, 'utf8'));
const storeContent = fs.readFileSync(storePath, 'utf8');

// Extract DEFAULT_OWNED_CHARACTER_IDS
const match = storeContent.match(/DEFAULT_OWNED_CHARACTER_IDS:\s*string\[\]\s*=\s*\[([\s\S]*?)\];/);
if (!match) {
  console.error('Could not find DEFAULT_OWNED_CHARACTER_IDS');
  process.exit(1);
}

const ownedIds = match[1]
  .split('\n')
  .map(line => line.trim().replace(/^['",\s]+|['",\s]+$/g, ''))
  .filter(id => id.length > 0);

console.log(`Found ${ownedIds.length} owned character IDs.`);

const ownedChars = characters.filter(c => ownedIds.includes(c.id));
const unownedChars = characters.filter(c => !ownedIds.includes(c.id));

const sortChars = (list) =>
  list.slice().sort((a, b) => a.name.localeCompare(b.name) || (a.epithet || '').localeCompare(b.epithet || ''));

const getElementDisplay = (el) => {
  const norm = (el || '').toLowerCase();
  if (norm.includes('blue') || norm.includes('幻')) return '幻 Blue';
  if (norm.includes('red') || norm.includes('夜')) return '夜 Red';
  if (norm.includes('green') || norm.includes('影')) return '影 Green';
  if (norm.includes('yellow') || norm.includes('行')) return '行 Yellow';
  return el;
};

const formatTable = (list) => {
  const sorted = sortChars(list);
  const rows = [
    '| # | Personagem | Epíteto | Elemento | Foco | Função |',
    '|---|---|---|---|---|---|'
  ];
  sorted.forEach((c, idx) => {
    const ep = (c.epithet || '').replace(/^['"]|['"]$/g, '');
    rows.push(`| ${idx + 1} | ${c.name} | ${ep} | ${getElementDisplay(c.element)} | ${c.focus || '-'} | ${c.role || '-'} |`);
  });
  return rows.join('\n');
};

const ownedSSR = ownedChars.filter(c => c.rarity === 'SSR');
const ownedSR = ownedChars.filter(c => c.rarity === 'SR');
const ownedR = ownedChars.filter(c => c.rarity === 'R');

const unownedSSR = unownedChars.filter(c => c.rarity === 'SSR');
const unownedSR = unownedChars.filter(c => c.rarity === 'SR');
const unownedR = unownedChars.filter(c => c.rarity === 'R');

const mdContent = `---
tags: [jjk, phantom-parade, minha-colecao]
atualizado: 2026-09-17
---

# 🎮 Minha Coleção — Jujutsu Kaisen: Phantom Parade

> Personagens que eu possuo na minha conta do servidor NA (América do Norte).

## 📊 Resumo
- **Total de Personagens:** ${ownedChars.length} / ${characters.length}
- **SSR:** ${ownedSSR.length}
- **SR:** ${ownedSR.length}
- **R:** ${ownedR.length}

## 🏆 Personagens Próprios

### SSR (${ownedSSR.length} unidades)
${formatTable(ownedSSR)}

### SR (${ownedSR.length} unidades)
${formatTable(ownedSR)}

### R (${ownedR.length} unidades)
${formatTable(ownedR)}

## ❌ Personagens que Faltam

### SSR Faltantes (${unownedSSR.length} unidades)
${formatTable(unownedSSR)}

### SR Faltantes (${unownedSR.length} unidades)
${formatTable(unownedSR)}

### R Faltantes (${unownedR.length} ${unownedR.length === 1 ? 'unidade' : 'unidades'})
${formatTable(unownedR)}
`;

fs.writeFileSync(targetMdPath, mdContent, 'utf8');
console.log(`Successfully generated Obsidian file at ${targetMdPath}`);
