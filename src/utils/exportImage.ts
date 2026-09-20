import type { Character, Memory } from '../types';
import type { CustomTeam } from '../store/useJjkStore';
import { getAssetPath } from './assets';

/**
 * Carrega uma imagem de forma assíncrona com fallback gracioso.
 */
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Desenha cantos arredondados no Canvas.
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Dispara o download de um Blob PNG no navegador / Electron.
 */
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Cores para Elementos no Canvas
 */
const ELEMENT_COLORS: Record<string, string> = {
  blue: '#38bdf8',
  red: '#f87171',
  green: '#4ade80',
  yellow: '#facc15',
  default: '#c084fc',
};

/**
 * Exporta uma Equipe Personalizada como imagem PNG profissional (1200x680 HD).
 */
export async function exportTeamAsImage(
  team: CustomTeam,
  characters: Character[],
  memories: Memory[],
  language: string = 'pt'
): Promise<void> {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 680;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Fundo com degradê escuro Jujutsu
  const bgGrad = ctx.createLinearGradient(0, 0, 1200, 680);
  bgGrad.addColorStop(0, '#0a0614');
  bgGrad.addColorStop(0.5, '#130c26');
  bgGrad.addColorStop(1, '#090512');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1200, 680);

  // Borda decorativa roxa
  ctx.strokeStyle = '#7c3aed';
  ctx.lineWidth = 4;
  roundRect(ctx, 16, 16, 1168, 648, 24);
  ctx.stroke();

  // 2. Cabeçalho
  ctx.fillStyle = '#a855f7';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('JJKPPDB — JUJUTSU KAISEN: PHANTOM PARADE (OFFLINE DATABASE)', 40, 52);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'black 28px system-ui, sans-serif';
  ctx.fillText(team.name.toUpperCase(), 40, 88);

  if (team.description) {
    ctx.fillStyle = '#9ca3af';
    ctx.font = '13px system-ui, sans-serif';
    const truncatedDesc = team.description.length > 90 ? team.description.slice(0, 90) + '...' : team.description;
    ctx.fillText(truncatedDesc, 40, 112);
  }

  // Badge no canto superior direito
  ctx.fillStyle = '#1e1338';
  roundRect(ctx, 960, 42, 200, 36, 12);
  ctx.fill();
  ctx.strokeStyle = '#9333ea';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#c084fc';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FORMAÇÃO TÁTICA', 1060, 65);
  ctx.textAlign = 'left';

  // 3. Renderização dos 5 Slots
  const slotWidth = 212;
  const slotHeight = 390;
  const startX = 44;
  const gapX = 25;
  const slotY = 135;

  let totalHp = 0;
  let totalTaijutsu = 0;
  let totalJujutsu = 0;

  for (let idx = 0; idx < 5; idx++) {
    const member = team.members.find((m) => m.slot === idx + 1);
    const char = member?.characterId ? characters.find((c) => c.id === member.characterId) : null;
    const memory = member?.memoryId ? memories.find((m) => m.id === member.memoryId) : null;
    const isSub = idx === 4;

    const x = startX + idx * (slotWidth + gapX);

    // Fundo do card do slot
    const slotGrad = ctx.createLinearGradient(x, slotY, x, slotY + slotHeight);
    slotGrad.addColorStop(0, isSub ? '#181230' : '#140e29');
    slotGrad.addColorStop(1, isSub ? '#0e0b1d' : '#0c081a');
    ctx.fillStyle = slotGrad;
    roundRect(ctx, x, slotY, slotWidth, slotHeight, 18);
    ctx.fill();

    ctx.strokeStyle = isSub ? '#f59e0b' : '#4c1d95';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Título do Slot
    ctx.fillStyle = isSub ? '#f59e0b' : '#c084fc';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText(isSub ? (language === 'pt' ? 'SLOT 5 (RESERVA)' : 'SLOT 5 (SUB)') : `SLOT ${idx + 1}`, x + 16, slotY + 28);

    // Retrato do Feiticeiro
    const avatarX = x + 16;
    const avatarY = slotY + 42;
    const avatarSize = 180;

    if (char) {
      // Somatório de atributos
      totalHp += parseInt(char.stats?.hp || '0', 10);
      totalTaijutsu += parseInt(char.stats?.attack || '0', 10);
      totalJujutsu += parseInt(char.stats?.jujutsu || '0', 10);

      const charImgSrc = char.image ? getAssetPath(`assets/${char.image}`) : '';
      const loadedImg = await loadImage(charImgSrc);

      ctx.save();
      roundRect(ctx, avatarX, avatarY, avatarSize, 140, 14);
      ctx.clip();
      if (loadedImg) {
        ctx.drawImage(loadedImg, avatarX, avatarY, avatarSize, 140);
      } else {
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(avatarX, avatarY, avatarSize, 140);
      }
      ctx.restore();

      // Borda do avatar com cor do elemento
      const elemKey = (char.element || '').toLowerCase();
      ctx.strokeStyle = ELEMENT_COLORS[elemKey] || ELEMENT_COLORS.default;
      ctx.lineWidth = 2;
      roundRect(ctx, avatarX, avatarY, avatarSize, 140, 14);
      ctx.stroke();

      // Raridade badge
      ctx.fillStyle = '#000000';
      roundRect(ctx, avatarX + 8, avatarY + 8, 38, 20, 6);
      ctx.fill();
      ctx.fillStyle = char.rarity === 'SSR' ? '#facc15' : char.rarity === 'SR' ? '#c084fc' : '#38bdf8';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillText(char.rarity, avatarX + 16, avatarY + 22);

      // Nome do personagem
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px system-ui, sans-serif';
      const name = char.name.length > 20 ? char.name.slice(0, 19) + '...' : char.name;
      ctx.fillText(name, x + 16, slotY + 204);

      // Epíteto
      ctx.fillStyle = '#9ca3af';
      ctx.font = '11px system-ui, sans-serif';
      const title = char.title.length > 24 ? char.title.slice(0, 23) + '...' : char.title;
      ctx.fillText(title, x + 16, slotY + 222);

      // Elemento e Foco
      ctx.fillStyle = ELEMENT_COLORS[elemKey] || ELEMENT_COLORS.default;
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillText(`• ${char.element} | ${char.focus || 'DPS'}`, x + 16, slotY + 240);
    } else {
      // Slot Vazio de Feiticeiro
      ctx.fillStyle = '#110c22';
      roundRect(ctx, avatarX, avatarY, avatarSize, 140, 14);
      ctx.fill();
      ctx.strokeStyle = '#271c42';
      ctx.stroke();

      ctx.fillStyle = '#6b7280';
      ctx.font = 'italic 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(language === 'pt' ? 'Sem Feiticeiro' : 'Empty Slot', x + slotWidth / 2, slotY + 115);
      ctx.textAlign = 'left';
    }

    // Seção de Memória Equipada
    const memBoxY = slotY + 258;
    ctx.fillStyle = '#0a0714';
    roundRect(ctx, x + 12, memBoxY, slotWidth - 24, 118, 12);
    ctx.fill();
    ctx.strokeStyle = memory ? '#4338ca' : '#1e1738';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (memory) {
      const memImgSrc = memory.image ? getAssetPath(`assets/${memory.image}`) : '';
      const loadedMem = await loadImage(memImgSrc);

      const memThumbX = x + 20;
      const memThumbY = memBoxY + 10;
      const memThumbW = 54;
      const memThumbH = 54;

      ctx.save();
      roundRect(ctx, memThumbX, memThumbY, memThumbW, memThumbH, 8);
      ctx.clip();
      if (loadedMem) {
        ctx.drawImage(loadedMem, memThumbX, memThumbY, memThumbW, memThumbH);
      } else {
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(memThumbX, memThumbY, memThumbW, memThumbH);
      }
      ctx.restore();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px system-ui, sans-serif';
      const mTitle = memory.title.length > 18 ? memory.title.slice(0, 17) + '...' : memory.title;
      ctx.fillText(mTitle, memThumbX + memThumbW + 8, memThumbY + 22);

      ctx.fillStyle = '#818cf8';
      ctx.font = '10px system-ui, sans-serif';
      ctx.fillText(`${memory.rarity} Bit`, memThumbX + memThumbW + 8, memThumbY + 38);

      // Stats da memória
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.fillText(`+${memory.stats?.hp || '0%'} HP`, x + 20, memBoxY + 84);

      ctx.fillStyle = '#f87171';
      ctx.fillText(`+${memory.stats?.taijutsu || '0%'} Tai`, x + 90, memBoxY + 84);

      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`+${memory.stats?.jujutsu || '0%'} Juj`, x + 20, memBoxY + 102);
    } else {
      ctx.fillStyle = '#6b7280';
      ctx.font = 'italic 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(language === 'pt' ? 'Sem Memória' : 'No Memory', x + slotWidth / 2, memBoxY + 65);
      ctx.textAlign = 'left';
    }
  }

  // 4. Rodapé Tático com Totais
  const footerY = 550;
  const footerHeight = 84;
  ctx.fillStyle = '#0f0a21';
  roundRect(ctx, 44, footerY, 1112, footerHeight, 16);
  ctx.fill();
  ctx.strokeStyle = '#3b2568';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Stats Totais
  ctx.fillStyle = '#9ca3af';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText(language === 'pt' ? 'ATRIBUTOS BASE DA FORMAÇÃO:' : 'FORMATION BASE ATTRIBUTES:', 64, footerY + 30);

  ctx.fillStyle = '#4ade80';
  ctx.font = 'black 16px system-ui, sans-serif';
  ctx.fillText(`HP: ${totalHp.toLocaleString()}`, 64, footerY + 58);

  ctx.fillStyle = '#f87171';
  ctx.fillText(`TAIJUTSU: ${totalTaijutsu.toLocaleString()}`, 240, footerY + 58);

  ctx.fillStyle = '#38bdf8';
  ctx.fillText(`JUJUTSU: ${totalJujutsu.toLocaleString()}`, 440, footerY + 58);

  // Rodapé à direita (marca d'água)
  ctx.fillStyle = '#6b7280';
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Gerado via JJKPPDB Offline Database • 100% Offline', 1130, footerY + 38);
  ctx.fillStyle = '#a855f7';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText('github.com/Jklmkii/jujutsu-phantom-parade-db', 1130, footerY + 58);
  ctx.textAlign = 'left';

  // 5. Converte para Blob e dispara download
  canvas.toBlob((blob) => {
    if (!blob) return;
    const safeName = team.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    triggerDownload(blob, `JJKPPDB_Time_${safeName}.png`);
  }, 'image/png');
}

