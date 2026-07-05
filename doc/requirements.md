# Requirements

## 1. Overview

Deck Wall 是一个社交共创生成游戏：每个玩家生成一块滑板喷绘板，所有玩家的作品组成一面地下滑板店墙；无头像生成基础板，有头像生成带个人特征的高级喷绘板。

## 2. Visual Design

- 主游戏为 390px × 680px 竖屏舞台，背景是深色滑板店墙面：底色 `#0a0a0d`，墙面噪点用 0.5px 细线和 `rgba(255,255,255,0.05)` 贴纸痕迹表现。
- 顶部 92px 是店招区域：标题 `DECK WALL` 使用 52px 粗体无衬线斜切字形，副标题 13px，字距 0.08em，颜色 `#f3efe2`。
- 中央墙面从 y=126px 到 y=548px，展示 7-12 块滑板喷绘图面，单块图卡尺寸 92px × 286px，宽高比约 1:3.1，圆角 46px，形成接近滑板 deck 的修长大圆端轮廓；墙面使用竖向滚动的三列瓦片墙，行距 126px，因此下一行遮住上一行 160px（超过单片高度 50%），横向错位控制在 2-8px，整体保持整齐。
- 详情页展示同一块滑板的正反两面：正面是玩家生成的喷绘图面，背面是由同一图面色彩转译出的深色 grip tape / 贴纸背板。两面尺寸均为 112px × 350px，宽高比约 1:3.1，圆角 56px，阴影 `0 22px 50px rgba(0,0,0,0.55)`，边缘高光 `rgba(255,255,255,0.13)`；图片必须等比填充，不允许横向或纵向拉伸，不再使用额外轮架圆点。
- 无头像基础板风格：2-3 色粗喷漆、简单 tag、贴纸残片，主色 `#f4e04d/#ff4f8b/#23d6ff`，图案复杂度低。
- 有头像高级板风格：使用头像特征生成统一的街头喷绘肖像/贴纸拼贴，不直接贴原头像，不做儿童卡通；色彩更丰富，质感包含喷漆颗粒、刮痕、胶带、半调网点；生成图要求是铺满画面的竖向滑板喷绘图面，不显示实体板外轮廓和墙面背景，不能有大面积两侧黑边。
- 底部 132px 是操作区：主按钮 326px × 58px，圆角 999px，背景 `#f3efe2`，文字 `#08080a`，按钮左侧显示头像状态圆章 36px。
- 评审页默认在非 Aigram 环境显示，第一屏展示最终成品手机预览，后续展示 5 个状态：有头像可生成、无头像基础生成、生成中、生成完成、公共墙。
- 资产清单：`public/img/review-deck-sheet.jpg` 是评审源图；`public/img/review-decks/deck-00.jpg` 到 `deck-11.jpg` 是实际评审/demo 使用的 12 张独立竖向滑板图；`public/poster.svg` 用于游戏封面；`public/img/aigram.svg` 用于水印。

## 3. Game Mechanics

- 每位玩家本地最多保存 12 块滑板作品，公共墙最多显示 24 块作品。
- 生成一块滑板后创建 `DeckEntry`：`id`、`createdAt`、`mode`、`imageUrl`、`prompt`、`hasAvatar`、`userId`、`userName`。
- 有头像时调用 img2img：`ref_url` 使用平台 `head_url` 公网 URL，prompt 要求“edge-to-edge vertical skateboard deck graphic crop, adult street-art portrait, artwork fills the tall frame, no visible board outline, no surrounding wall background, no black side margins, not cartoon, not childlike”。
- 无头像时调用 txt2img：生成基础喷绘滑板，prompt 要求“edge-to-edge vertical skateboard deck graphic crop, bold tag, spray paint, artwork fills the tall frame, no visible board outline, no surrounding wall background, no black side margins, no portrait”，并在 UI 中提示“建立头像会生成更个人化的高级板”。
- 生成耗时按 200 秒设计等待态，UI 显示三段进度文案：0-35s “铺底漆”、35-120s “压喷绘”、120s+ “封层上墙”；失败后显示重试按钮。
- 生成成功后立即把作品插入本地 mirror 并 `persist()`；公共墙 optimistic merge 自己的作品，云端同步延迟期间也能看到刚生成的板。
- 公共墙读取 `/note/aigram/ai/game/get/data/list`，必须 flatten 每个用户存档里的全部 `decks`，按 `createdAt` 倒序排序后显示 24 个，不取 `decks[0]`。
- 列表墙只展示作品缩略和遮挡层次，不显示作者信息；竖向滑动浏览更多作品；点击作品本体打开本页详情，详情中展示正反两面、用户名、头像，点击作者 chip 打开 Aigram profile。

## 4. Controls

- 主 CTA 使用 `onPointerDown`：点击 “Generate my deck / 生成我的板” 开始生成；生成中按钮 disabled。
- 公共墙作品卡片位于竖向可滚动容器内，使用 `onClick`，不得用 `onPointerDown`；详情里的作者 chip 也使用 `onClick` 并阻止误触。
- 键盘 Enter 或 Space 在真实游戏页触发主 CTA；Esc 关闭放大预览。
- 触控滚动墙面时 `touch-action: manipulation`，舞台根节点不禁用浏览器滚动以免评审页无法滚动。

## 5. Win / Lose Conditions

- 本游戏没有传统失败条件，目标是生成并上墙一块滑板作品。
- 胜利/完成条件：生成接口返回图片 URL 且作品保存成功；完成界面显示作品大图、生成类型（头像高级板/基础板）、本地作品数、返回墙面、再生成一块。
- 失败条件：生成接口报错或无 URL；失败界面显示错误提示、重试按钮、返回墙面按钮。
- 历史最佳用 `localStorage` 记录“累计成功上墙数”，结果界面显示本地累计数。

## 6. Sound Effects

- 点击按钮：620Hz → 420Hz triangle 波，0.05s，gain 0.055。
- 开始生成：180Hz/360Hz/720Hz 三音上行 sawtooth，0.18s，gain 0.04。
- 生成成功：440Hz、554Hz、659Hz、880Hz 四音 arpeggio，间隔 0.045s，每音 0.16s，gain 0.055。
- 生成失败：150Hz → 90Hz square 波下降，0.16s，gain 0.045。
- 打开作品预览：300Hz → 520Hz sine 波，0.08s，gain 0.04。
- 等待态每 12 秒最多播放一次极轻喷漆噪声：white-noise band-pass 900Hz，0.09s，gain 0.018。
