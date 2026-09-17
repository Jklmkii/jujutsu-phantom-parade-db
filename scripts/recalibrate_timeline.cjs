const fs = require('fs');
const path = require('path');

const timelineJsonPath = path.resolve('src/data/timeline.json');
const scraperTimelinePath = 'C:/Users/lucas/OneDrive/Área de Trabalho/JJK_Scraper/JJK_Database/Timeline/Previsao_Global_Timeline.md';

const parseDate = (s) => {
  const parts = s.split('/');
  return new Date(Date.UTC(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10), 12, 0, 0));
};

const formatDate = (date) => {
  const d = String(date.getUTCDate()).padStart(2, '0');
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const y = date.getUTCFullYear();
  return `${d}/${m}/${y}`;
};

const today = parseDate('17/09/2026');
const jpIjichi = parseDate('30/06/2026');
const LAG_DAYS = Math.round((today.getTime() - jpIjichi.getTime()) / (1000 * 60 * 60 * 24)); // 79 days

console.log(`[Recalibrate] Calibrando com Marco Real: Ijichi lançado em 17/09/2026 12:00.`);
console.log(`[Recalibrate] Lag JP -> Global Calculado: ${LAG_DAYS} dias.`);

// 1. Atualiza src/data/timeline.json
if (fs.existsSync(timelineJsonPath)) {
  const events = JSON.parse(fs.readFileSync(timelineJsonPath, 'utf8'));

  const updatedEvents = events.map(ev => {
    if (ev.index < 160) {
      return {
        ...ev,
        status: 'released',
        status_label: 'Já Lançado no Global'
      };
    } else if (ev.index === 160) {
      return {
        ...ev,
        status: 'current',
        status_label: '🔥 Em Andamento no Global (Lançado Hoje)',
        global_date: '17/09/2026 (12:00)',
        days: 'Hoje às 12:00'
      };
    } else {
      const jpDate = parseDate(ev.jp_date);
      const predictedGlobal = new Date(jpDate.getTime());
      predictedGlobal.setUTCDate(predictedGlobal.getUTCDate() + LAG_DAYS);
      const diffDays = Math.round((predictedGlobal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      return {
        ...ev,
        status: 'upcoming',
        status_label: diffDays <= 7 ? `⏳ Próximo no Global (em ${diffDays} dias)` : 'Próximo no Global',
        global_date: formatDate(predictedGlobal),
        days: `Em ${diffDays} dias`
      };
    }
  });

  fs.writeFileSync(timelineJsonPath, JSON.stringify(updatedEvents, null, 2), 'utf8');
  console.log(`[Recalibrate] ${updatedEvents.length} eventos atualizados com sucesso em ${timelineJsonPath}`);
}

// 2. Atualiza Previsao_Global_Timeline.md se existir
if (fs.existsSync(scraperTimelinePath)) {
  let md = fs.readFileSync(scraperTimelinePath, 'utf8');
  
  // Atualiza metadados do cabeçalho
  md = md.replace(
    /\*\*Diferença Padrão \(Lag\):\*\* ~`\d+ dias`/,
    `**Diferença Padrão (Lag):** \`79 dias\` (Calibrado com precisão: Marco Ijichi lançado em 17/09/2026 às 12:00)`
  );
  md = md.replace(
    /Data da análise: `\d+\/\d+\/\d+`/,
    `Data da calibração: \`17/09/2026\``
  );

  // Linha 178: Ijichi
  md = md.replace(
    /\|\s*✅ Já Lançado\s*\|\s*<br>• Featured Gacha: Ijichi's Unrelenting Vacation<br>• Story Event: Ijichi's Unrelenting Vacation\s*\|\s*30\/06\/2026\s*\|\s*\*\*03\/09\/2026\*\*\s*\|\s*Há \d+ dias\s*\|/,
    `| 🔥 Em Andamento | <br>• Featured Gacha: Ijichi's Unrelenting Vacation<br>• Story Event: Ijichi's Unrelenting Vacation | 30/06/2026 | **17/09/2026 (12:00)** | Hoje às 12:00 |`
  );

  // Mapeamento dos eventos seguintes recalculados
  const replacements = [
    { jp: '07/07/2026', glob: '24/09/2026', days: 'Em 7 dias', status: '⏳ Próximo' },
    { jp: '13/07/2026', glob: '30/09/2026', days: 'Em 13 dias', status: '⏳ Futuro' },
    { jp: '17/07/2026', glob: '04/10/2026', days: 'Em 17 dias', status: '⏳ Futuro' },
    { jp: '21/07/2026', glob: '08/10/2026', days: 'Em 21 dias', status: '⏳ Futuro' },
    { jp: '27/07/2026', glob: '14/10/2026', days: 'Em 27 dias', status: '⏳ Futuro' },
    { jp: '31/07/2026', glob: '18/10/2026', days: 'Em 31 dias', status: '⏳ Futuro' },
    { jp: '01/08/2026', glob: '19/10/2026', days: 'Em 32 dias', status: '⏳ Futuro' },
    { jp: '08/08/2026', glob: '26/10/2026', days: 'Em 39 dias', status: '⏳ Futuro' },
    { jp: '10/08/2026', glob: '28/10/2026', days: 'Em 41 dias', status: '⏳ Futuro' },
    { jp: '15/08/2026', glob: '02/11/2026', days: 'Em 46 dias', status: '⏳ Futuro' },
    { jp: '17/08/2026', glob: '04/11/2026', days: 'Em 48 dias', status: '⏳ Futuro' },
    { jp: '19/08/2026', glob: '06/11/2026', days: 'Em 50 dias', status: '⏳ Futuro' },
    { jp: '22/08/2026', glob: '09/11/2026', days: 'Em 53 dias', status: '⏳ Futuro' },
    { jp: '31/08/2026', glob: '18/11/2026', days: 'Em 62 dias', status: '⏳ Futuro' },
    { jp: '07/09/2026', glob: '25/11/2026', days: 'Em 69 dias', status: '⏳ Futuro' },
    { jp: '11/09/2026', glob: '29/11/2026', days: 'Em 73 dias', status: '⏳ Futuro' },
    { jp: '14/10/2026', glob: '01/01/2027', days: 'Em 106 dias', status: '⏳ Futuro' }
  ];

  for (const r of replacements) {
    const reg = new RegExp(`\\|\\s*[^|]+\\s*\\|\\s*([^|]+)\\s*\\|\\s*${r.jp.replace('/', '\\/')}\\s*\\|\\s*\\*\\*[^|]+\\*\\*\\s*\\|\\s*[^|]+\\s*\\|`);
    md = md.replace(reg, (match, bannerName) => {
      return `| ${r.status} | ${bannerName.trim()} | ${r.jp} | **${r.glob}** | ${r.days} |`;
    });
  }

  fs.writeFileSync(scraperTimelinePath, md, 'utf8');
  console.log(`[Recalibrate] Arquivo Markdown de previsão atualizado em ${scraperTimelinePath}`);
}
