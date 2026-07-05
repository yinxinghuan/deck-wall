# Technical

## 1. 技术栈

- React 18 + TypeScript + Vite，`base: './'`，Less 样式。
- 渲染方式是 DOM/CSS：滑板墙、板面、生成状态和评审页都使用 HTML/CSS 组合。
- 平台能力使用 `@shared/runtime`：`callAigramAPI`、`openAigramProfile`、`useGenImage`；存档使用 `@shared/save/useGameSave`。
- 运行时生图直接调用平台 `https://chat.aiwaves.tech/aigram/api/gen-image`：有头像走 img2img，无头像走 txt2img。

## 2. 目录结构

- `src/App.tsx`：非 Aigram 环境默认显示评审页；`?play=1` 或 Aigram iframe 显示真实游戏。
- `src/DeckWall/DeckWall.tsx`：真实游戏 UI，包含竖向滚动的三列瓦片式滑板墙、生成面板、正反两面作品预览弹层和作者 profile 入口。
- `src/DeckWall/components/SkateTruckSvg.tsx`：背面拟物轮架组件，绘制外扩轮子、金属轴、底座、螺丝和主螺母，支持黑色、奶白、薄荷 3 个轮子版本。
- `src/DeckWall/hooks/useDeckWall.ts`：用户资料、生成调用、本地 mirror 存档、公共墙拉取、optimistic merge。
- `src/DeckWall/DeckWall.less`：真实游戏的滑板店墙面、板面卡片、生成状态、弹层样式。
- `src/DeckWall/ReviewPage.tsx` / `ReviewPage.less`：评审页，第一屏展示最终成品效果，后续展示所有设计状态。
- `src/DeckWall/types.ts`：`DeckEntry`、`DeckSave`、`WallEntry`、舞台尺寸和评审资产路径。
- `src/DeckWall/i18n/index.ts`：zh/en 轻量文案。
- `src/DeckWall/utils/sounds.ts`：Web Audio 合成点击、生成、成功、失败、打开预览音效。
- `public/img/review-deck-sheet.jpg`：评审源图，保留用于追溯假作品来源。
- `public/img/review-decks/deck-00.jpg` 到 `deck-11.jpg`：评审页和离线 demo 实际使用的 12 张独立竖向喷绘图面，已经紧裁到板面内部，避免 sprite 裁切、胶囊遮罩或实体板背景导致变形和黑边。
- `public/img/review-back.svg`：旧作品和离线 demo 的正面 logo 品牌图 fallback，以 AlterU α 标志为核心，图像本身不画滑板圆角边框、内框或板身轮廓；真实生成作品会保存 `backImageUrl` 作为详情页正面。
- `public/poster.svg`：游戏封面。

## 3. 核心模块

- 状态管理：`useDeckWall()` 用 `useGameSave<DeckSave>('deck-wall')` 加本地 `mirror`，只在 `savedData` 首次加载后 seed 一次，后续所有写入从 mirror 读改写，避免多次生成覆盖旧作品。
- 生成逻辑：`generateDeck()` 判断 `profile.head_url`；有头像时把 `head_url` 作为彩色背面作品图的 `ref_url` 传给 `useGenImage.generate()`，无头像时只传基础板 prompt。彩色图 prompt 明确要求全幅竖向喷绘纹理铺满矩形画面、重点构图居中、不要滑板外轮廓/板身剪影/墙面背景/两侧黑边；墙面列表只展示这张不带轮子的彩色背面图。彩色图完成后再调用第二次 `useGenImage.generate()` 生成详情页正面 logo 品牌图，`ref_url` 固定为时间胶囊同款公网 α Logo `https://images.aiwaves.tech/bag-watermark/alteru_white_1024.png`，logo prompt 固定为更简洁的 AlterU 品牌面，并明确禁止自带圆角边框、内框、边缘描线或板身轮廓，保存到 `backImageUrl`。两张图都成功后生成 `DeckEntry`、写入 mirror、`persist()`，并弹出作品预览。
- 公共墙：`refreshWall()` 调 `/note/aigram/ai/game/get/data/list`，flatten 每个用户存档里的全部 `decks`，按 `createdAt` 倒序截取 24 个；不会只取 `decks[0]`。
- optimistic merge：真实墙面渲染前把 `mine` 中云端还没同步的作品合并到 `wall` 前面，用 `entry.id` 去重，解决保存防抖带来的 1-3 秒空窗。
- 背面硬件：`SkateTruckSvg` 只叠在详情页的彩色背面作品图上，正面 logo 品牌图不加轮子。SVG viewBox 为 `150 350`，CSS 中比 112px 板身外扩 38px，让轮子伸出板身两侧；组件用 `useId()` 生成唯一渐变 id，避免多个预览同时渲染时 SVG 渐变冲突。真实页通过作品 id 在 `charcoal / cream / mint` 之间稳定分配轮子颜色，评审页用 `dwr-wheel-variants` 同时展示 3 个版本。
- 跨用户身份：公共墙拉取每个作者的 `name/head_url`；列表墙不显示作者信息，详情弹层显示正反两面、头像 + 名字；非本人点击详情作者 chip 用 `openAigramProfile(userId)` 打开主页，竖向滚动墙内的作品点击用 `onClick`。
- 响应式：真实游戏固定 `FIELD_W=390`、`FIELD_H=680`，根据窗口宽高计算 scale；评审页使用正常页面滚动。
- 评审模式：`App.tsx` 检查 `isInAigram` 和 URL 参数；非 Aigram 且未带 `?play=1` 时渲染评审页，避免缺平台环境时看不到最终生成墙效果。

## 4. 扩展点

- 改生成风格：编辑 `src/DeckWall/hooks/useDeckWall.ts` 的 `avatarPrompt` 和 `basicPrompt`。
- 改保存上限：编辑 `MAX_MINE` 和 `MAX_WALL`。
- 改墙面布局：编辑 `src/DeckWall/DeckWall.less` 的 `.dw-wall`、`.dw-card__art`、`.dw-generator`，以及 `src/DeckWall/DeckWall.tsx` 的 `deckStyle()` 行列错位参数；当前为竖向滚动三列瓦片墙，行距 126px，单片 286px 高，下一行覆盖上一行超过一半。
- 改评审状态：编辑 `src/DeckWall/ReviewPage.tsx` 的 `StateCard` 和 `WallPreview`。
- 改背面轮架或颜色：编辑 `src/DeckWall/components/SkateTruckSvg.tsx` 的 SVG 结构和 `WheelVariant` 配色；真实页颜色分配在 `src/DeckWall/DeckWall.tsx` 的 `wheelVariantFor()`。
- 换评审假作品：替换 `public/img/review-decks/deck-00.jpg` 到 `deck-11.jpg`；如果重新生成整张合集，先裁成独立竖图再接入，避免在 CSS 中用不等比 sprite 缩放。
- 改文案：编辑 `src/DeckWall/i18n/index.ts`。
- 改音效：编辑 `src/DeckWall/utils/sounds.ts` 的频率、波形、时长和 gain。
- 改发布元信息：编辑 `meta.json`、`public/poster.svg` 和 `.github/workflows/deploy.yml`。
