# Requirements

## 1. Overview

Deck Wall 是一个社交共创生成游戏：每个玩家生成一块滑板喷绘板，所有玩家的作品组成一面地下滑板店墙；无头像生成基础板，有头像生成带个人特征的高级喷绘板。

## 2. Visual Design

- 主游戏为 390px × 680px 竖屏舞台，背景是深色滑板店墙面：底色 `#0a0a0d`，墙面噪点用 0.5px 细线和 `rgba(255,255,255,0.05)` 贴纸痕迹表现。
- 顶部 92px 是店招区域：标题 `DECK WALL` 使用 52px 粗体无衬线斜切字形，副标题 13px，字距 0.08em，颜色 `#f3efe2`。
- 中央墙面从 y=126px 到 y=548px，展示 7-12 块不带轮子的彩色背面喷绘图面，单块墙面瓦片尺寸 116px × 322px，宽高比约 1:2.78，圆角 58px，形成接近滑板 deck 的修长大圆端轮廓；墙面使用 3 列连续瓦片布局，整组宽度 348px，保留单块作品的视觉面积。行距 138px，因此下一行遮住上一行 184px（约 57.1% 高度）；奇数行整体右移 38px，形成整齐错位。每块板有向左下偏移 9px × 12px 的深色投影、20-34px 柔和落影和顶部弱高光，用遮挡和阴影做出真实瓦片叠放的空间感。
- 详情页是覆盖舞台的全屏作品状态，而不是小弹窗：顶部左侧显示 116px × 38px 的 `返回墙面` 胶囊按钮，点击中央滑板展示区也返回墙面。详情页背景不使用网格，改为暗场展台：深黑底、粉色/蓝色弱光斑、2 条斜向细光线和底部柔和投影。详情页展示同一块滑板的正反两面：正面是 AlterU α Logo 品牌面，来自第二次 img2img 生成，视觉比彩色背面更暗、更简洁；背面是玩家头像或基础 prompt 生成的全彩喷绘图面。正面和背面在详情页主体中统一为 116px × 426px，不显示 `Front / Back` 文字注解，不旋转、不重叠，使用 24px 间距平行陈列，通过版面留白、背景光线和底部身份条形成张力。正面 Logo 控制在板高约 38% 以内，并叠加 CSS 中心小 α 标记，避免整块板被 logo 填满。正面按轮子版本提供黑底奶白 α、暖奶油底黑 α、黑底薄荷 α 三个品牌面色系。背面额外叠加 SVG 拟物轮架、轮子、螺丝孔和轴承细节，轮架视觉外扩后整体约 156px 宽。背面板面上方 11.5% 处有一条 58px 高、从左侧边缘扫入的横向高光，主反光更明显、下沿次反光更暗，模拟亮面覆膜贴着板面边缘扫过。两组轮架分别位于 SVG y=78px 和 y=332px；SVG 视图为 150px × 410px，左右轮子骑在板身边缘并各伸出板身约 10-12px，轮子为 20px × 28px 横向圆角矩形，模拟参考图中的短圆柱体比例，包含高光、轻胎纹、侧边暗线、投影、金属轴、底座、4 个螺丝和中心主螺母。轮子提供黑色、奶白、薄荷 3 个颜色版本，真实作品按作品 id 稳定分配，评审页同时展示 3 个版本。正面和背面图片都必须等比填充，不允许横向或纵向拉伸；图片本身必须是铺满矩形的图案，不允许自带滑板圆角边框、内框、边缘描线或板身轮廓，因为最终边框和滑板外形由 CSS 遮罩负责。详情页底部固定显示作者身份条：42px 圆形头像或首字母 fallback、8px 类型标签和 24px 用户名；用户名不强制全大写，最多显示 2 行，超长连续字符允许断行并折叠，保证身份条不撑破页面。非本人作者条在 Aigram 内可点击打开作者主页。
- 无头像基础板风格：2-3 色粗喷漆、简单 tag、贴纸残片，主色 `#f4e04d/#ff4f8b/#23d6ff`，图案复杂度低。
- 有头像高级板风格：头像只作为二次创作参考，生成时提取脸型轮廓、发型方向、表情气质、色彩温度、配饰暗示和整体 attitude，再重组为原创街头喷绘人物/符号化 stencil/贴纸拼贴，不直接贴原头像，不复刻照片构图，不做儿童卡通；色彩更丰富，质感包含喷漆颗粒、刮痕、胶带、半调网点；生成图要求是铺满画面的竖向滑板喷绘图面，不显示实体板外轮廓和墙面背景，不能有大面积两侧黑边。
- 底部 132px 是空闲操作区：主按钮 326px × 68px，圆角 20px，背景为 `#ff4f8b → #f4e04d → #23d6ff` 喷漆渐变，右侧有 30px 黑色圆形箭头，文字分两行，第一行 15px 粗体大写“进入制板间”，第二行 10px 说明本次会生成高级板或基础板。点击后不在底部干等，而是切换到独立全屏生产页。
- 全屏生产页覆盖 390px × 680px 舞台，背景为深黑工位、39px 网格、粉色/蓝色弱光。顶部显示 42px 斜体标题和当前生成说明，中部显示 92px × 286px 板坯动画，板坯上有每 2.2s 循环一次的粉/黄/蓝喷漆光带和 3.6s 慢速扫光；底部显示 4 段工序轨道（底漆 / 喷绘 / 品牌面 / 封层）、0-92% 的模拟进度条、工位小票和 elapsed 秒数。工位小票每 9 秒轮换一次，解释头像如何被转译、为何先生成全幅矩形、为何排除板框黑边、轮架为何后叠加。
- 评审页默认在非 Aigram 环境显示，第一屏展示最终成品手机预览，后续展示 5 个状态：有头像可生成、无头像基础生成、生成中、生成完成、公共墙。
- 资产清单：`public/img/review-deck-sheet.jpg` 是评审源图；`public/img/review-decks/deck-00.jpg` 到 `deck-11.jpg` 是实际评审/demo 使用的 12 张独立竖向滑板图；`public/img/review-decks/generated-preview-00.png` 是按新 prompt 模拟生成的全幅矩形图案样张，用于对照“原图无滑板外框、遮罩后无黑边”；`public/img/review-back.svg` 是旧作品和离线 demo 的背面 fallback；`public/poster.svg` 用于游戏封面；`public/img/aigram.svg` 用于水印。

