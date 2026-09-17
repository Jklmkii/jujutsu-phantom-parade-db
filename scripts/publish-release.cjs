const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (!GITHUB_TOKEN) {
  console.error('Missing GITHUB_TOKEN environment variable.');
  process.exit(1);
}
const [envOwner, envRepo] = (process.env.GITHUB_REPOSITORY || '').split('/');
const OWNER = envOwner || 'Jklmkii';
const REPO = envRepo || 'jujutsu-phantom-parade-db';
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const TAG = 'v' + pkg.version;

function getCommitInfo() {
  try {
    const hash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const msg = execSync('git log -1 --pretty=%s', { encoding: 'utf8' }).trim();
    return { hash, msg };
  } catch {
    return { hash: '', msg: '' };
  }
}

function getReleaseNotes(version) {
  const commitInfo = getCommitInfo();
  const commitLine = commitInfo.hash
    ? `\n\n**Commit Compilado:** \`${commitInfo.hash}\` — *${commitInfo.msg}*`
    : '';

  const notes = [
    `## O que há de novo no JJKPPDB Offline v${version}`,
    '',
    `- Atualização e sincronização de dados, correções e novos recursos compilados a partir do commit mais recente.${commitLine}`,
    '',
    '### Arquivos disponíveis:',
    `- \`JJKPPDB-Offline-Setup-${version}.exe\` — Instalador oficial rápido com suporte a auto-update silencioso no Windows.`,
    `- \`latest.yml\` — Manifesto criptográfico de verificação de versão para atualização automática.`
  ];

  return notes.join('\n');
}

