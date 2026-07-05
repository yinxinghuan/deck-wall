# Technical

## 1. 技术栈

- React 18 + TypeScript + Vite，`base: './'`，Less 样式。
- 渲染方式是 DOM/CSS：滑板墙、板面、生成状态和评审页都使用 HTML/CSS 组合。
- 平台能力使用 `@shared/runtime`：`callAigramAPI`、`openAigramProfile`、`useGenImage`；存档使用 `@shared/save/useGameSave`。
- 运行时生图直接调用平台 `https://chat.aiwaves.tech/aigram/api/gen-image`：有头像走 img2img，无头像走 txt2img。

## 2. 目录结构

- `src/App.tsx`：非 Aigram 环境默认显示评审页；`?play=1` 或 Aigram iframe 显示真实游戏。
- `src/DeckWall/DeckWall.tsx`：真实游戏 UI，包含竖向滚动的三列瓦片式滑板墙、生成面板、正反两面作品预览弹层和作者 profile 入口。
- `src/DeckWall/hooks/useDeckWall.ts`：用户资料、生成调用、本地 mirror 存档、公共墙拉取、optimistic merge。
- `src/DeckWall/DeckWall.less`：真实游戏的滑板店墙面、板面卡片、生成状态、弹层样式。
- `src/DeckWall/ReviewPage.tsx` / `ReviewPage.less`：评审页，第一屏展示最终成品效果，后续展示所有设计状态。
- `src/DeckWall/types.ts`：`DeckEntry`、`DeckSave`、`WallEntry`、舞台尺寸和评审资产路径。
- `src/DeckWall/i18n/index.ts`：zh/en 轻量文案。
- `src/DeckWall/utils/sounds.ts`：Web Audio 合成点击、生成、成功、失败、打开预览音效。
- `public/img/review-deck-sheet.jpg`：评审源图，保留用于追溯假作品来源。
- `public/img/review-decks/deck-00.jpg` 到 `deck-11.jpg`：评审页和离线 demo 实际使用的 12 张独立竖向喷绘图面，已经紧裁到板面内部，避免 sprite 裁切、胶囊遮罩或实体板背景导致变形和黑边。
- `public/poster.svg`：游戏封面。

## 3. 核心模块

- 状态管理：`useDeckWall()` 用 `useGameSave<DeckSave>('deck-wall')` 加本地 `mirror`，只在 `savedData` 首次加载后 seed 一次，后续所有写入从 mirror 读改写，避免多次生成覆盖旧作品。
- 生成逻辑：`generateDeck()` 判断 `profile.head_url`；有头像时把 `head_url` 作为 `ref_url` 传给 `useGenImage.generate()`，无头像时只传基础板 prompt。prompt 明确要求竖向滑板喷绘图面铺满画面、不要实体板外轮廓、不要墙面背景或两侧黑边。成功后生成 `DeckEntry`、写入 mirror、`persist()`，并弹出作品预览。
- 公共墙：`refreshWall()` 调 `/note/aigram/ai/game/get/data/list`，flatten 每个用户存档里的全部 `decks`，按 `createdAt` 倒序截取 24 个；不会只取 `decks[0]`。
- optimistic merge：真实墙面渲染前把 `mine` 中云端还没同步的作品合并到 `wall` 前面，用 `entry.id` 去重，解决保存防抖带来的 1-3 秒空窗。
- 跨用户身份：公共墙拉取每个作者的 `name/head_url`；列表墙不显示作者信息，详情弹层显示正反两面、头像 + 名字；非本人点击详情作者 chip 用 `openAigramProfile(userId)` 打开主页，竖向滚动墙内的作品点击用 `onClick`。
- 响应式：真实游戏固定 `FIELD_W=390`、`FIELD_H=680`，根据窗口宽高计算 scale；评审页使用正常页面滚动。
- 评审模式：`App.tsx` 检查 `isInAigram` 和 URL 参数；非 Aigram 且未带 `?play=1` 时渲染评审页，避免缺平台环境时看不到最终生成墙效果。

## 4. 扩展点

- 改生成风格：编辑 `src/DeckWall/hooks/useDeckWall.ts` 的 `avatarPrompt` 和 `basicPrompt`。
- 改保存上限：编辑 `MAX_MINE` 和 `MAX_WALL`。
- 改墙面布局：编辑 `src/DeckWall/DeckWall.less` 的 `.dw-wall`、`.dw-card__art`、`.dw-generator`，以及 `src/DeckWall/DeckWall.tsx` 的 `deckStyle()` 行列错位参数；当前为竖向滚动三列瓦片墙，行距 126px，单片 286px 高，下一行覆盖上一行超过一半。
- 改评审状态：编辑 `src/DeckWall/ReviewPage.tsx` 的 `StateCard` 和 `WallPreview`。
- 换评审假作品：替换 `public/img/review-decks/deck-00.jpg` 到 `deck-11.jpg`；如果重新生成整张合集，先裁成独立竖图再接入，避免在 CSS 中用不等比 sprite 缩放。
- 改文案：编辑 `src/DeckWall/i18n/index.ts`。
- 改音效：编辑 `src/DeckWall/utils/sounds.ts` 的频率、波形、时长和 gain。
- 改发布元信息：编辑 `meta.json`、`public/poster.svg` 和 `.github/workflows/deploy.yml`。
