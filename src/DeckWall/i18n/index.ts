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
  stageBrand: '制作品牌面',
  stageSeal: '封层上墙',
  craftCtaTitle: '进入制板间',
  craftCtaSubAvatar: '用你的头像生成一块高级喷绘板',
  craftCtaSubBasic: '先做一块基础板，头像可稍后补强',
  productionKicker: '制板中',
  productionTitle: '正在把这块板做出来',
  productionDeckSide: '背面喷绘',
  productionBrandSide: '正面标记',
  productionTicket: '工位小票',
  productionElapsed: '{n}s elapsed',
  productionArtAvatar: '正在读取头像里的轮廓、发色和气质，把它转译成街头喷绘，不会直接贴原头像。',
  productionArtBasic: '正在生成基础喷绘：粗喷漆、贴纸残片、刮痕和居中构图会优先处理。',
  productionBrand: '彩色背面已经进入封存，正在用 AlterU 平台 Logo 制作更克制的品牌正面。',
  productionSaving: '两面图已经完成，正在写入作品墙并准备打开最终详情。',
  productionNote0: '主体会保留在画面中区，后续裁切时不丢重点。',
  productionNote1: '图像会先铺满矩形，再由滑板遮罩裁切。',
  productionNote2: '系统会排除自带板框、轮子、黑边和墙面背景。',
  productionNote3: '详情页会额外叠加 SVG 轮架和亮面高光。',
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
  stageBrand: 'Building brand side',
  stageSeal: 'Sealing',
  craftCtaTitle: 'Enter the deck room',
  craftCtaSubAvatar: 'Turn your avatar into a premium street-art deck',
  craftCtaSubBasic: 'Make a basic deck now; add an avatar later',
  productionKicker: 'In production',
  productionTitle: 'Making your deck',
  productionDeckSide: 'Back graphic',
  productionBrandSide: 'Front mark',
  productionTicket: 'Work ticket',
  productionElapsed: '{n}s elapsed',
  productionArtAvatar: 'Reading avatar shape, hair, and attitude, then translating them into street art without pasting the photo.',
  productionArtBasic: 'Building a basic graphic with raw spray paint, sticker scraps, scratches, and a centered composition.',
  productionBrand: 'The color side is sealed. Building a quieter AlterU platform-logo brand side now.',
  productionSaving: 'Both sides are ready. Saving the deck to the wall and preparing the final detail view.',
  productionNote0: 'The subject stays in the middle image zone so later clipping keeps the focus.',
  productionNote1: 'The image is generated full-bleed first, then clipped by the deck mask.',
  productionNote2: 'Board outlines, wheels, black margins, and wall backgrounds are excluded.',
  productionNote3: 'The detail view adds SVG trucks and a glossy highlight after generation.',
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
