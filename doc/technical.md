# Technical

## 1. 技术栈

- React 18 + TypeScript + Vite，`base: './'`，Less 样式。
- 渲染方式是 DOM/CSS：滑板墙、板面、生成状态和评审页都使用 HTML/CSS 组合。
- 平台能力使用 `@shared/runtime`：`callAigramAPI`、`openAigramProfile`、`useGenImage`、`useGameEvent`；存档使用 `@shared/save/useGameSave`。
- 运行时生图直接调用平台 `https://chat.aiwaves.tech/aigram/api/gen-image`：有头像走 img2img，无头像走 txt2img。

## 2. 目录结构

- `src/App.tsx`：非 Aigram 环境默认显示评审页；`?play=1` 或 Aigram iframe 显示真实游戏。
- `src/DeckWall/DeckWall.tsx`：真实游戏 UI，包含竖向滚动的 3 列鱼鳞瓦片式滑板墙、增强 CTA、12 小时冷却状态、全屏制板生产页、正反两面作品详情页、点赞、留言和作者 profile 入口。
- `src/DeckWall/components/SkateTruckSvg.tsx`：背面拟物轮架组件，绘制外扩轮子、金属轴、底座、螺丝和主螺母，支持黑色、奶白、薄荷 3 个轮子版本。
- `src/DeckWall/hooks/useDeckWall.ts`：用户资料、生成调用、本地 mirror 存档、12 小时制板冷却、公共墙拉取、点赞/留言聚合、留言通知、optimistic merge。
- `src/DeckWall/DeckWall.less`：真实游戏的滑板店墙面、板面卡片、生成状态、弹层样式。
- `src/DeckWall/ReviewPage.tsx` / `ReviewPage.less`：评审页，第一屏展示最终成品效果，后续展示所有设计状态。
- `src/DeckWall/types.ts`：`DeckEntry`、`DeckSave`、`WallEntry`、舞台尺寸和评审资产路径。
- `src/shared/social/guestbook.ts`：共享留言模型和工具，提供 `GuestMessage`、`appendMessage()`、`messagesByTarget()`、`threadFor()`、`guestbookNotifyConfig()`、`timeAgo()`。
- `src/shared/social/useGuestbook.ts`：共享留言 hook 备用实现；当前游戏因需要同一次 wall fetch 聚合点赞和留言，主要直接使用 `guestbook.ts` 工具。
- `src/DeckWall/i18n/index.ts`：zh/en 轻量文案。
- `src/DeckWall/utils/sounds.ts`：Web Audio 合成点击、生成、成功、失败、打开预览音效。
- `public/img/review-deck-sheet.jpg`：评审源图，保留用于追溯假作品来源。
- `public/img/review-decks/deck-00.jpg` 到 `deck-11.jpg`：评审页和离线 demo 实际使用的 12 张独立竖向喷绘图面，已经紧裁到板面内部，避免 sprite 裁切、胶囊遮罩或实体板背景导致变形和黑边。
- `public/img/review-decks/generated-preview-00.png`：本轮按新规则生成的全幅矩形样张，图像本身无滑板外框、轮子、墙面背景或黑边；评审页同时展示原图和遮罩后的背面效果。
- `public/img/review-back.svg`：旧作品和离线 demo 的正面 logo 品牌图 fallback，以 AlterU 平台 Logo 为核心，图像本身不画滑板圆角边框、内框或板身轮廓；真实生成作品会保存 `backImageUrl` 作为详情页正面。
- `public/poster.svg`：游戏封面。

## 3. 核心模块

