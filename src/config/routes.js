/**
 * Application route configurations
 */
export const ROUTES = {
  // Auth routes
  LOGIN: '/login',
  
  // Main routes
  DASHBOARD: '/dashboard',
  TABLE_VIEW: '/dashboard/table',
  CATEGORY_VIEW: '/dashboard/category',
  PAYMENTS_VIEW: '/dashboard/payments',
  ERROR_DASHBOARD: '/dashboard/errors',

  // Default redirect after authentication
  AUTH_REDIRECT: '/dashboard/table'
};

/**
 * Helper function to get full URL including site URL
 * @param {string} route - The route to append
 * @param {string} siteUrl - The base site URL
 * @returns {string} The full URL
 */
export function getFullUrl(route, siteUrl) {
  if (!route) {
    throw new Error('[Routes] Route parameter is required');
  }

  if (!siteUrl) {
    console.warn('[Routes] No siteUrl provided, falling back to current origin');
    return getCurrentOriginUrl(route);
  }

  try {
    // Validate the siteUrl is a valid URL
    new URL(siteUrl);
  } catch (error) {
    console.error('[Routes] Invalid siteUrl provided:', siteUrl);
    return getCurrentOriginUrl(route);
  }
  
  // Ensure siteUrl doesn't have trailing slash
  const baseUrl = siteUrl.replace(/\/$/, '');
  // Ensure route starts with slash
  const normalizedRoute = route.startsWith('/') ? route : `/${route}`;
  
  const fullUrl = `${baseUrl}${normalizedRoute}`;
  
  console.log('[Routes] Generated full URL:', {
    baseUrl,
    route: normalizedRoute,
    fullUrl
  });
  
  return fullUrl;
}

/**
 * Helper to get current origin URL
 * @param {string} route - The route to append
 * @returns {string} The full URL with current origin
 */
export function getCurrentOriginUrl(route) {
  if (!route) {
    throw new Error('[Routes] Route parameter is required');
  }

  // Ensure route starts with slash
  const normalizedRoute = route.startsWith('/') ? route : `/${route}`;
  const fullUrl = `${window.location.origin}${normalizedRoute}`;

  console.log('[Routes] Generated origin URL:', {
    origin: window.location.origin,
    route: normalizedRoute,
    fullUrl
  });

  return fullUrl;
} 