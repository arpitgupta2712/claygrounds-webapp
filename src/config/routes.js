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

  // Default redirect after authentication
  AUTH_REDIRECT: '/dashboard/table'
};

// Helper function to get full URL including site URL
export function getFullUrl(route, siteUrl) {
  return `${siteUrl}${route}`;
}

// Helper to get current origin URL
export function getCurrentOriginUrl(route) {
  return `${window.location.origin}${route}`;
} 