- 状态管理：`useDeckWall()` 用 `useGameSave<DeckSave>('deck-wall')` 加本地 `mirror`，只在 `savedData` 首次加载后 seed 一次，后续所有写入从 mirror 读改写，避免多次生成覆盖旧作品。`DeckSave` 包含 `decks`、`totalGenerated`、`messages`、`likes`、`lastGeneratedAt`。
- 生成逻辑：`generateDeck()` 先检查 `canCraft`，冷却由 `(lastGeneratedAt + 12h - Date.now())` 计算，不依赖平台日统计。通过后判断 `profile.head_url`；有头像时把 `head_url` 作为彩色背面作品图的 `ref_url` 传给 `useGenImage.generate()`，无头像时只传基础板 prompt。有头像 prompt 明确头像只作为二创参考，只提取脸型轮廓、发型方向、表情气质、色彩温度、配饰暗示和 attitude，禁止直接贴头像、复刻照片构图、照片感头像或儿童漫画化；`nameGraphicLine(profile.name)` 会把用户名作为可选图案素材注入 prompt，允许转成缩写、裁切字母、竖排/横排字形、贴纸碎片或模板镂空，要求偏中间且不作为普通署名。彩色图 prompt 同时要求全幅竖向喷绘纹理铺满矩形画面、重点构图居中，并避免任何预裁切外形、物体轮廓、边框、墙面背景或两侧黑边。生成开始时先用 `variantForSeed()` 固定 `wheelVariant`，彩色图完成后进入 `brand` 阶段，再调用第二次 `useGenImage.generate()` 生成详情页正面 logo 品牌图，`ref_url` 固定为时间胶囊同款公网 AlterU 平台 Logo `https://images.aiwaves.tech/bag-watermark/alteru_white_1024.png`，logo prompt 要求参考图里的平台 Logo 约占图高 28%，不生成替代字母或额外符号，并按 `charcoal / cream / mint` 注入不同 palette，明确禁止自带圆角边框、内框、边缘描线或板身轮廓，保存到 `backImageUrl`。两张图都成功后进入 `saving` 阶段，生成 `DeckEntry`，写入 mirror，设置 `lastGeneratedAt=now`，`persist()`，并弹出作品预览。
- 生产等待页：`useDeckWall()` 暴露 `generationPhase`、`elapsedMs` 和 `stageLabel`；`status === 'generating'` 时 `DeckWall.tsx` 渲染 `.dw-production` 全屏制板页。生成页每 1 秒刷新 elapsed，按 `art / brand / saving` 显示底漆、喷绘、品牌面、封层预载四段工序，但 UI 只展示 1 条当前工序提示卡和 4 个进度点，不罗列所有说明；提示文案每 9 秒轮换，模拟进度最多停在 92%，避免假装网络任务已真实完成。
- 图片预载：`generateDeck()` 在两次 `useGenImage.generate()` 都返回 URL 后调用 `preloadImage()`，用 `new Image()` 加载彩色背面与品牌正面，并在支持时调用 `image.decode()`；单张图最长等待 16 秒，失败也会继续流程。只有预载结束后才写入 mirror、`persist()` 并 `setSelected()` 打开详情页，降低首次详情中 CSS background 尚未下载导致的空白板面概率。
- 公共墙：`refreshWall()` 调 `/note/aigram/ai/game/get/data/list`，flatten 每个用户存档里的全部 `decks`，按 `createdAt` 倒序截取 24 个；不会只取 `decks[0]`。同一次 rows 会传给 `messagesByTarget()` 和本地 `likesByTarget()`，按作品 id 聚合互动，再解析相关用户 profile，为留言作者和点赞作者补 `name/head_url`。
- optimistic merge：真实墙面渲染前把 `mine` 中云端还没同步的作品合并到 `wall` 前面，用 `entry.id` 去重，解决保存防抖带来的 1-3 秒空窗。
- 详情页：`DeckWall.tsx` 在选中作品后渲染覆盖舞台的 `.dw-modal` 全屏作品状态，顶部左侧 `返回墙面` 按钮关闭详情，中央 `.dw-modal__boards` 点击也关闭详情；主体只保留两块同尺寸板面和底部社交面板，不显示 `Front / Back` 调试标签。正反两块板不旋转、不重叠，使用 24px 间距平行陈列。正面品牌板按 `wheelVariant` 加上 `dw-modal__deck--brand-charcoal / cream / mint` 类，CSS 只做深色 wash 和色系控制，不再额外叠加任何字母 Logo。底部 `.dw-modal__social` 高 178px，包含作者条、点赞/留言计数、点赞按钮、最近 3 条留言和 140 字输入框；用户名样式使用两行 `-webkit-line-clamp`、`overflow-wrap:anywhere` 和非全大写文本，避免长用户名撑破详情页。非本人作者条和非本人留言作者在 Aigram 内调用 `openAigramProfile(userId)`。
- 社交互动：`toggleLike(entry)` 把 `DeckLike` 存在当前玩家自己的 `DeckSave.likes`，同一玩家对同一作品只保留 1 个赞，再次点击取消；聚合时用 `fromUserId` 去重。`sendComment(entry,text)` 用 `newMessage()` 生成 `GuestMessage`，通过 `appendMessage()` 写入当前玩家自己的 `DeckSave.messages`，留言上限 140 字，本地立即回显；给非本人作品留言时用 `useGameEvent().trigger('deck_wall_note', guestbookNotifyConfig(...))` 通知作者，`refUrl` 会用 `new URL(entry.imageUrl, document.baseURI).href` 把相对图片转成绝对 URL。
- 背面硬件：`SkateTruckSvg` 只叠在详情页的彩色背面作品图上，正面 logo 品牌图不加轮子。SVG viewBox 为 `150 410`，真实详情页正面和背面板身主体都为 104px × 382px，CSS 中把背面 SVG 设为 140px × 382px 并向左右外扩，让轮子伸出板身两侧；两组轮架位于 SVG y=78px 和 y=332px。组件用 `useId()` 生成唯一渐变 id，避免多个预览同时渲染时 SVG 渐变冲突。真实页优先读取 `DeckEntry.wheelVariant`，旧作品 fallback 通过作品 id 在 `charcoal / cream / mint` 之间稳定分配轮子颜色，评审页用 `dwr-wheel-variants` 同时展示 3 个版本。背面板面通过 `.dw-modal__back-art::before` / `.dwr-deck--back > span::before` 添加上部横向高光，模拟亮面覆膜反光。
- 跨用户身份：公共墙拉取每个作者的 `name/head_url`；列表墙不显示作者信息，详情弹层显示正反两面、头像 + 名字、互动内容；非本人点击详情作者 chip 或留言作者 chip 用 `openAigramProfile(userId)` 打开主页，竖向滚动墙内的作品点击用 `onClick`。
- 响应式：真实游戏固定 `FIELD_W=390`、`FIELD_H=680`，根据窗口宽高计算 scale；评审页使用正常页面滚动。
- 评审模式：`App.tsx` 检查 `isInAigram` 和 URL 参数；非 Aigram 且未带 `?play=1` 时渲染评审页，避免缺平台环境时看不到最终生成墙效果。