function findAssetFile(fileName) {
  const searchDirs = [
    path.join(__dirname, '..', 'release'),
    'C:\\temp\\jjk-release',
    process.cwd()
  ];

  for (const dir of searchDirs) {
    if (fs.existsSync(dir)) {
      const fullPath = path.join(dir, fileName);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
  }
  return null;
}

async function main() {
  const appName = pkg.productName || 'JJKPPDB Offline';
  const headers = {
    'Authorization': `token ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'JJKPPDB-Publisher'
  };

  const commitInfo = getCommitInfo();
  let subtitle = commitInfo.msg && !commitInfo.msg.startsWith('chore(release)') ? commitInfo.msg : 'Atualizações e melhorias';
  const releaseTitle = `${appName} ${TAG} — ${subtitle}`;
  const releaseBody = getReleaseNotes(pkg.version);

  console.log(`Checking existing releases for ${OWNER}/${REPO}...`);
  const listRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases`, { headers });
  if (!listRes.ok) {
    throw new Error(`Failed to list releases: ${listRes.status} ${listRes.statusText}`);
  }
  const releases = await listRes.json();
  let targetRelease = releases.find(r => r.tag_name === TAG);

  if (!targetRelease) {
    console.log(`Creating release ${TAG} (as draft)...`);
    const createRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tag_name: TAG,
        target_commitish: 'main',
        name: releaseTitle,
        body: releaseBody,
        draft: true, // Create as draft first so clients don't see an incomplete release without latest.yml
        prerelease: false
      })
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Failed to create release: ${createRes.status} ${errText}`);
    }
    targetRelease = await createRes.json();
    console.log(`Draft release ${TAG} created with ID ${targetRelease.id}.`);
  } else {
    console.log(`Release ${TAG} already exists (ID: ${targetRelease.id}). Updating release notes...`);
    await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/${targetRelease.id}`, {
      method: 'PATCH',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        body: releaseBody
      })
    });
  }

  const uploadBaseUrl = targetRelease.upload_url.split('{')[0];

  // Try using GitHub CLI if available (handles large assets natively with retries)
  let hasGhCli = false;
  try {
    execSync('gh --version', { stdio: 'ignore' });
    hasGhCli = true;
  } catch {
    hasGhCli = false;
  }

  // Upload Setup executable, blockmap, and latest.yml FIRST, followed by portable
  const filesToUpload = [
    { name: `JJKPPDB-Offline-Setup-${pkg.version}.exe`, type: 'application/octet-stream', critical: true },
    { name: `JJKPPDB-Offline-Setup-${pkg.version}.exe.blockmap`, type: 'application/octet-stream', critical: false },
    { name: 'latest.yml', type: 'application/x-yaml', critical: true, uploadLast: true },
    { name: `JJKPPDB-Offline-${pkg.version}-portable.exe`, type: 'application/octet-stream', critical: false }
  ];

  let setupExeUploaded = false;

  for (const file of filesToUpload) {
    if (file.uploadLast && !setupExeUploaded) {
      throw new Error(`CRÍTICO: O instalador JJKPPDB-Offline-Setup-${pkg.version}.exe não foi enviado com sucesso. Abortando upload de ${file.name} para impedir release corrompida!`);
    }

    const filePath = findAssetFile(file.name);
    if (!filePath) {
      if (file.critical) {
        throw new Error(`CRÍTICO: Arquivo essencial ${file.name} não foi encontrado para upload.`);
      }
      console.warn(`Arquivo opcional ${file.name} não encontrado, pulando.`);
      continue;
    }

    const stat = fs.statSync(filePath);
    const sizeMb = (stat.size / (1024 * 1024)).toFixed(2);

    let success = false;

    // Method 1: Try gh CLI if available
    if (hasGhCli) {
      try {
        console.log(`[gh cli] Uploading ${file.name} (${sizeMb} MB)...`);
        execSync(`gh release upload "${TAG}" "${filePath}" --clobber`, {
          stdio: 'inherit',
          env: { ...process.env, GH_TOKEN: GITHUB_TOKEN }
        });
        success = true;
      } catch (ghErr) {
        console.warn(`[gh cli] Falha no upload via gh, tentando fallback via REST API:`, ghErr.message);
      }
    }

    // Method 2: REST API fallback with retries
    if (!success) {
      const existingAsset = (targetRelease.assets || []).find(a => a.name === file.name);
      if (existingAsset) {
        console.log(`Asset ${file.name} já existe (ID ${existingAsset.id}), removendo antes de re-enviar...`);
        await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/assets/${existingAsset.id}`, {
          method: 'DELETE',
          headers
        });
      }

      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`Uploading ${file.name} (${sizeMb} MB) [Tentativa ${attempt}/3]...`);
        const fileStream = fs.createReadStream(filePath);
        const fileSize = stat.size;

        try {
          const uploadRes = await fetch(`${uploadBaseUrl}?name=${encodeURIComponent(file.name)}`, {
            method: 'POST',
            headers: {
              'Authorization': `token ${GITHUB_TOKEN}`,
              'Content-Type': file.type,
              'Content-Length': fileSize.toString(),
              'User-Agent': 'JJKPPDB-Publisher'
            },
            body: fileStream,
            duplex: 'half'
          });

          if (uploadRes.ok) {
            console.log(`✓ Upload de ${file.name} concluído com sucesso!`);
            success = true;
            break;
          } else {
            const err = await uploadRes.text();
            console.error(`Falha no upload de ${file.name} (${uploadRes.status}): ${err}`);
          }
        } catch (netErr) {
          console.error(`Erro de rede no upload de ${file.name}:`, netErr.message);
        }

        if (attempt < 3) {
          console.log('Aguardando 4 segundos antes de tentar novamente...');
          await new Promise(r => setTimeout(r, 4000));
        }
      }
    }

    if (!success) {
      if (file.critical) {
        throw new Error(`CRÍTICO: Falha fatal ao fazer upload do arquivo essencial ${file.name} após todas as tentativas.`);
      } else {
        console.warn(`Aviso: falha ao enviar ${file.name}, mas prosseguindo.`);
      }
    } else {
      if (file.name.includes('Setup') && file.name.endsWith('.exe')) {
        setupExeUploaded = true;
      }
    }
  }

  // Final step: Publish the release if it was created as a draft
  console.log(`\nFinalizing publication: publishing release ${TAG} (draft: false)...`);
  try {
    const publishRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/${targetRelease.id}`, {
      method: 'PATCH',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        draft: false
      })
    });
    if (publishRes.ok) {
      console.log(`✓ Release ${TAG} publicada oficialmente com sucesso!`);
    } else {
      const pubErr = await publishRes.text();
      console.warn(`Aviso ao publicar release: ${publishRes.status} ${pubErr}`);
    }
  } catch (pubEx) {
    console.warn('Erro ao atualizar status de publicação da release:', pubEx.message);
  }

  console.log('\n--- Publicação da Release concluída com 100% de integridade! ---');
}

main().catch(err => {
  console.error('Error publishing release:', err);
  process.exit(1);
});
