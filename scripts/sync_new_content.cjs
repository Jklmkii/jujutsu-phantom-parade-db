const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const API_URL = 'https://jjk-phantom-parade.fandom.com/api.php';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Referer': 'https://jjk-phantom-parade.fandom.com/'
};

const rootDir = path.resolve(__dirname, '..');
const charsPath = path.join(rootDir, 'src', 'data', 'characters.json');
const memoriesPath = path.join(rootDir, 'src', 'data', 'memories.json');
const assetsDir = path.join(rootDir, 'public', 'assets');

async function fetchJSON(url) {
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.error(`Erro ao consultar URL (${url}):`, err.message);
    return null;
  }
}

async function downloadFile(url, destPath) {
  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 1024) {
    return true;
  }
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return false;
    const arrayBuffer = await res.arrayBuffer();
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
    return true;
  } catch {
    return false;
  }
}

async function getImageUrl(fileTitle) {
  if (!fileTitle.startsWith('File:')) fileTitle = 'File:' + fileTitle;
  const url = `${API_URL}?action=query&titles=${encodeURIComponent(fileTitle)}&prop=imageinfo&iiprop=url&format=json`;
  const data = await fetchJSON(url);
  const pages = data?.query?.pages || {};
  for (const k of Object.keys(pages)) {
    const info = pages[k]?.imageinfo;
    if (info && info[0]?.url) {
      return info[0].url.split('/revision/')[0] + '/revision/latest';
    }
  }
  return null;
}

function cleanWikitext(text) {
  if (!text) return '';
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\{\{[Cc]olor\|[^|]+\|([^}]+)\}\}/g, '$1')
    .replace(/\{\{[^}]+\}\}/g, '')
    .replace(/\[\[(?:[^|\]]+\|)?([^\]]+)\]\]/g, '$1')
    .trim();
}

function parseTemplateAttributes(wikitext) {
  const attrs = {};
  const lines = wikitext.split('\n');
  let currentKey = null;

  for (const line of lines) {
    const match = line.match(/^\s*\|\s*([^=]+?)\s*=\s*(.*)$/);
    if (match) {
      currentKey = match[1].trim();
      attrs[currentKey] = match[2].trim();
    } else if (currentKey && line.startsWith('<!--')) {
      continue;
    } else if (currentKey && !line.startsWith('|') && !line.startsWith('}}')) {
      attrs[currentKey] += '\n' + line.trim();
    }
  }
  return attrs;
}

