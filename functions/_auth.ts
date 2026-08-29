// 鉴权辅助：被 _middleware.ts 与 api/config.ts 复用。
// Cookie 名、Token 签发/校验、Cookie 头生成。

export const COOKIE = 'site_auth';

export async function makeToken(secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode('authenticated'));
  const bytes = new Uint8Array(sig);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  // base64url：避免 + / = 在 Cookie 值里引发解析问题
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function cookieHeader(value: string, maxAge: number): string {
  const expires = new Date(Date.now() + maxAge * 1000).toUTCString();
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}; Expires=${expires}`;
}

export function clearCookieHeader(): string {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export async function isAuthed(request: Request, env: any): Promise<boolean> {
  const secret = env.AUTH_SECRET || 'change-me-in-cf-dashboard';
  const token = await makeToken(secret);
  const cookie = request.headers.get('Cookie') || '';
  return cookie.includes(`${COOKIE}=${token}`);
}
