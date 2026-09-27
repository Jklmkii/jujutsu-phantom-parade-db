const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const logoPath = path.join(rootDir, 'public', 'assets', 'logo.png');
const electronDir = path.join(rootDir, 'electron');

if (!fs.existsSync(logoPath)) {
  console.error('Arquivo logo.png não encontrado em:', logoPath);
  process.exit(1);
}

const logoBuf = fs.readFileSync(logoPath);
const logoBase64 = 'data:image/png;base64,' + logoBuf.toString('base64');

// Copia também o arquivo logo.png para dentro de electron/ para fallback de caminho relativo
fs.copyFileSync(logoPath, path.join(electronDir, 'logo.png'));

const splashContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JJKPPDB</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      user-select: none;
      -webkit-user-select: none;
    }
    body {
      background-color: #06070c;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      overflow: hidden;
      border: 1px solid #1e263d;
      border-radius: 16px;
      -webkit-app-region: drag;
      box-shadow: inset 0 0 40px rgba(6, 182, 212, 0.08);
    }
    .aura-container {
      position: relative;
      width: 100px;
      height: 100px;
      margin-bottom: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .pulse-ring {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(6, 182, 212, 0.45) 0%, rgba(139, 92, 246, 0.2) 65%, transparent 100%);
      animation: pulse 1.8s infinite ease-out;
    }
    .pulse-ring-2 {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 2px solid rgba(6, 182, 212, 0.6);
      animation: pulse-border 1.8s infinite ease-out 0.4s;
    }
    .core-logo {
      position: relative;
      width: 82px;
      height: 82px;
      object-fit: contain;
      filter: drop-shadow(0 0 16px rgba(6, 182, 212, 0.8)) drop-shadow(0 0 28px rgba(139, 92, 246, 0.5));
      animation: pulse-logo 2.4s ease-in-out infinite;
      z-index: 10;
    }
    .title {
      font-size: 18px;
      font-weight: 900;
      letter-spacing: 3px;
      background: linear-gradient(135deg, #67e8f9 0%, #38bdf8 45%, #a855f7 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 4px;
      text-transform: uppercase;
      text-shadow: 0 0 20px rgba(6, 182, 212, 0.3);
    }
    .subtitle {
      font-size: 10px;
      font-weight: 700;
      color: #94a3b8;
      letter-spacing: 1.5px;
      margin-bottom: 22px;
      text-transform: uppercase;
    }
    .progress-bar-bg {
      width: 270px;
      height: 4px;
      background: rgba(30, 38, 61, 0.8);
      border-radius: 4px;
      overflow: hidden;
      position: relative;
      border: 1px solid rgba(6, 182, 212, 0.2);
    }
    .progress-bar-fill {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 45%;
      background: linear-gradient(90deg, #06b6d4, #3b82f6, #8b5cf6);
      border-radius: 4px;
      box-shadow: 0 0 12px #06b6d4;
      animation: progress-move 1.4s infinite ease-in-out;
    }
    .status-text {
      font-size: 10px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      color: #06b6d4;
      margin-top: 10px;
      letter-spacing: 0.5px;
      font-weight: 600;
    }

    @keyframes pulse {
      0% { transform: scale(0.85); opacity: 0.9; }
      50% { transform: scale(1.3); opacity: 0.2; }
      100% { transform: scale(0.85); opacity: 0.9; }
    }
    @keyframes pulse-border {
      0% { transform: scale(0.8); opacity: 1; }
      100% { transform: scale(1.45); opacity: 0; }
    }
    @keyframes pulse-logo {
      0%, 100% { transform: scale(1); filter: drop-shadow(0 0 14px rgba(6, 182, 212, 0.7)); }
      50% { transform: scale(1.06); filter: drop-shadow(0 0 24px rgba(6, 182, 212, 1)) drop-shadow(0 0 35px rgba(139, 92, 246, 0.7)); }
    }
    @keyframes progress-move {
      0% { left: -45%; width: 45%; }
      50% { left: 25%; width: 60%; }
      100% { left: 100%; width: 35%; }
    }
  </style>
</head>
<body>
  <div class="aura-container">
    <div class="pulse-ring"></div>
    <div class="pulse-ring-2"></div>
    <img class="core-logo" src="${logoBase64}" alt="JJKPPDB Logo" />
  </div>
  <h1 class="title">Phantom Parade DB</h1>
  <p class="subtitle">JUJUTSU KAISEN (OFFLINE)</p>
  
  <div class="progress-bar-bg">
    <div class="progress-bar-fill"></div>
  </div>
  
  <span class="status-text">✦ Sincronizando Energia Amaldiçoada...</span>
</body>
</html>`;

const targetSplashPath = path.join(electronDir, 'splash.html');
fs.writeFileSync(targetSplashPath, splashContent, 'utf-8');
console.log('✓ Splash screen gerada com sucesso em:', targetSplashPath);
console.log('✓ Tamanho do arquivo HTML:', splashContent.length, 'bytes');
