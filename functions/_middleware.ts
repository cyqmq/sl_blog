// Cloudflare Pages Functions 中间件：仅保护「管理员入口」(/admin)，
// 站点其余部分（导航/博客等）保持公开。未登录访问 /admin -> 跳转 /login；
// 登录成功下发 HttpOnly Cookie，之后可进入 /admin。
// 环境变量：SITE_PASSWORD（管理员密码）、AUTH_SECRET（签发 Cookie 的密钥）。

import { COOKIE, makeToken, cookieHeader, clearCookieHeader, isAuthed } from './_auth';

const LOGIN_PATH = '/login';
const ADMIN_PREFIX = '/admin';
const ASSET_RE = /\.(css|js|mjs|svg|png|jpg|jpeg|gif|ico|woff2?|ttf|eot|webmanifest)$/i;

function loginHtml(error?: string): string {
  const msg = error ? `<p class="err">${error}</p>` : '';
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>管理员登录 · 我的站点</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: grid; place-items: center;
    font-family: system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
    background: #0f1115; color: #e7e9ee;
  }
  .card {
    width: min(360px, 90vw); padding: 32px 28px; border-radius: 16px;
    background: #1c2029; border: 1px solid #2a2f3a; box-shadow: 0 10px 40px rgba(0,0,0,.4);
  }
  .logo { font-size: 26px; font-weight: 700; text-align: center; margin-bottom: 6px; }
  .logo span { color: #6ea8fe; }
  .sub { text-align: center; color: #9aa3b2; font-size: 13px; margin-bottom: 22px; }
  label { display: block; font-size: 13px; color: #9aa3b2; margin-bottom: 6px; }
  input {
    width: 100%; padding: 11px 13px; border-radius: 10px; border: 1px solid #2a2f3a;
    background: #0f1115; color: #e7e9ee; font-size: 15px; outline: none;
  }
  input:focus { border-color: #6ea8fe; }
  button {
    width: 100%; margin-top: 16px; padding: 11px; border: 0; border-radius: 10px;
    background: #6ea8fe; color: #0f1115; font-weight: 600; font-size: 15px; cursor: pointer;
  }
  button:hover { filter: brightness(1.05); }
  .err { color: #fb7185; font-size: 13px; text-align: center; margin: 0 0 12px; }
  .remember { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--muted, #9aa3b2); margin-top: 14px; cursor: pointer; }
  .remember input { width: auto; }
</style>
</head>
<body>
  <form class="card" method="POST" action="/login">
    <div class="logo"><span>◆</span> 我的站点</div>
    <div class="sub">管理员登录</div>
    ${msg}
    <label for="password">密码</label>
    <input id="password" name="password" type="password" autocomplete="current-password" required autofocus />
    <label class="remember"><input type="checkbox" name="remember" value="1" checked /> 记住我（30 天内免登录）</label>
    <button type="submit">登 录</button>
  </form>
</body>
</html>`;
}

export async function onRequest(context: any) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // 退出：清除 Cookie 后回到首页（公开）
  if (path === '/logout') {
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/',
        'Set-Cookie': clearCookieHeader(),
      },
    });
  }

  const authed = await isAuthed(request, env);

  // 登录页
  if (path === LOGIN_PATH) {
    if (authed) return new Response(null, { status: 302, headers: { Location: ADMIN_PREFIX } });
    if (request.method === 'POST') {
      let pwd = '';
      let remember = false;
      try {
        const form = await request.formData();
        pwd = String(form.get('password') || '');
        remember = form.get('remember') === '1';
      } catch {
        /* ignore */
      }
      if (pwd === (env.SITE_PASSWORD || '')) {
        const maxAge = remember ? 2592000 : 86400; // 30 天 / 1 天
        const token = await makeToken(env.AUTH_SECRET || 'change-me-in-cf-dashboard');
        return new Response(null, {
          status: 302,
          headers: {
            Location: ADMIN_PREFIX,
            'Set-Cookie': cookieHeader(token, maxAge),
          },
        });
      }
      return new Response(loginHtml('密码错误，请重试'), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
    return new Response(loginHtml(), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  // 仅保护 /admin 及其子路径
  if (path.startsWith(ADMIN_PREFIX) && !authed && !ASSET_RE.test(path)) {
    return new Response(null, { status: 302, headers: { Location: LOGIN_PATH } });
  }

  return next();
}
