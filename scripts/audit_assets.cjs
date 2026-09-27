const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '../public/assets');

function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

function runAudit() {
  console.log('🔍 Iniciando auditoria de assets do JJKPPDB Offline...\n');

  const allAssetFiles = getAllFiles(ASSETS_DIR);
  let totalBytes = 0;
  const extCounts = {};
  const heavyFiles = [];

  allAssetFiles.forEach((file) => {
    const stat = fs.statSync(file);
    const size = stat.size;
    totalBytes += size;

    const ext = path.extname(file).toLowerCase() || 'unknown';
    extCounts[ext] = (extCounts[ext] || 0) + 1;

    if (size > 5 * 1024 * 1024) {
      heavyFiles.push({
        name: path.relative(ASSETS_DIR, file).replace(/\\/g, '/'),
        sizeMB: (size / (1024 * 1024)).toFixed(2),
      });
    }
  });

  console.log(`📦 Total de Arquivos em public/assets: ${allAssetFiles.length}`);
  console.log(`💾 Espaço Total em Disco: ${(totalBytes / (1024 * 1024)).toFixed(2)} MB (${(totalBytes / (1024 * 1024 * 1024)).toFixed(2)} GB)\n`);

  console.log('📊 Distribuição por Extensão:');
  Object.entries(extCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([ext, count]) => {
      console.log(`  - ${ext.padEnd(8)}: ${count} arquivos`);
    });

  console.log(`\n⚠️ Arquivos Grandes (> 5 MB): ${heavyFiles.length} arquivos`);
  if (heavyFiles.length > 0) {
    console.log('Top 5 maiores arquivos:');
    heavyFiles
      .sort((a, b) => parseFloat(b.sizeMB) - parseFloat(a.sizeMB))
      .slice(0, 5)
      .forEach((f, idx) => {
        console.log(`  ${idx + 1}. ${f.name} — ${f.sizeMB} MB`);
      });
  }

  console.log('\n✅ Auditoria concluída com sucesso!');
}

runAudit();