function canonicalKey(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    // Normalizar aspas curvas e retas (simples e duplas)
    .replace(/[\u2018\u2019\u201A\u201B\u2032']/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u2033"]/g, '"')
    // Substituir erro de digitação clássico da wiki: Ze'nin ou Ze’nin -> Zen'in
    .replace(/\bze['"’]nin\b/g, "zen'in")
    .replace(/\bze\s*['"’]?\s*nin\b/g, "zen'in")
    // Remover todas as aspas (simples e duplas) para matching de títulos
    .replace(/['"]/g, '')
    // Remover pontuação e caracteres não alfanuméricos
    .replace(/[^a-z0-9\s]/g, '')
    // Compactar múltiplos espaços
    .replace(/\s+/g, ' ')
    .trim();
}

async function syncCharacters(existingChars) {
  console.log('\n[1/2] Verificando novos personagens no Phantom Parade Wiki...');
  const templates = [
    'Template:Character Page',
    'Template:Character Page (Adjustment)',
    'Template:Character Page (Second Adjustment)',
    'Template:Character Page (SP Awaken Character)'
  ];

  const remoteTitles = new Set();
  for (const t of templates) {
    const url = `${API_URL}?action=query&list=embeddedin&eititle=${encodeURIComponent(t)}&einamespace=0&eilimit=max&format=json`;
    const data = await fetchJSON(url);
    const list = data?.query?.embeddedin || [];
    for (const item of list) {
      remoteTitles.add(item.title);
    }
  }

  const existingKeys = new Set(existingChars.map(c => canonicalKey(c.title)));
  const newTitles = [...remoteTitles].filter(t => !existingKeys.has(canonicalKey(t)));

  console.log(`Total no wiki: ${remoteTitles.size} | Total local: ${existingChars.length}`);
  if (newTitles.length === 0) {
    console.log('✓ Personagens 100% atualizados. Nenhum novo personagem detectado.');
    return { added: 0, chars: existingChars };
  }

  console.log(`⚡ ${newTitles.length} novo(s) personagem(ns) detectado(s)! Extraindo fichas...`);
  const updatedList = [...existingChars];

  for (const title of newTitles) {
    console.log(`  -> Extraindo: "${title}"`);
    const parseUrl = `${API_URL}?action=parse&page=${encodeURIComponent(title)}&prop=wikitext|images&format=json`;
    const parseData = await fetchJSON(parseUrl);
    const wikitext = parseData?.parse?.wikitext?.['*'] || '';
    const pageImages = parseData?.parse?.images || [];

    if (!wikitext) continue;
    const attrs = parseTemplateAttributes(wikitext);

    const name = attrs['Name'] || title.replace(/\([^)]+\)\s*/g, '').trim();
    const epithet = attrs['Card Epithet'] || (title.match(/\(([^)]+)\)/)?.[1] || '');
    const rarity = attrs['Rarity'] || 'SSR';
    const element = attrs['Element'] || attrs['Attribute'] || 'Green';
    const role = attrs['Type'] || attrs['Role'] || 'Attacker';
    const focus = attrs['Damage Type'] || attrs['Focus'] || 'Taijutsu';
    const releaseDate = attrs['Release Date'] || attrs['JP Date'] || new Date().toISOString().split('T')[0];
    const limited = (attrs['Limited'] || '').toLowerCase().includes('yes') || (attrs['Obtain'] || '').toLowerCase().includes('limited');

    const cardArtName = attrs['Card Art'] || pageImages.find(img => img.toLowerCase().includes('art') || img.toLowerCase().includes('ssr')) || '';
    let localImageName = cardArtName;

    if (cardArtName) {
      const imgUrl = await getImageUrl(cardArtName);
      if (imgUrl) {
        const dest = path.join(assetsDir, cardArtName);
        console.log(`     Baixando ilustracao: ${cardArtName}...`);
        await downloadFile(imgUrl, dest);
      }
    }

    const newChar = {
      id: title.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase(),
      title,
      name,
      epithet: epithet ? `'${epithet}'` : '',
      card_name: name,
      rarity,
      element,
      role,
      focus,
      affiliation: attrs['Affiliation'] || 'Jujutsu High',
      release_date: releaseDate.replace(/\//g, '-'),
      limited,
      stats: {
        hp: attrs['HP'] || '25000',
        attack: attrs['Taijutsu'] || '6000',
        jujutsu: attrs['Jujutsu'] || '10000',
        initial_energy: attrs['Initial Energy'] || '30',
        max_energy: attrs['Max Energy'] || '100',
        special_gauge: attrs['Special Gauge'] || '1500'
      },
      image: localImageName || 'default_character.gif',
      normal_attack: {
        name: cleanWikitext(attrs['Normal Attack Name'] || 'Normal Attack'),
        description: cleanWikitext(attrs['Normal Attack Effect 1'] || attrs['Normal Attack Effect'] || ''),
        description_10: cleanWikitext(attrs['Normal Attack Effect 10'] || attrs['Normal Attack Effect'] || '')
      },
      skills: [
        {
          slot: 1,
          name: cleanWikitext(attrs['Skill 1 Name'] || 'Skill 1'),
          cost: attrs['Skill 1 Cost'] || '20',
          description: cleanWikitext(attrs['Skill 1 Effect 1'] || attrs['Skill 1 Effect'] || ''),
          description_10: cleanWikitext(attrs['Skill 1 Effect 10'] || attrs['Skill 1 Effect'] || '')
        },
        {
          slot: 2,
          name: cleanWikitext(attrs['Skill 2 Name'] || 'Skill 2'),
          cost: attrs['Skill 2 Cost'] || '25',
          description: cleanWikitext(attrs['Skill 2 Effect 1'] || attrs['Skill 2 Effect'] || ''),
          description_10: cleanWikitext(attrs['Skill 2 Effect 10'] || attrs['Skill 2 Effect'] || '')
        },
        {
          slot: 3,
          name: cleanWikitext(attrs['Skill 3 Name'] || 'Skill 3'),
          cost: attrs['Skill 3 Cost'] || '30',
          description: cleanWikitext(attrs['Skill 3 Effect 1'] || attrs['Skill 3 Effect'] || ''),
          description_10: cleanWikitext(attrs['Skill 3 Effect 10'] || attrs['Skill 3 Effect'] || '')
        }
      ],
      ultimate: {
        name: cleanWikitext(attrs['Ult Name'] || 'Ultimate Skill'),
        description: cleanWikitext(attrs['Ult Effect 1'] || attrs['Ult Effect'] || ''),
        description_10: cleanWikitext(attrs['Ult Effect 10'] || attrs['Ult Effect'] || '')
      }
    };

    updatedList.unshift(newChar);
  }

  return { added: newTitles.length, chars: updatedList };
}

async function syncMemories(existingMemories) {
  console.log('\n[2/2] Verificando novas cartas de memoria (Recollection Bits)...');
  const url = `${API_URL}?action=query&list=embeddedin&eititle=Template:Memory_Page&einamespace=0&eilimit=max&format=json`;
  const data = await fetchJSON(url);
  const list = data?.query?.embeddedin || [];

  const remoteTitles = new Set(list.map(m => m.title));
  const existingKeys = new Set(existingMemories.map(m => canonicalKey(m.title)));
  const newTitles = [...remoteTitles].filter(t => !existingKeys.has(canonicalKey(t)));

  console.log(`Total no wiki: ${remoteTitles.size} | Total local: ${existingMemories.length}`);
  if (newTitles.length === 0) {
    console.log('✓ Memórias 100% atualizadas. Nenhuma nova carta detectada.');
    return { added: 0, memories: existingMemories };
  }

  console.log(`⚡ ${newTitles.length} nova(s) carta(s) detectada(s)! Extraindo...`);
  const updatedList = [...existingMemories];

  for (const title of newTitles) {
    console.log(`  -> Extraindo Memória: "${title}"`);
    const parseUrl = `${API_URL}?action=parse&page=${encodeURIComponent(title)}&prop=wikitext|images&format=json`;
    const parseData = await fetchJSON(parseUrl);
    const wikitext = parseData?.parse?.wikitext?.['*'] || '';
    const pageImages = parseData?.parse?.images || [];

    if (!wikitext) continue;
    const attrs = parseTemplateAttributes(wikitext);

    const artName = attrs['Art'] || pageImages.find(img => img.toLowerCase().includes('art')) || '';
    if (artName) {
      const imgUrl = await getImageUrl(artName);
      if (imgUrl) {
        const dest = path.join(assetsDir, artName);
        console.log(`     Baixando arte: ${artName}...`);
        await downloadFile(imgUrl, dest);
      }
    }

    const newMemory = {
      id: title.replace(/[^a-zA-Z0-9_]/g, '_'),
      title,
      rarity: attrs['Rarity'] || 'SSR',
      release_date: (attrs['Release Date'] || new Date().toISOString().split('T')[0]).replace(/\//g, '-'),
      stats: {
        hp: attrs['HP'] || '30%',
        taijutsu: attrs['Taijutsu'] || '20%',
        jujutsu: attrs['Jujutsu'] || '20%'
      },
      active_cooldown: attrs['Cooldown'] || '5',
      passive_cooldown: '/',
      image: artName || 'default_memory.gif',
      active_skill: {
        description: cleanWikitext(attrs['Active Skill'] || '')
      },
      passive_skill: {
        description: cleanWikitext(attrs['Passive Skill'] || '')
      }
    };

    updatedList.unshift(newMemory);
  }

  return { added: newTitles.length, memories: updatedList };
}

async function main() {
  console.log('====================================================');
  console.log('  JJKPPDB Offline — Sincronizador Automático de Dados');
  console.log('====================================================');

  const chars = JSON.parse(fs.readFileSync(charsPath, 'utf8'));
  const memories = JSON.parse(fs.readFileSync(memoriesPath, 'utf8'));

  const charResult = await syncCharacters(chars);
  const memoryResult = await syncMemories(memories);

  let changes = false;

  if (charResult.added > 0) {
    fs.writeFileSync(charsPath, JSON.stringify(charResult.chars, null, 2) + '\n', 'utf8');
    console.log(`✓ Salvo ${charsPath} com ${charResult.added} novos personagens!`);
    changes = true;

    // Gerar miniaturas estaticas atualizadas para a Tier List
    console.log('\nRegenerando miniaturas estáticas da Tier List...');
    try {
      execSync('npx electron scripts/generate_static_thumbs.cjs', { cwd: rootDir, stdio: 'inherit' });
    } catch (err) {
      console.warn('Aviso: regeneracao de miniaturas executara na proxima inicializacao.', err.message);
    }
  }

  if (memoryResult.added > 0) {
    fs.writeFileSync(memoriesPath, JSON.stringify(memoryResult.memories, null, 2) + '\n', 'utf8');
    console.log(`✓ Salvo ${memoriesPath} com ${memoryResult.added} novas memórias!`);
    changes = true;
  }

  if (changes) {
    console.log('\n✨ Base de dados atualizada com sucesso!');
  } else {
    console.log('\n✓ Todos os dados já estão rigorosamente atualizados com a wiki oficial.');
  }

  // Exportar indicador para GitHub Actions
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    fs.appendFileSync(outputFile, `has_new_content=${changes}\n`);
    fs.appendFileSync(outputFile, `new_chars=${charResult.added}\n`);
    fs.appendFileSync(outputFile, `new_memories=${memoryResult.added}\n`);
  }
}

main().catch(err => {
  console.error('Erro na sincronizacao:', err);
  process.exit(1);
});