## 3. Game Mechanics

- 每位玩家本地最多保存 12 块滑板作品，公共墙最多显示 24 块作品。
- 生成一块滑板后创建 `DeckEntry`：`id`、`createdAt`、`mode`、`imageUrl`、`backImageUrl`、`prompt`、`backPrompt`、`hasAvatar`、`userId`、`userName`。
- 有头像时调用 img2img：`ref_url` 使用平台 `head_url` 公网 URL，prompt 要求只提取头像的宽泛身份特征（脸型轮廓、发型方向、表情气质、色彩温度、配饰暗示），再二次创作为原创地下滑板喷绘图形；明确禁止保留精确人脸、复制照片构图、贴圆形头像、生成照片感大头照或可爱漫画化头像。
- 无头像时调用 txt2img：生成基础喷绘滑板，prompt 要求“full-bleed vertical street art texture for a skateboard deck, bold tag, artwork fills the entire rectangular image edge to edge, centered detail composition, do not draw the skateboard outline, no board silhouette, no surrounding wall background, no black side margins, no portrait”，并在 UI 中提示“建立头像会生成更个人化的高级板”。
- 正面 logo 品牌图生成总是调用 img2img：`ref_url` 固定为时间胶囊验证过的 `https://images.aiwaves.tech/bag-watermark/alteru_white_1024.png`，prompt 要求“AlterU Greek alpha logo as central hero mark but deliberately smaller, about 38 percent of board height, simpler and more restrained than the color artwork, premium skate brand identity, no board outline, no rounded border, no frame, no inner rim, no edge stroke, no wheels, no trucks, no extra text”。正面 prompt 根据 `wheelVariant` 注入三种 palette：charcoal / cream / mint。
- 生成耗时按 320 秒设计等待态，两次生图顺序执行，UI 显示四段工序：`art` 生成彩色背面图时显示“底漆 / 喷绘”并循环头像转译、构图居中、去除板框黑边等工作小票；第一张图返回后进入 `brand`，显示“品牌面”并说明正在用 AlterU α 生成更简洁的黑底正面；两张图都返回后进入 `saving`，显示“封层上墙”并保存作品。生成中每 1 秒刷新 elapsed，动态文案每 9 秒轮换一次，模拟进度最高停在 92%，避免把未完成网络任务伪装成真实完成。失败后显示错误和重试按钮。
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
