/**
 * CDN Configuration Module
 * Provides utilities for working with CDN and optimizing asset delivery
 */

// CDN URL for assets - can be configured per environment
export const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL || '';

/**
 * Get the CDN URL for a static asset
 * @param path - Asset path (e.g., /images/logo.png)
 * @returns Full CDN URL for the asset, or original path if CDN is not configured
 */
export function getCdnUrl(path: string): string {
  if (!cdnUrl || path.startsWith('data:') || path.startsWith('http')) {
    return path;
  }
  
  // Ensure path starts with a slash
  const assetPath = path.startsWith('/') ? path : `/${path}`;
  
  // Construct the full CDN URL
  return `${cdnUrl}${assetPath}`;
}

/**
 * Get appropriate cache control headers for different asset types
 * @param assetType - Type of asset (image, font, css, js)
 * @returns Cache control header value
 */
export function getCacheControlHeaders(assetType: 'image' | 'font' | 'css' | 'js' | 'api' | 'html'): string {
  switch (assetType) {
    // Images can be cached for a long time - they typically have unique names
    case 'image':
      return 'public, max-age=31536000, immutable'; // 1 year
      
    // Fonts rarely change and should be cached for a long time
    case 'font':
      return 'public, max-age=31536000, immutable'; // 1 year
      
    // CSS/JS should have a moderate cache time, may be updated with releases
    case 'css':
    case 'js':
      return 'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=86400'; // 1 day, revalidate
      
    // API responses should not be cached by default
    case 'api':
      return 'no-cache, no-store, must-revalidate';
      
    // HTML should have a short cache time with revalidation
    case 'html':
    default:
      return 'public, max-age=60, s-maxage=300, stale-while-revalidate=600'; // 1 min, revalidate
  }
}

/**
 * Generate appropriate CDN-friendly image URLs with optimizations
 * @param src - Original image source
 * @param width - Desired width
 * @param quality - Image quality (1-100)
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(src: string, width?: number, quality: number = 90): string {
  // Only optimize if using a CDN that supports image transforms
  if (!cdnUrl || src.startsWith('data:') || !process.env.NEXT_PUBLIC_CDN_TRANSFORM_ENABLED) {
    return src;
  }
  
  // Base URL
  const baseUrl = getCdnUrl(src);
  
  // Add image transformation parameters
  // This implementation is generic - customize based on your CDN provider
  const params = new URLSearchParams();
  
  if (width) {
    params.set('width', width.toString());
  }
  
  params.set('quality', quality.toString());
  
  // Add optimized format support (webp/avif)
  params.set('format', 'auto');
  
  // Construct final URL
  const queryString = params.toString();
  if (queryString) {
    return `${baseUrl}?${queryString}`;
  }
  
  return baseUrl;
}

/**
 * Check if a path should be served from CDN
 * @param path - Path to check
 * @returns Boolean indicating if path should use CDN
 */
export function shouldUseCdn(path: string): boolean {
  // Static assets that should use CDN
  const cdnPaths = [
    /^\/(images|assets|fonts)\//,
    /\.(jpe?g|png|gif|svg|webp|avif)$/,
    /\.(woff2?|ttf|otf|eot)$/,
    /^\/_next\/static\//,
  ];
  
  // Check if path matches any CDN path pattern
  return cdnPaths.some(pattern => pattern.test(path));
} 