// 后台「内容管理」写回 GitHub 仓库端点（需管理员登录）。
// GET  /api/repo?path=src/content/nav/default.json  -> 读取仓库文件内容
// POST /api/repo { path, content, message }          -> 写入/更新仓库文件（自动触发 Actions 重建）
// 仓库固定为 cyqmq/sl_blog；Token 取自 KV admin.githubToken（仅服务端，不下发前端）。

import { isAuthed } from '../_auth';
import { loadConfig } from '../_config';

const OWNER = 'cyqmq';
const REPO = 'sl_blog';

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

function b64encodeUtf8(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function b64decodeUtf8(b64: string): string {
  const bin = atob(b64.replace(/\s/g, ''));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export async function onRequest(context: any) {
  const { request, env } = context;
  const method = request.method.toUpperCase();
  const cfg = await loadConfig(env);

  if (method === 'OPTIONS') return json({ ok: true });
  if (!(await isAuthed(request, cfg.authSecret))) return json({ success: false, message: '未授权，请先登录' }, 401);

  const token = cfg.githubToken;
  if (!token) return json({ success: false, message: '未配置 GitHub Token（请在后台「配置」填写）' }, 400);

  const auth = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'astro-site' };
  const base = `https://api.github.com/repos/${OWNER}/${REPO}/contents`;

  if (method === 'GET') {
    const url = new URL(request.url);
    const path = url.searchParams.get('path');
    if (!path) return json({ success: false, message: '缺少 path' }, 400);
    const r = await fetch(`${base}/${path}`, { headers: auth });
    if (!r.ok) return json({ success: false, message: `GitHub ${r.status}` }, r.status);
    const j = await r.json();
    return json({ success: true, sha: j.sha, content: b64decodeUtf8(j.content), path: j.path });
  }

  if (method === 'POST') {
    let body: any;
    try { body = await request.json(); } catch { return json({ success: false, message: '无效的 JSON 请求体' }, 400); }
    const path = body.path;
    const content = body.content;
    const message = body.message || `update ${path}`;
    if (!path || content === undefined) return json({ success: false, message: '缺少 path / content' }, 400);

    // 读取现有 sha（用于更新；不存在则创建）
    let sha: string | undefined;
    const head = await fetch(`${base}/${path}`, { headers: auth });
    if (head.ok) { const hj = await head.json(); sha = hj.sha; }

    const r = await fetch(`${base}/${path}`, {
      method: 'PUT',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, content: b64encodeUtf8(content), sha }),
    });
    if (!r.ok) {
      const t = await r.text();
      return json({ success: false, message: `GitHub ${r.status}: ${t.slice(0, 200)}` }, r.status);
    }
    return json({ success: true, message: '已提交到 GitHub，稍后自动构建生效' });
  }

  return json({ success: false, message: 'Method Not Allowed' }, 405);
}