## 4. 扩展点

- 改生成风格：编辑 `src/DeckWall/hooks/useDeckWall.ts` 的 `avatarPromptFor()`、`basicPromptFor()` 和 `nameGraphicLine()`。
- 改制作频率：编辑 `src/DeckWall/hooks/useDeckWall.ts` 的 `CRAFT_COOLDOWN_MS`；当前为 12 小时。
- 改生产等待页：编辑 `src/DeckWall/DeckWall.tsx` 的 `.dw-production` 结构、`productionStepKeys`、`productionProgress()`、`productionNoteKey()`，以及 `src/DeckWall/DeckWall.less` 的 `.dw-production*` 样式。
- 改保存上限：编辑 `MAX_MINE` 和 `MAX_WALL`。
- 改墙面布局：编辑 `src/DeckWall/DeckWall.less` 的 `.dw-wall`、`.dw-card__art`、`.dw-card::before`、`.dw-card__shine`，以及 `src/DeckWall/DeckWall.tsx` 的 `deckStyle()` 行列错位参数；当前为竖向滚动 3 列鱼鳞瓦片墙，单片 104px × 382px，并和详情页保持同一 1:3.67 滑板比例；行距 164px，奇数行右移 34px，下一行覆盖上一行约 57.1%，并用左下偏移硬阴影和柔和落影表现空间层级。
- 改社交规则：编辑 `src/DeckWall/hooks/useDeckWall.ts` 的 `likesByTarget()`、`uniqueLikesFor()`、`toggleLike()`、`sendComment()`，以及 `src/shared/social/guestbook.ts` 的留言上限和通知配置。
- 改评审状态：编辑 `src/DeckWall/ReviewPage.tsx` 的 `StateCard` 和 `WallPreview`。
- 改背面轮架或颜色：编辑 `src/DeckWall/components/SkateTruckSvg.tsx` 的 SVG 结构和 `WheelVariant` 配色；新作品颜色分配在 `src/DeckWall/hooks/useDeckWall.ts` 的 `variantForSeed()`，旧作品 fallback 在 `src/DeckWall/DeckWall.tsx` 的 `wheelVariantFor()`。
- 换评审假作品：替换 `public/img/review-decks/deck-00.jpg` 到 `deck-11.jpg`；如果重新生成整张合集，先裁成独立竖图再接入，避免在 CSS 中用不等比 sprite 缩放。
- 改文案：编辑 `src/DeckWall/i18n/index.ts`。
- 改音效：编辑 `src/DeckWall/utils/sounds.ts` 的频率、波形、时长和 gain。
- 改发布元信息：编辑 `meta.json`、`public/poster.svg` 和 `.github/workflows/deploy.yml`。
