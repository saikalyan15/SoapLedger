import { handlers } from '@/auth';

// Auth.js OAuth callback + session endpoints.
// middleware.ts must leave /api/auth/* open, otherwise the sign-in flow itself
// would be blocked by the very gate it exists to satisfy.
export const { GET, POST } = handlers;
