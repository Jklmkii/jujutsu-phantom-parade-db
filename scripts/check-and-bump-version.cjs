const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const [envOwner, envRepo] = (process.env.GITHUB_REPOSITORY || '').split('/');
const OWNER = envOwner || 'Jklmkii';
const REPO = envRepo || 'jujutsu-phantom-parade-db';

async function main() {
  const pkgPath = path.join(__dirname, '..', 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'JJKPPDB-CI'
  };
  if (GITHUB_TOKEN) {
    headers['Authorization'] = `token ${GITHUB_TOKEN}`;
  }

  console.log(`Current version in package.json: ${pkg.version}`);

  // 1. Fetch all releases from GitHub
  let existingTags = [];
  try {
    const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases?per_page=100`, { headers });
    if (res.ok) {
      const releases = await res.json();
      existingTags = releases.map(r => r.tag_name).filter(Boolean);
    } else {
      console.warn(`Could not list GitHub releases (${res.status} ${res.statusText}), falling back to git tags.`);
    }
  } catch (err) {
    console.warn('Network error listing releases, falling back to git tags:', err.message);
  }

  // Fallback / merge with local git tags
  try {
    const localTags = execSync('git tag -l', { encoding: 'utf8' })
      .split('\n')
      .map(t => t.trim())
      .filter(Boolean);
    for (const tag of localTags) {
      if (!existingTags.includes(tag)) existingTags.push(tag);
    }
  } catch {
    // git tag error ignored
  }

  console.log(`Found ${existingTags.length} existing release tags on repository.`);

  const commitMsg = (() => {
    try {
      return execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();
    } catch {
      return '';
    }
  })();

  const envBump = (process.env.BUMP_LEVEL || '').toLowerCase().trim();
  const fullContextText = `${envBump} ${process.env.COMMIT_MESSAGE || ''} ${commitMsg}`;
  const isMajor = envBump === 'major' || /#(?:major)\b|\[(?:major)\]|\brelease:\s*major\b/i.test(fullContextText);
  const isMinor = !isMajor && (envBump === 'minor' || /#(?:minor)\b|\[(?:minor)\]|\brelease:\s*minor\b/i.test(fullContextText));

  const versionParts = pkg.version.split('.').map(n => parseInt(n, 10) || 0);
  const currentMajor = versionParts[0] || 1;
  const currentMinor = versionParts[1] || 0;
  const currentPatch = versionParts[2] || 0;

  let targetVersion = pkg.version;
  let targetTag = 'v' + targetVersion;
  let wasBumped = false;

  if (isMajor) {
    console.log(`Major bump triggered via commit marker (#major) or environment.`);
    const targetMajor = currentMajor + 1;
    const targetMinor = 0;
    const majorRegex = new RegExp(`^v?${targetMajor}\\.${targetMinor}\\.(\\d+)$`);
    let maxPatch = 0;
    for (const tag of existingTags) {
      const match = tag.match(majorRegex);
      if (match) {
        const p = parseInt(match[1], 10);
        if (p >= maxPatch) maxPatch = p + 1;
      }
    }
    targetVersion = `${targetMajor}.${targetMinor}.${maxPatch}`;
    targetTag = `v${targetVersion}`;
    wasBumped = true;
    console.log(`Bumping major version from ${pkg.version} to ${targetVersion} (${targetTag}).`);
  } else if (isMinor) {
    console.log(`Minor bump triggered via commit marker (#minor) or environment.`);
    const targetMajor = currentMajor;
    const targetMinor = currentMinor + 1;
    const minorRegex = new RegExp(`^v?${targetMajor}\\.${targetMinor}\\.(\\d+)$`);
    let maxPatch = 0;
    for (const tag of existingTags) {
      const match = tag.match(minorRegex);
      if (match) {
        const p = parseInt(match[1], 10);
        if (p >= maxPatch) maxPatch = p + 1;
      }
    }
    targetVersion = `${targetMajor}.${targetMinor}.${maxPatch}`;
    targetTag = `v${targetVersion}`;
    wasBumped = true;
    console.log(`Bumping minor version from ${pkg.version} to ${targetVersion} (${targetTag}).`);
  } else if (existingTags.includes(targetTag)) {
    console.log(`Release tag ${targetTag} already exists. Finding next available patch version...`);

    // Scan all existing tags for matching major.minor.*
    const regex = new RegExp(`^v?${currentMajor}\\.${currentMinor}\\.(\\d+)$`);
    let maxPatch = currentPatch;
    for (const tag of existingTags) {
      const match = tag.match(regex);
      if (match) {
        const p = parseInt(match[1], 10);
        if (p > maxPatch) maxPatch = p;
      }
    }

    const nextPatch = maxPatch + 1;
    targetVersion = `${currentMajor}.${currentMinor}.${nextPatch}`;
    targetTag = `v${targetVersion}`;
    wasBumped = true;

    console.log(`Auto-bumping patch version from ${pkg.version} to ${targetVersion} (${targetTag}).`);
  } else {
    console.log(`Release tag ${targetTag} is new and ready for publication.`);
  }

  if (wasBumped) {
    // Write updated version back to package.json
    pkg.version = targetVersion;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

    // Also update package-lock.json if it exists
    const pkgLockPath = path.join(__dirname, '..', 'package-lock.json');
    if (fs.existsSync(pkgLockPath)) {
      try {
        const pkgLock = JSON.parse(fs.readFileSync(pkgLockPath, 'utf8'));
        pkgLock.version = targetVersion;
        if (pkgLock.packages && pkgLock.packages['']) {
          pkgLock.packages[''].version = targetVersion;
        }
        fs.writeFileSync(pkgLockPath, JSON.stringify(pkgLock, null, 2) + '\n', 'utf8');
      } catch {}
    }
  }

  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    fs.appendFileSync(outputFile, `should_release=true\n`);
    fs.appendFileSync(outputFile, `bumped=${wasBumped}\n`);
    fs.appendFileSync(outputFile, `version=${targetVersion}\n`);
    fs.appendFileSync(outputFile, `tag=${targetTag}\n`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
