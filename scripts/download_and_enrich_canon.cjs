const fs = require('fs');
const path = require('path');

const CANON_FILE = path.join(__dirname, '../src/data/canonical_characters.json');
const OUTPUT_DIR = path.join(__dirname, '../public/assets/canonical');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Mapeamento canônico estrito de Técnica e Estilo de Combate
const ENRICHMENT_MAP = {
  yuji_itadori: { type: 'Técnica Inata', style: 'Corpo a Corpo / Punhos', gameImage: 'GreenItadoriSSRArt2.gif' },
  megumi_fushiguro: { type: 'Técnica Herdada', style: 'Shikigami / Sombras', gameImage: 'GreenMegumiSSRArt1.gif' },
  nobara_kugisaki: { type: 'Técnica Inata', style: 'Disparo / Longo Alcance', gameImage: 'RedNobaraSSRArt1.gif' },
  yuta_okkotsu: { type: 'Técnica Inata', style: 'Espada / Katana', gameImage: 'YellowSSRYutaArt1.gif' },
  maki_zenin: { type: 'Restrição Celestial', style: 'Ferramenta Amaldiçoada', gameImage: 'RedSSRMakiArt1.gif' },
  toge_inumaki: { type: 'Técnica Herdada', style: 'Feitiçaria Pura', gameImage: 'RedTogeRArt1.gif' },
  panda: { type: 'Técnica Inata', style: 'Corpo a Corpo / Punhos', gameImage: 'GreenPandaSSRArt1.gif' },
  kinji_hakari: { type: 'Técnica Inata', style: 'Corpo a Corpo / Punhos', wikiPage: 'Kinji_Hakari' },
  kirara_hoshi: { type: 'Técnica Inata', style: 'Feitiçaria Pura', wikiPage: 'Kirara_Hoshi' },
  satoru_gojo: { type: 'Técnica Herdada', style: 'Feitiçaria Pura', gameImage: 'BlueSSRGojoArt2.gif' },
  kento_nanami: { type: 'Técnica Inata', style: 'Ferramenta Amaldiçoada', gameImage: 'RedNanamiSRArt1.gif' },
  atsuya_kusakabe: { type: 'Sem Técnica Inata', style: 'Espada / Katana', gameImage: 'YellowSSRKusakabeArt1.gif' },
  masamichi_yaga: { type: 'Técnica Inata', style: 'Shikigami / Sombras', gameImage: 'RedYagaSRArt1.gif' },
  shoko_ieiri: { type: 'Técnica Inata', style: 'Suporte / Reversa', gameImage: 'GreenSSRShokoArt1.gif' },
  kiyotaka_ijichi: { type: 'Sem Técnica Inata', style: 'Suporte / Barreiras', gameImage: 'GreenIjichiRArt1.gif' },
  akari_nitta: { type: 'Sem Técnica Inata', style: 'Suporte / Barreiras', wikiPage: 'Akari_Nitta' },
  arata_nitta: { type: 'Sem Técnica Inata', style: 'Suporte / Reversa', wikiPage: 'Arata_Nitta' },
  yu_haibara: { type: 'Técnica Inata', style: 'Corpo a Corpo / Punhos', gameImage: 'RedSSRHaibaraArt1.gif' },
  aoi_todo: { type: 'Técnica Inata', style: 'Corpo a Corpo / Punhos', gameImage: 'GreenSSRTodoArt1.gif' },
  noritoshi_kamo: { type: 'Técnica Herdada', style: 'Disparo / Longo Alcance', gameImage: 'BlueNoritoshiSSRArt1.gif' },
  mai_zenin: { type: 'Técnica Inata', style: 'Disparo / Longo Alcance', gameImage: 'YellowMaiSRArt1.gif' },
  kasumi_miwa: { type: 'Sem Técnica Inata', style: 'Espada / Katana', gameImage: 'RedMiwaSRArt1.gif' },
  kokichi_muta: { type: 'Restrição Celestial', style: 'Disparo / Longo Alcance', gameImage: 'GreenSSRMutaArt1.gif' },
  momo_nishimiya: { type: 'Técnica Inata', style: 'Disparo / Longo Alcance', gameImage: 'GreenMomoSRArt1.gif' },
  utahime_iori: { type: 'Técnica Inata', style: 'Suporte / Ritual', wikiPage: 'Utahime_Iori' },
  yoshinobu_gakuganji: { type: 'Técnica Inata', style: 'Disparo / Longo Alcance', gameImage: 'RedSSRGakuganjiArt1.gif' },
  toji_fushiguro: { type: 'Restrição Celestial', style: 'Ferramenta Amaldiçoada', gameImage: 'YellowSSRTojiArt1.gif' },
  naobito_zenin: { type: 'Técnica Herdada', style: 'Corpo a Corpo / Punhos', gameImage: 'BlueSSRNaobitoArt1.gif' },
  naoya_zenin: { type: 'Técnica Herdada', style: 'Velocidade / Adagas', wikiPage: 'Naoya_Zenin' },
  ogi_zenin: { type: 'Técnica Inata', style: 'Espada / Katana', wikiPage: 'Ogi_Zenin' },
  jinichi_zenin: { type: 'Técnica Inata', style: 'Corpo a Corpo / Punhos', wikiPage: 'Jinichi_Zenin' },
  chojuro_zenin: { type: 'Técnica Inata', style: 'Feitiçaria Pura', wikiPage: 'Chojuro_Zenin' },
  ranta_zenin: { type: 'Técnica Inata', style: 'Suporte / Barreira', wikiPage: 'Ranta_Zenin' },
  nobuaki_zenin: { type: 'Sem Técnica Inata', style: 'Corpo a Corpo / Punhos', wikiPage: 'Nobuaki_Zenin' },
  mei_mei: { type: 'Técnica Inata', style: 'Ferramenta Amaldiçoada', gameImage: 'RedSSRMeiMeiArt1.gif' },
  ui_ui: { type: 'Técnica Inata', style: 'Suporte / Teletransporte', wikiPage: 'Ui_Ui' },
  yuki_tsukumo: { type: 'Técnica Inata', style: 'Corpo a Corpo / Punhos', wikiPage: 'Yuki_Tsukumo' },
  takuma_ino: { type: 'Técnica Inata', style: 'Corpo a Corpo / Punhos', gameImage: 'GreenInoSSRArt1.gif' },
  master_tengen: { type: 'Técnica Inata', style: 'Suporte / Barreiras', wikiPage: 'Tengen' },
  ryomen_sukuna: { type: 'Técnica Inata', style: 'Feitiçaria Pura', gameImage: 'YellowSSRSukunaArt1.gif' },
  mahito: { type: 'Técnica Inata', style: 'Feitiçaria Pura', gameImage: 'GreenMahitoSSRArt1.gif' },
  jogo: { type: 'Técnica Inata', style: 'Feitiçaria Pura', gameImage: 'RedSSRJogoArt1.gif' },
  hanami: { type: 'Técnica Inata', style: 'Feitiçaria Pura', gameImage: 'RedHanamiSSRArt1.gif' },
  dagon: { type: 'Técnica Inata', style: 'Shikigami / Sombras', gameImage: 'YellowSSRDagonArt1.gif' },
  choso: { type: 'Técnica Herdada', style: 'Disparo / Longo Alcance', gameImage: 'GreenSSRChosoArt1.gif' },
  eso: { type: 'Técnica Herdada', style: 'Disparo / Longo Alcance', wikiPage: 'Eso' },
  kechizu: { type: 'Técnica Herdada', style: 'Corpo a Corpo / Punhos', wikiPage: 'Kechizu' },
  kurourushi: { type: 'Técnica Inata', style: 'Ferramenta Amaldiçoada', wikiPage: 'Kurourushi' },
  smallpox_deity: { type: 'Técnica Inata', style: 'Feitiçaria Pura', wikiPage: 'Smallpox_Deity' },
  ko_guy: { type: 'Técnica Inata', style: 'Corpo a Corpo / Punhos', wikiPage: 'Ko-Guy' },
  rika: { type: 'Técnica Inata', style: 'Corpo a Corpo / Punhos', wikiPage: 'Rika_Orimoto' },
  kenjaku: { type: 'Técnica Inata', style: 'Feitiçaria Pura', wikiPage: 'Kenjaku' },
  suguru_geto: { type: 'Técnica Inata', style: 'Shikigami / Sombras', gameImage: 'BlueGetoSSRArt1.gif' },
  uraume: { type: 'Técnica Inata', style: 'Disparo / Longo Alcance', gameImage: 'YellowSSRUraumeArt1.gif' },
  miguel_oduol: { type: 'Técnica Inata', style: 'Ferramenta Amaldiçoada', gameImage: 'BlueSSRMiguelArt1.gif' },
  larue: { type: 'Técnica Inata', style: 'Corpo a Corpo / Punhos', wikiPage: 'Larue' },
  mimiko_hasaba: { type: 'Técnica Inata', style: 'Feitiçaria Pura', wikiPage: 'Mimiko_Hasaba' },
  nanako_hasaba: { type: 'Técnica Inata', style: 'Feitiçaria Pura', wikiPage: 'Nanako_Hasaba' },
  manami_suda: { type: 'Sem Técnica Inata', style: 'Suporte / Barreiras', wikiPage: 'Manami_Suda' },
  toshihisa_negi: { type: 'Técnica Inata', style: 'Shikigami / Sombras', wikiPage: 'Toshihisa_Negi' },
  juzo_kumiya: { type: 'Técnica Inata', style: 'Ferramenta Amaldiçoada', wikiPage: 'Juzo_Kumiya' },
  haruta_shigemo: { type: 'Técnica Inata', style: 'Ferramenta Amaldiçoada', wikiPage: 'Haruta_Shigemo' },
  jiro_awasaka: { type: 'Técnica Inata', style: 'Corpo a Corpo / Punhos', wikiPage: 'Jiro_Awasaka' },
  granny_ogami: { type: 'Técnica Inata', style: 'Suporte / Reversa', wikiPage: 'Ogami' },
  ogamis_grandson: { type: 'Sem Técnica Inata', style: 'Corpo a Corpo / Punhos', wikiPage: 'Ogami%27s_grandson' },
  hiromi_higuruma: { type: 'Técnica Inata', style: 'Ferramenta Amaldiçoada', wikiPage: 'Hiromi_Higuruma' },
  hajime_kashimo: { type: 'Técnica Inata', style: 'Corpo a Corpo / Punhos', wikiPage: 'Hajime_Kashimo' },
  ryu_ishigori: { type: 'Técnica Inata', style: 'Disparo / Longo Alcance', wikiPage: 'Ryu_Ishigori' },
  takako_uro: { type: 'Técnica Inata', style: 'Feitiçaria Pura', wikiPage: 'Takako_Uro' },
  dhruv_lakdawalla: { type: 'Técnica Inata', style: 'Shikigami / Sombras', wikiPage: 'Dhruv_Lakdawalla' },
  reggie_star: { type: 'Técnica Inata', style: 'Feitiçaria Pura', wikiPage: 'Reggie_Star' },
  fumihiko_takaba: { type: 'Técnica Inata', style: 'Feitiçaria Pura', wikiPage: 'Fumihiko_Takaba' },
  iori_hazenoki: { type: 'Técnica Inata', style: 'Disparo / Longo Alcance', wikiPage: 'Iori_Hazenoki' },
  chizuru_hari: { type: 'Técnica Inata', style: 'Corpo a Corpo / Punhos', wikiPage: 'Chizuru_Hari' },
  remi: { type: 'Técnica Inata', style: 'Corpo a Corpo / Punhos', wikiPage: 'Remi' },
  charles_bernard: { type: 'Técnica Inata', style: 'Ferramenta Amaldiçoada', wikiPage: 'Charles_Bernard' },
  hana_kurusu: { type: 'Técnica Inata', style: 'Feitiçaria Pura', wikiPage: 'Hana_Kurusu' },
  rin_amai: { type: 'Técnica Inata', style: 'Suporte / Barreiras', wikiPage: 'Rin_Amai' },
  haba: { type: 'Técnica Inata', style: 'Corpo a Corpo / Punhos', wikiPage: 'Haba' },
  hanyu: { type: 'Técnica Inata', style: 'Disparo / Longo Alcance', wikiPage: 'Hanyu' },
  kaori_itadori: { type: 'Técnica Inata', style: 'Feitiçaria Pura', wikiPage: 'Kaori_Itadori' },
  junpei_yoshino: { type: 'Técnica Inata', style: 'Shikigami / Sombras', gameImage: 'BlueJunpeiSRArt1.gif' },
  noritoshi_kamo_ancestor: { type: 'Técnica Herdada', style: 'Feitiçaria Pura', wikiPage: 'Noritoshi_Kamo_(Ancestor)' },
  shiu_kong: { type: 'Sem Técnica Inata', style: 'Suporte / Barreiras', wikiPage: 'Shiu_Kong' },
  naoya_zenin_curse: { type: 'Técnica Inata', style: 'Velocidade / Adagas', wikiPage: 'Naoya_Zenin' },
  yorozu: { type: 'Técnica Inata', style: 'Feitiçaria Pura', wikiPage: 'Yorozu' },
  hagane_daido: { type: 'Sem Técnica Inata', style: 'Espada / Katana', wikiPage: 'Hagane_Daido' },
  rokujushi_miyo: { type: 'Sem Técnica Inata', style: 'Corpo a Corpo / Punhos', wikiPage: 'Rokujushi_Miyo' },
};

