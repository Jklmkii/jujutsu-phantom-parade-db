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
