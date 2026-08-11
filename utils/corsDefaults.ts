export const DEFAULT_CORS_ALLOW_ORIGIN = '*';
export const DEFAULT_CORS_ALLOW_METHODS = '*';
// Authorization is not covered by the CORS wildcard and must be explicit.
export const DEFAULT_CORS_ALLOW_HEADERS = '*, Authorization';
export const CREDENTIAL_CORS_ALLOW_METHODS = 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS';
export const CREDENTIAL_CORS_ALLOW_HEADERS = [
  'Accept',
  'Authorization',
  'Content-Type',
  'X-Requested-With',
  'X-CSRF-Token',
  'Cache-Control',
  'Pragma',
].join(', ');
export const DEFAULT_CORS_MAX_AGE = 600;
