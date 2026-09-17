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
    console.log(`Creating release ${TAG}...`);
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
        draft: false,
        prerelease: false
      })
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Failed to create release: ${createRes.status} ${errText}`);
    }
    targetRelease = await createRes.json();
    console.log(`Release ${TAG} created with ID ${targetRelease.id}.`);
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

  const filesToUpload = [
    { name: 'latest.yml', type: 'application/x-yaml' },
    { name: `JJKPPDB-Offline-Setup-${pkg.version}.exe.blockmap`, type: 'application/octet-stream' },
    { name: `JJKPPDB-Offline-Setup-${pkg.version}.exe`, type: 'application/octet-stream' },
    { name: `JJKPPDB-Offline-${pkg.version}-portable.exe`, type: 'application/octet-stream' }
  ];

  for (const file of filesToUpload) {
    const filePath = findAssetFile(file.name);
    if (!filePath) {
      console.warn(`File ${file.name} not found in release directories, skipping.`);
      continue;
    }

    const existingAsset = (targetRelease.assets || []).find(a => a.name === file.name);
    if (existingAsset) {
      console.log(`Asset ${file.name} already exists (ID ${existingAsset.id}), deleting before re-upload...`);
      await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/assets/${existingAsset.id}`, {
        method: 'DELETE',
        headers
      });
    }

    const stat = fs.statSync(filePath);
    const sizeMb = (stat.size / (1024 * 1024)).toFixed(2);
    console.log(`Uploading ${file.name} (${sizeMb} MB) from ${filePath}...`);
    const fileStream = fs.createReadStream(filePath);
    const fileSize = stat.size;

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

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      console.error(`Failed to upload ${file.name}: ${uploadRes.status} ${err}`);
    } else {
      console.log(`Successfully uploaded ${file.name}!`);
    }
  }

  console.log('\n--- Release publication completed successfully! ---');
}

main().catch(err => {
  console.error('Error publishing release:', err);
  process.exit(1);
});
