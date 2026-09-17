const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  });

  const outDir = path.join(__dirname, '../public/assets/static_thumbs');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const chars = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/characters.json'), 'utf-8'));
  console.log(`Processing ${chars.length} character images...`);

  // HTML with canvas
  const html = `
    <!DOCTYPE html>
    <html>
    <body>
      <canvas id="cv" width="128" height="128"></canvas>
      <script>
        const { ipcRenderer } = require('electron');
        const cv = document.getElementById('cv');
        const ctx = cv.getContext('2d');

        async function processImage(src) {
          return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              // Draw cover mode into 128x128
              const scale = Math.max(128 / img.naturalWidth, 128 / img.naturalHeight);
              const w = img.naturalWidth * scale;
              const h = img.naturalHeight * scale;
              const x = (128 - w) / 2;
              const y = (128 - h) / 2;

              ctx.clearRect(0, 0, 128, 128);
              ctx.drawImage(img, x, y, w, h);
              const dataUrl = cv.toDataURL('image/jpeg', 0.85);
              resolve(dataUrl);
            };
            img.onerror = () => {
              resolve(null);
            };
            img.src = src;
          });
        }

        ipcRenderer.on('render-one', async (e, { id, filePath }) => {
          const res = await processImage('file://' + filePath);
          ipcRenderer.send('render-done', { id, dataUrl: res });
        });
      </script>
    </body>
    </html>
  `;

  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));

  let doneCount = 0;
  for (const c of chars) {
    const rawName = c.image.replace(/^\/+/, '').replace(/^assets\//, '');
    const assetPath = path.join(__dirname, '../public/assets', rawName);
    const baseName = path.parse(rawName).name;
    const destPath = path.join(outDir, `${baseName}.jpg`);

    if (fs.existsSync(assetPath)) {
      const dataUrl = await new Promise((resolve) => {
        ipcMain.once('render-done', (e, args) => resolve(args.dataUrl));
        win.webContents.send('render-one', { id: c.id, filePath: assetPath });
      });

      if (dataUrl) {
        const base64Data = dataUrl.replace(/^data:image\/jpeg;base64,/, '');
        fs.writeFileSync(destPath, Buffer.from(base64Data, 'base64'));
        doneCount++;
      } else {
        console.error(`Failed to load ${rawName}`);
      }
    }
  }

  console.log(`Successfully generated ${doneCount} static thumbnails in ${outDir}`);
  app.quit();
});
