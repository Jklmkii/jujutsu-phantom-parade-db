const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const tempReleaseDir = 'C:\\temp\\jjk-release';
const targetReleaseDir = path.join(rootDir, 'release');

console.log('====================================================');
console.log('  Jujutsu Kaisen: Phantom Parade DB - Build Windows');
console.log('====================================================\n');

try {
  // 1. Build Vite web bundle
  console.log('[1/3] Compilando assets de producao (Vite + TypeScript)...');
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });

  // 2. Run electron-builder
  console.log('\n[2/3] Empacotando executavel Electron Windows (.exe)...');
  execSync('npx electron-builder --win --x64', { cwd: rootDir, stdio: 'inherit' });

  // 3. Ensure target release directory exists and copy executable
  console.log('\n[3/3] Copiando executavel final para pasta release/...');
  if (!fs.existsSync(targetReleaseDir)) {
    fs.mkdirSync(targetReleaseDir, { recursive: true });
  }

  const tempFiles = fs.readdirSync(tempReleaseDir);
  const exeFiles = tempFiles.filter(f => f.endsWith('.exe'));

  if (exeFiles.length === 0) {
    throw new Error('Nenhum arquivo .exe encontrado em ' + tempReleaseDir);
  }

  for (const file of exeFiles) {
    const srcPath = path.join(tempReleaseDir, file);
    const destPath = path.join(targetReleaseDir, file);
    console.log(`Copiando ${file} -> release/${file}`);
    fs.copyFileSync(srcPath, destPath);
    const stats = fs.statSync(destPath);
    const sizeMb = (stats.size / (1024 * 1024)).toFixed(1);
    console.log(`✓ Concluido com sucesso! Tamanho: ${sizeMb} MB`);
    console.log(`  Localizacao: ${destPath}`);
  }

  console.log('\n====================================================');
  console.log('  Build concluido com sucesso!');
  console.log('====================================================');
} catch (error) {
  console.error('\n❌ Erro durante a geracao do executavel:', error.message);
  process.exit(1);
}
