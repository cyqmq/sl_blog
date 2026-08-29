// 站点可配置项（音乐播放器）读写接口。
// GET  /api/config  -> 公开，返回当前生效配置（KV 覆盖默认，缺 KV 时返回默认）。
// POST /api/config  -> 需管理员 Cookie，将配置写入 KV（SITE_CONFIG 绑定）。
// 配置结构：{ api: string, quality: string, playlist: [{ id:number, name:string, artist:string }] }

import { isAuthed } from '../_auth';

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

function sanitize(input: any): { api: string; quality: string; playlist: any[] } {
  const api = typeof input.api === 'string' && input.api.trim() ? input.api.trim() : DEFAULTS.api;
  const quality = QUALITIES.includes(input.quality) ? input.quality : DEFAULTS.quality;
  const playlist = Array.isArray(input.playlist)
    ? input.playlist
        .map((t: any) => ({
          id: Number(t.id) || 0,
          name: String(t.name || '').slice(0, 120),
          artist: String(t.artist || '').slice(0, 120),
        }))
        .filter((t: any) => t.id > 0)
        .slice(0, 200)
    : DEFAULTS.playlist;
  return { api, quality, playlist };
}

export async function onRequest(context: any) {
  const { request, env } = context;
  const method = request.method.toUpperCase();
  const kv = env.SITE_CONFIG;

  if (method === 'OPTIONS') return json({ ok: true });

  if (method === 'GET') {
    let cfg: any = DEFAULTS;
    if (kv) {
      try {
        const raw = await kv.get('music');
        if (raw) {
          const p = JSON.parse(raw);
          cfg = {
            api: p.api || DEFAULTS.api,
            quality: QUALITIES.includes(p.quality) ? p.quality : DEFAULTS.quality,
            playlist: Array.isArray(p.playlist) ? p.playlist : DEFAULTS.playlist,
          };
        }
      } catch {
        cfg = DEFAULTS;
      }
    }
    return json(cfg);
  }

  if (method === 'POST' || method === 'PUT') {
    if (!(await isAuthed(request, env))) {
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
    const out = sanitize(body);
    await kv.put('music', JSON.stringify(out));
    return json({ success: true, message: '配置已保存', data: out });
  }

  return json({ success: false, message: 'Method Not Allowed' }, 405);
}
