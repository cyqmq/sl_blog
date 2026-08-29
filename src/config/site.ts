// 站点统一配置：改这里即可调整资料、社交链接、导航分类与主题。
export const site = {
  title: 'blog神了',
  description: '导航站与博客 · 部署于 Cloudflare Pages',
};

export const profile = {
  name: 'cyqmq',
  handle: '@cyqmq',
  role: '开发者 / 博主',
  bio: [
    '这里是神了，喜欢折腾前端、边缘计算与各种有趣的小工具。',
    '这个站点用来沉淀笔记、分享折腾记录，顺便听听歌。',
  ],
  avatar: '/avatar.svg',
  email: 'admin@神了.cn',
  website: 'https://神了.cn',
};

// 社交/联系方式（icon 对应 src/components/Icon.astro 中已实现的图标名）
export const socials = [
  { name: 'GitHub', href: 'https://github.com/cyqmq', icon: 'github' },
  { name: 'Email', href: 'mailto:i@神了.cn', icon: 'mail' },
  { name: 'Website', href: 'https://神了.cn', icon: 'globe' },
  { name: 'RSS', href: '/rss.xml', icon: 'rss' },
];

// 导航分类（每个分类一组链接）
export const navCategories = [
  {
    title: '常用',
    icon: 'star',
    links: [
      { name: 'GitHub', url: 'https://github.com', desc: '代码托管', icon: 'github' },
      { name: 'Cloudflare', url: 'https://cloudflare.com', desc: 'CDN / 边缘计算', icon: 'cloud' },
      { name: 'Astro', url: 'https://astro.build', desc: '本站框架', icon: 'rocket' },
    ],
  },
  {
    title: '开发',
    icon: 'code',
    links: [
      { name: 'MDN', url: 'https://developer.mozilla.org', desc: 'Web 文档', icon: 'book' },
      { name: 'Can I use', url: 'https://caniuse.com', desc: '兼容性查询', icon: 'check' },
      { name: 'npm', url: 'https://npmjs.com', desc: '包管理', icon: 'package' },
    ],
  },
  {
    title: '工具',
    icon: 'wrench',
    links: [
      { name: 'TinyPNG', url: 'https://tinypng.com', desc: '图片压缩', icon: 'image' },
      { name: 'Carbon', url: 'https://carbon.now.sh', desc: '代码截图', icon: 'pen' },
    ],
  },
];

// 可选主题色（对应 global.css 中 [data-accent="..."]）
export const accents = [
  { id: 'blue', label: '蓝', color: '#6ea8fe' },
  { id: 'green', label: '绿', color: '#34d399' },
  { id: 'purple', label: '紫', color: '#a78bfa' },
  { id: 'rose', label: '玫', color: '#fb7185' },
  { id: 'orange', label: '橙', color: '#fb923c' },
  { id: 'pink', label: '粉', color: '#f472b6' },
  { id: 'cyan', label: '青', color: '#22d3ee' },
  { id: 'brown', label: '棕', color: '#c2a07a' },
];

// 音乐播放器（左下角悬浮）：基于网易云解析 API（Cloudflare Worker）
export const music = {
  enabled: true,
  // 你部署的网易云解析 Worker 地址（参考 https://github.com/cyqmq/CFworker_Netease_url）
  api: 'https://yy.xn--ykq675h.cn',
  // 音质：未配置会员 Cookie 时建议用 exhigh（极高音质）；有会员 Cookie 可改 lossless
  quality: 'exhigh',
  // 示例歌单（网易云歌曲 id）。替换为自己的：歌曲页链接里的 id，例如
  // https://music.163.com/song?id=5257138  ->  id 为 5257138
  playlist: [
    { id: 5257138, name: '屋顶', artist: '周杰伦 / 温岚 / 吴宗宪' },
    { id: 65800, name: '最佳损友', artist: '陈奕迅' },
    { id: 32507038, name: '演员', artist: '薛之谦' },
    { id: 569200213, name: '消愁', artist: '毛不易' },
    { id: 2600493765, name: '恋人', artist: '李荣浩' },
    { id: 30612793, name: '多远都要在一起', artist: 'G.E.M. 邓紫棋' },
  ],
};

// 评论（默认关闭；开启 giscus 需先在 https://giscus.app 配置并填写下方 repo）
export const comments = {
  enabled: false,
  provider: 'giscus' as 'giscus' | 'utterances' | 'waline' | 'none',
  giscus: {
    repo: '', // 例如 'yourname/yourrepo'
    repoId: '',
    category: 'Announcements',
    categoryId: '',
    mapping: 'pathname',
    lang: 'zh-CN',
  },
};