async function downloadWikiImage(title, targetFilePath) {
  try {
    const cleanTitle = title.replace(/ /g, '_');
    const url = `https://jujutsu-kaisen.fandom.com/api.php?action=query&titles=${cleanTitle}&prop=pageimages&format=json&pithumbsize=280`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });
    if (!res.ok) return false;
    const json = await res.json();
    const pages = json.query?.pages;
    if (!pages) return false;
    const firstPage = Object.values(pages)[0];
    const thumbUrl = firstPage?.thumbnail?.source;
    if (!thumbUrl) return false;

    const imgRes = await fetch(thumbUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://jujutsu-kaisen.fandom.com/'
      }
    });
    if (!imgRes.ok) return false;
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    fs.writeFileSync(targetFilePath, buffer);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log('⚡ Enriquecendo personagens canônicos com imagens e características de combate...\n');
  const data = JSON.parse(fs.readFileSync(CANON_FILE, 'utf-8'));

  let downloadedCount = 0;
  let gameImageCount = 0;

  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    const enrich = ENRICHMENT_MAP[char.id] || {};

    // 1. Atribui nova característica
    char.techniqueType = enrich.type || 'Técnica Inata';
    char.combatStyle = enrich.style || 'Feitiçaria Pura';

    // 2. Imagens
    if (enrich.gameImage) {
      char.gameImage = enrich.gameImage;
      gameImageCount++;
      continue;
    }

    const localFileName = `${char.id}.png`;
    const localFilePath = path.join(OUTPUT_DIR, localFileName);

    if (fs.existsSync(localFilePath) && fs.statSync(localFilePath).size > 1000) {
      char.image = `canonical/${localFileName}`;
      continue;
    }

    const wikiTitle = enrich.wikiPage || char.name.replace(/ /g, '_');
    process.stdout.write(`Baixando retrato de ${char.name} (${wikiTitle})... `);
    const success = await downloadWikiImage(wikiTitle, localFilePath);

    if (success) {
      char.image = `canonical/${localFileName}`;
      downloadedCount++;
      console.log('✅ OK');
    } else {
      console.log('⚠️ Não encontrada na Wiki');
    }
    // Breve pausa para respeitar a API
    await new Promise(r => setTimeout(r, 200));
  }

  fs.writeFileSync(CANON_FILE, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`\n🎉 Concluído!`);
  console.log(`- Personagens com gameImage: ${gameImageCount}`);
  console.log(`- Imagens baixadas da Wiki: ${downloadedCount}`);
}

main().catch(console.error);
