// 统一配置加载：KV 优先，环境变量(env)作为 fallback。
// KV 结构（绑定 SITE_CONFIG）：
//   music:   { api, quality, playlist }      // 播放器相关，含网易云 Worker 地址
//   netease: { token }                       // 网易云 Worker 的 API Token（服务端注入，不下发前端）
//   admin:   { password, authSecret }        // 后台密码与 Cookie 签名密钥
// 这样所有配置集中在 KV，改 KV 即时生效，无需重新构建；env 仅作首次/兜底。

export interface SiteConfig {
  api: string;
  neteaseToken: string;
  quality: string;
  playlist: { id: number; name: string; artist: string }[];
  password: string;
  authSecret: string;
}

const DEFAULT_API = 'https://yy.xn--ykq675h.cn';
const DEFAULT_QUALITY = 'exhigh';
const DEFAULT_PASSWORD = 'opencode123';
const DEFAULT_SECRET = 'change-me-in-cf-dashboard';

export async function loadConfig(env: any): Promise<SiteConfig> {
  const kv = env.SITE_CONFIG;
  let music: any = {};
  let netease: any = {};
  let admin: any = {};
  if (kv) {
    try { music = JSON.parse((await kv.get('music')) || '{}'); } catch {}
    try { netease = JSON.parse((await kv.get('netease')) || '{}'); } catch {}
    try { admin = JSON.parse((await kv.get('admin')) || '{}'); } catch {}
  }
  return {
    api: music.api || netease.api || env.NETEASE_API || DEFAULT_API,
    neteaseToken: netease.token || env.NETEASE_TOKEN || '',
    quality: music.quality || DEFAULT_QUALITY,
    playlist: Array.isArray(music.playlist) ? music.playlist : [],
    password: admin.password || env.SITE_PASSWORD || DEFAULT_PASSWORD,
    authSecret: admin.authSecret || env.AUTH_SECRET || DEFAULT_SECRET,
  };
}

// 读取 KV 中某个 key（不存在返回 {}），用于更新时保留其余字段
export async function readJson(env: any, key: string): Promise<any> {
  const kv = env.SITE_CONFIG;
  if (!kv) return {};
  try { return JSON.parse((await kv.get(key)) || '{}'); } catch { return {}; }
}
