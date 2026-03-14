export function validateApiKey(request: Request): boolean {
  const apiKey = request.headers.get('x-api-key');
  return apiKey === process.env.HEALINGSOIL_API_KEY;
}

export const ALLOWED_ORIGINS = [
  'https://healingsoil.in',
  'https://www.healingsoil.in',
  'http://localhost:3000'
];

export function validateCors(request: Request): string | null {
  const origin = request.headers.get('origin');
  if (!origin) return null; // Non-CORS requests (like curl) might not have origin header
  
  if (ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
  return null;
}

export function corsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  };
}