/**
 * Exporta uma Tierlist (Oficial ou Customizada) como imagem PNG completa.
 */
export async function exportTierlistAsImage(
  title: string,
  tiers: { rank: string; characters: Character[] }[],
  language: string = 'pt'
): Promise<void> {
  const rowHeight = 110;
  const headerHeight = 130;
  const footerHeight = 70;
  const totalHeight = headerHeight + tiers.length * rowHeight + footerHeight + 40;
  const width = 1100;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Fundo
  ctx.fillStyle = '#0a0614';
  ctx.fillRect(0, 0, width, totalHeight);

  // Borda
  ctx.strokeStyle = '#7c3aed';
  ctx.lineWidth = 3;
  roundRect(ctx, 12, 12, width - 24, totalHeight - 24, 20);
  ctx.stroke();

  // Cabeçalho
  ctx.fillStyle = '#a855f7';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('JJKPPDB — CLASSIFICAÇÃO DE FEITICEIROS', 36, 44);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'black 26px system-ui, sans-serif';
  ctx.fillText(title.toUpperCase(), 36, 78);

  ctx.fillStyle = '#9ca3af';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(
    language === 'pt'
      ? 'Classificação tática do meta oficial e criações personalizadas da comunidade.'
      : 'Tactical meta ranking and custom community compositions.',
    36,
    102
  );

  // Cores dos Ranks
  const RANK_COLORS: Record<string, { bg: string; text: string }> = {
    'S+': { bg: '#dc2626', text: '#ffffff' },
    S: { bg: '#d97706', text: '#000000' },
    A: { bg: '#7c3aed', text: '#ffffff' },
    B: { bg: '#2563eb', text: '#ffffff' },
    C: { bg: '#059669', text: '#ffffff' },
    D: { bg: '#4b5563', text: '#ffffff' },
  };

  // Renderizar cada linha de Tier
  let currentY = headerHeight;

  for (const tier of tiers) {
    // Bloco do Rank (lado esquerdo)
    const rankColor = RANK_COLORS[tier.rank] || { bg: '#4c1d95', text: '#ffffff' };
    ctx.fillStyle = rankColor.bg;
    roundRect(ctx, 36, currentY, 80, rowHeight - 12, 12);
    ctx.fill();

    ctx.fillStyle = rankColor.text;
    ctx.font = 'black 26px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(tier.rank, 76, currentY + 48);

    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText(`${tier.characters.length}`, 76, currentY + 70);
    ctx.textAlign = 'left';

    // Fundo da área de personagens
    ctx.fillStyle = '#110c22';
    roundRect(ctx, 126, currentY, width - 162, rowHeight - 12, 12);
    ctx.fill();
    ctx.strokeStyle = '#231840';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Renderizar avatares dos personagens no tier
    const avatarSize = 64;
    const avatarGap = 10;
    let charX = 140;

    for (const char of tier.characters) {
      if (charX + avatarSize > width - 170) break; // limite da largura

      const charImgSrc = char.image ? getAssetPath(`assets/${char.image}`) : '';
      const loadedImg = await loadImage(charImgSrc);

      ctx.save();
      roundRect(ctx, charX, currentY + 16, avatarSize, avatarSize, 10);
      ctx.clip();
      if (loadedImg) {
        ctx.drawImage(loadedImg, charX, currentY + 16, avatarSize, avatarSize);
      } else {
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(charX, currentY + 16, avatarSize, avatarSize);
      }
      ctx.restore();

      // Borda com cor do elemento
      const elemKey = (char.element || '').toLowerCase();
      ctx.strokeStyle = ELEMENT_COLORS[elemKey] || ELEMENT_COLORS.default;
      ctx.lineWidth = 2;
      roundRect(ctx, charX, currentY + 16, avatarSize, avatarSize, 10);
      ctx.stroke();

      charX += avatarSize + avatarGap;
    }

    currentY += rowHeight;
  }

  // Rodapé
  ctx.fillStyle = '#6b7280';
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText('Gerado via JJKPPDB Offline • 100% Offline', 36, totalHeight - 24);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_');
    triggerDownload(blob, `JJKPPDB_Tierlist_${safeTitle}.png`);
  }, 'image/png');
}
