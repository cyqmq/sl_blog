// 站点可配置项读写接口（统一存于 KV：music / netease / admin）。
// GET  /api/config  -> 公开，返回生效配置（不含敏感字段：密码与 Token 不下发前端）。
// POST /api/config  -> 需管理员 Cookie，将配置写入 KV（SITE_CONFIG 绑定）。
//   · password / neteaseToken / authSecret 留空表示「不修改」，保留原值。
//   · 仅 api / quality / playlist 始终更新。

import { isAuthed } from '../_auth';
import { loadConfig, readJson } from '../_config';

const QUALITIES = ['standard', 'exhigh', 'lossless', 'hires', 'sky', 'jyeffect', 'jymaster', 'dolby'];

const DEFAULTS = {
  api: 'https://yy.xn--ykq675h.cn',
  quality: 'exhigh',
  playlist: [
    { id: 5257138, name: '屋顶', artist: '周杰伦 / 温岚 / 吴宗宪' },
    { id: 65800, name: '最佳损友', artist: '陈奕迅' },
    { id: 32507038, name: '演员', artist: '薛之谦' },
    { id: 569200213, name: '消愁', artist: '毛不易' },
    { id: 2600493765, name: '恋人', artist: '李荣浩' },
    { id: 30612793, name: '多远都要在一起', artist: 'G.E.M. 邓紫棋' },
  ],
};

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

function sanitizePlaylist(input: any): any[] {
  if (!Array.isArray(input)) return DEFAULTS.playlist;
  return input
    .map((t: any) => ({
      id: Number(t.id) || 0,
      name: String(t.name || '').slice(0, 120),
      artist: String(t.artist || '').slice(0, 120),
    }))
    .filter((t: any) => t.id > 0)
    .slice(0, 200);
}

export async function onRequest(context: any) {
  const { request, env } = context;
  const method = request.method.toUpperCase();
  const kv = env.SITE_CONFIG;
  const cfg = await loadConfig(env);

  if (method === 'OPTIONS') return json({ ok: true });

  if (method === 'GET') {
    // 不下发密码与 Token 明文；仅告知是否已设置
    return json({
      api: cfg.api,
      quality: cfg.quality,
      playlist: cfg.playlist,
      hasPassword: Boolean(cfg.password),
      hasNeteaseToken: Boolean(cfg.neteaseToken),
    });
  }

  if (method === 'POST' || method === 'PUT') {
    if (!(await isAuthed(request, cfg.authSecret))) {
      return json({ success: false, message: '未授权，请先登录' }, 401);
    }
    if (!kv) {
      return json(
        { success: false, message: '服务端未配置 KV 存储（SITE_CONFIG 绑定），无法保存' },
        500
      );
    }
    let body: any;
    try {
      body = await request.json();
    } catch {
      return json({ success: false, message: '无效的 JSON 请求体' }, 400);
    }

    const music = {
      api: typeof body.api === 'string' && body.api.trim() ? body.api.trim() : cfg.api,
      quality: QUALITIES.includes(body.quality) ? body.quality : cfg.quality,
      playlist: sanitizePlaylist(body.playlist),
    };
    await kv.put('music', JSON.stringify(music));

    // netease：仅当填写了新 Token 才更新（留空保留原值）
    if (body.neteaseToken && String(body.neteaseToken).trim()) {
      const old = await readJson(env, 'netease');
      old.token = String(body.neteaseToken).trim();
      await kv.put('netease', JSON.stringify(old));
    }

    // admin：密码 / 签名密钥，留空保留原值
    const oldAdmin = await readJson(env, 'admin');
    let changed = false;
    if (body.password && String(body.password).trim()) {
      oldAdmin.password = String(body.password).trim();
      changed = true;
    }
    if (body.authSecret && String(body.authSecret).trim()) {
      oldAdmin.authSecret = String(body.authSecret).trim();
      changed = true;
    }
    if (body.githubToken && String(body.githubToken).trim()) {
      oldAdmin.githubToken = String(body.githubToken).trim();
      changed = true;
    }
    if (changed) await kv.put('admin', JSON.stringify(oldAdmin));

    return json({ success: true, message: '配置已保存', data: { api: music.api, quality: music.quality, playlist: music.playlist } });
  }

  return json({ success: false, message: 'Method Not Allowed' }, 405);
}
