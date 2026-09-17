const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const localChars = JSON.parse(fs.readFileSync(path.join(rootDir, 'src', 'data', 'characters.json'), 'utf8'));

// Helper for finding matching local character
function findLocalChar(title, slug, element, rarity) {
  if (!title && !slug) return null;
  const normTitle = (title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const normSlug = (slug || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  // 1. Exact or normalized title match
  let match = localChars.find(c => {
    const cTitle = c.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cId = c.id.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cTitle === normTitle || cId === normSlug || cTitle === normSlug || cId === normTitle;
  });
  if (match) return match;

  // 2. Match by Character Name + Element + Rarity
  for (const c of localChars) {
    const nameMatch = (title || '').toLowerCase().includes(c.name.toLowerCase()) ||
                      (slug || '').toLowerCase().includes(c.name.toLowerCase().replace(/[^a-z]/g, ''));
    if (nameMatch) {
      if (element && c.element.toLowerCase() !== element.toLowerCase()) continue;
      if (rarity && c.rarity.toLowerCase() !== rarity.toLowerCase()) continue;
      return c;
    }
  }

  // 3. Match by Person's name + element
  for (const c of localChars) {
    const nameMatch = (title || '').toLowerCase().includes(c.name.toLowerCase());
    if (nameMatch) {
      if (element && c.element.toLowerCase() === element.toLowerCase()) {
        return c;
      }
    }
  }

  // 4. Fallback: match by Person's name
  for (const c of localChars) {
    if ((title || '').toLowerCase().includes(c.name.toLowerCase())) {
      return c;
    }
  }

  return null;
}

// 1. PROCESS TIERLISTS
console.log('1. Processing tierlists...');
const tierContent = fs.readFileSync(path.join(rootDir, 'temp_tierlists.txt'), 'utf8');
const tLine0 = tierContent.split('\n').find(l => l.startsWith('0:'));
const tData = JSON.parse(tLine0.substring(2));

function findTierlists(obj) {
  if (!obj || typeof obj !== 'object') return null;
  if (obj.blue && obj.red && obj.damage && obj.support) return obj;
  for (const k of Object.keys(obj)) {
    const res = findTierlists(obj[k]);
    if (res) return res;
  }
  return null;
}

const rawTierlists = findTierlists(tData);
const categoryMetadata = {
  damage: { title: 'Top Dano (DPS)', description: 'Ranking geral dos maiores causadores de dano da meta atual.' },
  support: { title: 'Top Suporte & Buffers', description: 'Ranking dos melhores suportes, amplificadores de ataque e curandeiros.' },
  sp: { title: 'Grau Especial (SP)', description: 'Personagens com Expansão de Domínio ou mecânicas especiais de combate.' },
  blue: { title: 'Elemento Noite (Azul)', description: 'Tier list especializada para feiticeiros do atributo Noite (Blue / Sombra).' },
  red: { title: 'Elemento Chamas (Vermelho)', description: 'Tier list especializada para feiticeiros do atributo Chamas (Red / Flare).' },
  green: { title: 'Elemento Fantasma (Verde)', description: 'Tier list especializada para feiticeiros do atributo Fantasma (Green / Phantom).' },
  yellow: { title: 'Elemento Decaimento (Amarelo)', description: 'Tier list especializada para feiticeiros do atributo Decaimento (Yellow / Decay).' }
};

const processedTierlists = [];
const categoryKeys = ['damage', 'support', 'sp', 'blue', 'red', 'green', 'yellow'];

for (const key of categoryKeys) {
  const rawCat = rawTierlists[key];
  if (!rawCat) continue;
  const meta = categoryMetadata[key] || { title: key, description: '' };
  
  const tiers = (rawCat.tiers || []).map(r => {
    const slots = (r.slots || []).map(s => {
      const local = findLocalChar(s.title, s.slug, key.match(/blue|red|green|yellow/) ? key : null, null);
      return {
        characterId: local ? local.id : s.slug,
        title: local ? local.title : s.title,
        name: local ? local.name : s.name,
        slug: s.slug,
        element: local ? local.element : (key.match(/blue|red|green|yellow/) ? key.charAt(0).toUpperCase() + key.slice(1) : 'Unknown'),
        rarity: local ? local.rarity : 'SSR',
        image: local ? local.image : 'default.webp',
        hasDupeScaling: Boolean(s.hasDupeScaling)
      };
    });
    return {
      rank: r.rank,
      slots
    };
  });

  processedTierlists.push({
    id: key,
    title: meta.title,
    description: meta.description,
    tiers
  });
}

fs.writeFileSync(
  path.join(rootDir, 'src', 'data', 'tierlists.json'),
  JSON.stringify(processedTierlists, null, 2),
  'utf8'
);
console.log(`Saved src/data/tierlists.json with ${processedTierlists.length} categories.`);

// 2. PROCESS BEST TEAMS
console.log('\n2. Processing best teams...');
const teamsContent = fs.readFileSync(path.join(rootDir, 'temp_teams.txt'), 'utf8');
const tmLine0 = teamsContent.split('\n').find(l => l.startsWith('0:'));
const tmData = JSON.parse(tmLine0.substring(2));

function findTeams(obj) {
  if (!obj || typeof obj !== 'object') return null;
  if (obj.Blue && obj.Red && obj.Green && obj.Yellow) return obj;
  for (const k of Object.keys(obj)) {
    const res = findTeams(obj[k]);
    if (res) return res;
  }
  return null;
}

const rawTeamsObj = findTeams(tmData);
const processedTeams = [];

for (const el of ['Blue', 'Red', 'Green', 'Yellow']) {
  const elData = rawTeamsObj[el];
  if (!elData || !elData.teams) continue;

  for (const t of elData.teams) {
    const slots = (t.slots || []).map(s => {
      const mainLocal = findLocalChar(s.main?.title, s.main?.slug, el, null);
      const substitutes = (s.substitutes || []).map(sub => {
        const subLocal = findLocalChar(sub?.title, sub?.slug, el, null);
        return {
          characterId: subLocal ? subLocal.id : sub.slug,
          title: subLocal ? subLocal.title : sub.title,
          name: subLocal ? subLocal.name : sub.name,
          element: subLocal ? subLocal.element : el,
          rarity: subLocal ? subLocal.rarity : 'SSR',
          image: subLocal ? subLocal.image : 'default.webp'
        };
      });

      return {
        role: s.role || 'Sorcerer',
        main: {
          characterId: mainLocal ? mainLocal.id : s.main?.slug,
          title: mainLocal ? mainLocal.title : s.main?.title,
          name: mainLocal ? mainLocal.name : s.main?.name,
          element: mainLocal ? mainLocal.element : el,
          rarity: mainLocal ? mainLocal.rarity : 'SSR',
          image: mainLocal ? mainLocal.image : 'default.webp'
        },
        substitutes
      };
    });

    processedTeams.push({
      id: t.id,
      element: el,
      label: t.label, // "Taijutsu" | "Jujutsu"
      best: Boolean(t.best),
      summary: t.summary || '',
      char_notes: t.char_notes || [],
      slots
    });
  }
}

fs.writeFileSync(
  path.join(rootDir, 'src', 'data', 'meta_teams.json'),
  JSON.stringify(processedTeams, null, 2),
  'utf8'
);
console.log(`Saved src/data/meta_teams.json with ${processedTeams.length} meta teams.`);

// 3. PROCESS BUFFS
console.log('\n3. Processing buffs...');
const buffsContent = fs.readFileSync(path.join(rootDir, 'temp_buffs.txt'), 'utf8');
const bLine0 = buffsContent.split('\n').find(l => l.startsWith('0:'));
const bData = JSON.parse(bLine0.substring(2));

function findBuffs(obj) {
  if (!obj || typeof obj !== 'object') return null;
  if (obj.buff && obj.debuff && obj.dmgUp) return obj;
  for (const k of Object.keys(obj)) {
    const res = findBuffs(obj[k]);
    if (res) return res;
  }
  return null;
}

const rawBuffsObj = findBuffs(bData);

function mapBuffItem(item, cat) {
  const local = findLocalChar(item.title, item.slug, item.element, item.rarity);
  return {
    id: `${cat}_${item.slug}_${(item.statType || 'all').toLowerCase()}`,
    characterId: local ? local.id : item.slug,
    slug: item.slug,
    title: local ? local.title : item.title,
    name: local ? local.name : (item.title || item.slug),
    element: local ? local.element : (item.element || 'Unknown'),
    rarity: local ? local.rarity : (item.rarity || 'SSR'),
    image: local ? local.image : 'default.webp',
    buff: item.buff || '',
    target: item.target || 'ST',
    maxStack: item.maxStack || '',
    statType: item.statType || (cat === 'dmgUp' ? 'Damage' : 'Both'),
    notes: item.notes || '',
    category: cat
  };
}

const processedBuffs = {
  buff: (rawBuffsObj.buff || []).map(i => mapBuffItem(i, 'buff')),
  debuff: (rawBuffsObj.debuff || []).map(i => mapBuffItem(i, 'debuff')),
  dmgUp: (rawBuffsObj.dmgUp || []).map(i => mapBuffItem(i, 'dmgUp'))
};

fs.writeFileSync(
  path.join(rootDir, 'src', 'data', 'buffs.json'),
  JSON.stringify(processedBuffs, null, 2),
  'utf8'
);
console.log(`Saved src/data/buffs.json with ${processedBuffs.buff.length} buffs, ${processedBuffs.debuff.length} debuffs, and ${processedBuffs.dmgUp.length} damage up entries.`);
