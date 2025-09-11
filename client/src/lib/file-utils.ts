import { getAppSettings } from './settings';

/**
 * Appends the user's storage fallback preference as a query parameter to file URLs
 * @param url The original file URL
 * @returns URL with fallback preference query parameter
 */
export function addStorageFallbackParam(url: string): string {
  if (!url || !url.startsWith('/api/files/')) {
    return url;
  }

  const appSettings = getAppSettings();
  const fallbackParam = appSettings.enableReplitFallback ? 'true' : 'false';
  
  // Check if URL already has query parameters
  const separator = url.includes('?') ? '&' : '?';
  
  return `${url}${separator}fallback=${fallbackParam}`;
}

/**
 * Creates a complete file URL with storage fallback preference
 * @param filename The filename to create URL for
 * @returns Complete URL with fallback preference
 */
export function createFileUrl(filename: string): string {
  const baseUrl = `/api/files/${filename}`;
  return addStorageFallbackParam(baseUrl);
}