type Locale = 'zh' | 'en';

const zh = {
  title: 'Deck Wall',
  subtitle: '生成一块滑板喷绘，上墙。',
  visible: '墙上',
  mine: '我的',
  generateAvatar: '生成高级板',
  generateBasic: '生成基础板',
  generating: '生成中',
  loading: '加载中',
  retry: '重试',
  wall: '滑板墙',
  backToWall: '返回墙面',
  complete: '已上墙',
  profileHint: '建立头像可以得到更个人化的高级喷绘板。',
  noAvatarBadge: '基础板',
  avatarBadge: '头像高级板',
  openProfile: '打开 {n} 的主页',
  self: 'YOU',
  offPlatform: '生产环境会读取 Aigram 头像；当前是独立预览。',
  stagePrep: '铺底漆',
  stageSpray: '压喷绘',
  stageSeal: '封层上墙',
};

const en: typeof zh = {
  title: 'Deck Wall',
  subtitle: 'Generate a deck graphic and put it on the wall.',
  visible: 'Wall',
  mine: 'Mine',
  generateAvatar: 'Generate premium deck',
  generateBasic: 'Generate basic deck',
  generating: 'Generating',
  loading: 'Loading',
  retry: 'Retry',
  wall: 'Deck wall',
  backToWall: 'Back to wall',
  complete: 'On the wall',
  profileHint: 'Create an avatar to get a more personal premium deck.',
  noAvatarBadge: 'Basic deck',
  avatarBadge: 'Avatar deck',
  openProfile: "Open {n}'s profile",
  self: 'YOU',
  offPlatform: 'Aigram will provide the avatar in production. This is standalone preview.',
  stagePrep: 'Priming',
  stageSpray: 'Spraying',
  stageSeal: 'Sealing',
};

function detectLocale(): Locale {
  const override = localStorage.getItem('game_locale');
  if (override === 'en' || override === 'zh') return override;
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export function t(key: keyof typeof zh, vars?: { n?: number | string }): string {
  const dict = detectLocale() === 'zh' ? zh : en;
  let value = dict[key] || zh[key] || String(key);
  if (vars?.n !== undefined) value = value.replace('{n}', String(vars.n));
  return value;
}
