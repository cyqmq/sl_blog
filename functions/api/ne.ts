// 同源代理：把前端的网易云请求转发到你部署的 Worker，并在服务端注入 API Token。
// 这样 token 不进入浏览器，跨域（含本地预览）也能正常调用。
// 用法：/api/ne?path=song&id=123&level=exhigh&type=json
//       /api/ne?path=download&id=123&quality=exhigh
// Worker 地址与 Token 来自统一配置（KV 优先，env 兜底）。

import { loadConfig } from '../_config';

function sendError(message: string, status: number) {
  return new Response(JSON.stringify({ success: false, message }), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function onRequest(context: any) {
  const { request, env } = context;
  const url = new URL(request.url);
  const cfg = await loadConfig(env);
  const base = cfg.api || 'https://yy.xn--ykq675h.cn';
  const token = cfg.neteaseToken || '';
  const sub = url.searchParams.get('path') || 'song';
  const qs = new URLSearchParams(url.search);
  qs.delete('path');
  if (token) qs.set('token', token);
  const target = `${base}/${sub}?${qs.toString()}`;

  try {
    const fwdHeaders: any = { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://music.163.com/' };
    const reqRange = request.headers.get('Range');
    if (reqRange) fwdHeaders['Range'] = reqRange;
    const upstream = await fetch(target, { method: request.method, headers: fwdHeaders });
    const headers = new Headers();
    const ct = upstream.headers.get('Content-Type');
    if (ct) headers.set('Content-Type', ct);
    headers.set('Access-Control-Allow-Origin', '*');
    const ar = upstream.headers.get('Accept-Ranges'); if (ar) headers.set('Accept-Ranges', ar);
    const cr = upstream.headers.get('Content-Range'); if (cr) headers.set('Content-Range', cr);
    const cl = upstream.headers.get('Content-Length'); if (cl) headers.set('Content-Length', cl);
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch (e: any) {
    return sendError('转发到网易云 Worker 失败：' + (e?.message || e), 502);
  }
}
