const fs = require('fs');
const path = require('path');

function canonicalAffiliation(str) {
  if (!str) return 'Jujutsu High';
  let clean = str.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Year X School Jujutsu High -> School Jujutsu High Year X
  const m1 = clean.match(/^Year\s*(\d)\s+([A-Za-z]+)\s+Jujutsu\s+High$/i);
  if (m1) {
    const school = m1[2].charAt(0).toUpperCase() + m1[2].slice(1).toLowerCase();
    return `${school} Jujutsu High Year ${m1[1]}`;
  }
  
  // School Jujutsu High Year X (garantir casing padronizado)
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

// 1. Atualizar characters.json
const charsPath = path.resolve(__dirname, '../src/data/characters.json');
const chars = JSON.parse(fs.readFileSync(charsPath, 'utf8'));

let updatedCharsCount = 0;
chars.forEach(c => {
  const norm = canonicalAffiliation(c.affiliation);
  if (norm !== c.affiliation) {
    console.log(`[characters.json] ${c.name} (${c.title}): "${c.affiliation}" -> "${norm}"`);
    c.affiliation = norm;
    updatedCharsCount++;
  }
});

fs.writeFileSync(charsPath, JSON.stringify(chars, null, 2) + '\n', 'utf8');
console.log(`\nUpdated ${updatedCharsCount} characters in characters.json.`);

// 2. Atualizar arquivos markdown do cofre Obsidian se existirem
const vaultDir = 'c:\\Users\\lucas\\OneDrive\\Área de Trabalho\\JJK_Scraper\\JJK_Database\\Personagens';
if (fs.existsSync(vaultDir)) {
  const files = fs.readdirSync(vaultDir).filter(f => f.endsWith('.md'));
  let vaultUpdates = 0;
  files.forEach(f => {
    const fullPath = path.join(vaultDir, f);
    let md = fs.readFileSync(fullPath, 'utf8');
    const match = md.match(/affiliation:\s*["']([^"']+)["']/);
    if (match) {
      const orig = match[1];
      const norm = canonicalAffiliation(orig);
      if (norm !== orig) {
        md = md.replace(/affiliation:\s*["'][^"']+["']/, `affiliation: "${norm}"`);
        fs.writeFileSync(fullPath, md, 'utf8');
        console.log(`[Vault] ${f}: "${orig}" -> "${norm}"`);
        vaultUpdates++;
      }
    }
  });
  console.log(`\nUpdated ${vaultUpdates} markdown files in Obsidian vault.`);
}
