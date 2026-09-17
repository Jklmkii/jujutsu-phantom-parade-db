const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: true, contextIsolation: false } });
  const imgPath = 'C:/Users/lucas/.gemini/antigravity/brain/6ebacdb3-5106-48f1-b7c5-37d42bf51844/.user_uploaded/media_1789665068273.jpg';
  const dataUrl = 'data:image/jpeg;base64,' + fs.readFileSync(imgPath).toString('base64');
  await win.loadURL('data:text/html,<html><body><canvas id="c"></canvas></body></html>');

  const pngBase64 = await win.webContents.executeJavaScript(`
    new Promise(res => {
      const img = new Image();
      img.onload = () => {
        const c = document.getElementById('c');
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, w, h);
        const d = imgData.data;

        // Flood fill from borders to identify connected background
        const isBg = new Uint8Array(w * h);
        const queue = [];

        function isBackgroundPixel(r, g, b) {
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const sat = max - min;
          const lum = (r * 299 + g * 587 + b * 114) / 1000;

          // Bottom card shadow / gradient has lum ~ 150-200, sat < 18
          // Main background has lum ~ 210-255, sat < 32
          if (lum > 210 && sat < 35) return true;
          if (lum > 145 && sat < 20) return true;
          return false;
        }

        for (let x = 0; x < w; x++) {
          queue.push(x, 0);
          queue.push(x, h - 1);
          isBg[0 * w + x] = 1;
          isBg[(h - 1) * w + x] = 1;
        }
        for (let y = 0; y < h; y++) {
          queue.push(0, y);
          queue.push(w - 1, y);
          isBg[y * w + 0] = 1;
          isBg[y * w + (w - 1)] = 1;
        }

        let head = 0;
        while (head < queue.length) {
          const cx = queue[head++];
          const cy = queue[head++];

          const neighbors = [
            [cx - 1, cy], [cx + 1, cy],
            [cx, cy - 1], [cx, cy + 1]
          ];

          for (let i = 0; i < 4; i++) {
            const nx = neighbors[i][0];
            const ny = neighbors[i][1];
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
              const nidx = ny * w + nx;
              if (!isBg[nidx]) {
                const pidx = nidx * 4;
                const r = d[pidx], g = d[pidx+1], b = d[pidx+2];
                if (isBackgroundPixel(r, g, b)) {
                  isBg[nidx] = 1;
                  queue.push(nx, ny);
                }
              }
            }
          }
        }

        // Identify non-bg connected components to eliminate isolated speckles (< 150 pixels)
        const visited = new Uint8Array(w * h);
        const compQueue = [];
        
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = y * w + x;
            if (isBg[idx] || visited[idx]) continue;

            // BFS component
            const comp = [];
            compQueue.length = 0;
            compQueue.push(x, y);
            visited[idx] = 1;
            let cHead = 0;

            while (cHead < compQueue.length) {
              const qx = compQueue[cHead++];
              const qy = compQueue[cHead++];
              comp.push(qy * w + qx);

              const nbrs = [
                [qx - 1, qy], [qx + 1, qy],
                [qx, qy - 1], [qx, qy + 1]
              ];
              for (let i = 0; i < 4; i++) {
                const nx = nbrs[i][0], ny = nbrs[i][1];
                if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                  const nidx = ny * w + nx;
                  if (!isBg[nidx] && !visited[nidx]) {
                    visited[nidx] = 1;
                    compQueue.push(nx, ny);
                  }
                }
              }
            }

            // If component is a small speckle (< 180 pixels), treat as background!
            if (comp.length < 180) {
              for (const p of comp) {
                isBg[p] = 1;
              }
            }
          }
        }

        // Apply alpha and edge smoothing
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = y * w + x;
            const pidx = idx * 4;
            if (isBg[idx]) {
              d[pidx + 3] = 0;
            } else {
              let bgNeighbors = 0;
              for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                  if (dx === 0 && dy === 0) continue;
                  const qx = x + dx, qy = y + dy;
                  if (qx >= 0 && qx < w && qy >= 0 && qy < h) {
                    if (isBg[qy * w + qx]) bgNeighbors++;
                  }
                }
              }
              if (bgNeighbors > 0) {
                const r = d[pidx], g = d[pidx+1], b = d[pidx+2];
                const lum = (r * 299 + g * 587 + b * 114) / 1000;
                if (lum > 185) {
                  const factor = Math.max(0, (8 - bgNeighbors) / 8);
                  d[pidx + 3] = Math.floor(255 * Math.pow(factor, 1.2));
                }
              }
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);

        // Find bounding box
        let minX = w, maxX = 0, minY = h, maxY = 0;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const a = d[(y * w + x) * 4 + 3];
            if (a > 15) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        const pad = 10;
        minX = Math.max(0, minX - pad);
        minY = Math.max(0, minY - pad);
        maxX = Math.min(w - 1, maxX + pad);
        maxY = Math.min(h - 1, maxY + pad);

        const cropW = maxX - minX + 1;
        const cropH = maxY - minY + 1;

        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = cropW;
        cropCanvas.height = cropH;
        const cropCtx = cropCanvas.getContext('2d');
        cropCtx.drawImage(c, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

        res({
          dataUrl: cropCanvas.toDataURL('image/png'),
          bbox: { minX, minY, maxX, maxY, cropW, cropH }
        });
      };
      img.src = "${dataUrl}";
    });
  `);

  const base64Data = pngBase64.dataUrl.replace(/^data:image\/png;base64,/, '');
  const outPath = path.join(__dirname, '../public/assets/logo.png');
  fs.writeFileSync(outPath, Buffer.from(base64Data, 'base64'));

  // Also write favicon.png
  const faviconPath = path.join(__dirname, '../public/favicon.png');
  fs.writeFileSync(faviconPath, Buffer.from(base64Data, 'base64'));

  console.log('Saved refined logo.png and favicon.png');
  console.log('Final bounding box:', pngBase64.bbox);
  app.quit();
});
