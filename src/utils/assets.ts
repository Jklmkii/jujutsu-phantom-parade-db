/**
 * Safe Asset URL Resolver for Web and Electron (file:// protocol)
 * Resolves images relatively without leading slashes so that Electron can load them from dist/assets
 */
export const getAssetUrl = (fileName?: string): string => {
  if (!fileName) {
    return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%231a1429"/><text x="50%" y="50%" fill="%238b5cf6" font-family="sans-serif" font-size="14" text-anchor="middle" dominant-baseline="middle">JJKPPDB</text></svg>';
  }
  // Avoid leading slash for file:// protocol compatibility in Electron
  const cleanName = fileName.replace(/^\/+/, '').replace(/^assets\//, '');
  return `./assets/${cleanName}`;
};

export const getAssetPath = getAssetUrl;

export const getSkillIconUrl = (imageKeyOrPath?: string | null): string => {
  if (!imageKeyOrPath) {
    return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="8" fill="%231a1429"/><text x="50%" y="50%" fill="%238b5cf6" font-family="sans-serif" font-size="20" text-anchor="middle" dominant-baseline="middle">🌀</text></svg>';
  }
  let clean = imageKeyOrPath.replace(/^\/+/, '').replace(/^assets\//, '');
  if (!clean.includes('skill_icons/')) {
    clean = `skill_icons/${clean}`;
  }
  if (!clean.endsWith('.png') && !clean.endsWith('.webp') && !clean.endsWith('.jpg') && !clean.endsWith('.svg')) {
    clean = `${clean}.png`;
  }
  return `./assets/${clean}`;
};

export const getStaticThumbUrl = (fileName?: string): string => {
  if (!fileName) {
    return getAssetUrl();
  }
  const cleanName = fileName.replace(/^\/+/, '').replace(/^assets\//, '');
  const baseName = cleanName.replace(/\.[^/.]+$/, '');
  return `./assets/static_thumbs/${baseName}.jpg`;
};
