import type { CSSProperties } from 'react';
import { SkateTruckSvg, type WheelVariant } from './components/SkateTruckSvg';
import { REVIEW_BACK_IMAGE, REVIEW_DECK_IMAGES, REVIEW_GENERATED_DECK_IMAGE, type WallEntry } from './types';
import './ReviewPage.less';

const names = ['Maya', 'Jun', 'Rae', 'Noor', 'Ari', 'Lux', 'Theo', 'Iris', 'Sol', 'Nia', 'Bo', 'Kai'];

function mockDeck(index: number, hasAvatar = index % 3 !== 1): WallEntry {
  return {
    id: `review-deck-${index}`,
    createdAt: Date.now() - index * 60000,
    mode: hasAvatar ? 'avatar' : 'basic',
    imageUrl: REVIEW_DECK_IMAGES[index % REVIEW_DECK_IMAGES.length],
    backImageUrl: REVIEW_BACK_IMAGE,
    prompt: '',
    hasAvatar,
    userId: `review-${index}`,
    userName: names[index % names.length],
  };
}

function boardStyle(index: number, imageUrl = REVIEW_DECK_IMAGES[index % REVIEW_DECK_IMAGES.length]) {
  const row = Math.floor(index / 3);
  const col = index % 3;
  return {
    '--x': `${row % 2 === 0 ? 0 : 27}px`,
    '--y': '0px',
    '--z': `${20 + row * 12 + col}`,
    '--deck-img': `url(${new URL(imageUrl, document.baseURI).href})`,
    '--deck-back-img': `url(${new URL(REVIEW_BACK_IMAGE, document.baseURI).href})`,
  } as CSSProperties;
}

function wheelVariantForIndex(index: number): WheelVariant {
  return (['charcoal', 'cream', 'mint'] as WheelVariant[])[index % 3];
}

function MiniDeck({
  index,
  large = false,
  side = 'wall',
  wheelVariant = wheelVariantForIndex(index),
  imageUrl,
}: {
  index: number;
  large?: boolean;
  side?: 'wall' | 'front' | 'back';
  wheelVariant?: WheelVariant;
  imageUrl?: string;
}) {
  return (
    <span className={`dwr-deck dwr-deck--${side} ${large ? 'dwr-deck--large' : ''}`} style={boardStyle(index, imageUrl)}>
      <span />
      {side === 'back' && <SkateTruckSvg className="dwr-trucks" variant={wheelVariant} />}
    </span>
  );
}

function WallPreview({ count = 9 }: { count?: number }) {
  return (
    <div className="dwr-wall-preview" aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <MiniDeck key={index} index={index} />
      ))}
    </div>
  );
}

function StateCard({
  title,
  caption,
  mode,
}: {
  title: string;
  caption: string;
  mode: 'avatar' | 'basic' | 'generating' | 'complete' | 'wall';
}) {
  const deck = mockDeck(mode === 'basic' ? 1 : 0, mode !== 'basic');
  return (
    <section className={`dwr-state dwr-state--${mode}`}>
      <header>
        <span>{title}</span>
        <strong>{mode === 'basic' ? 'BASIC' : mode === 'avatar' ? 'PREMIUM' : 'DECK WALL'}</strong>
      </header>
      {mode === 'wall' ? (
        <WallPreview count={8} />
      ) : (
        <div className="dwr-state__single">
          {mode === 'complete' ? (
            <div className="dwr-state__pair">
              <MiniDeck index={8} side="front" large />
              <MiniDeck index={8} side="back" large />
            </div>
          ) : (
            <MiniDeck index={mode === 'basic' ? 1 : 0} large />
          )}
          {mode === 'generating' && <span className="dwr-spray">封层上墙</span>}
        </div>
      )}
      <p>{caption}</p>
      <footer>
        {deck.hasAvatar ? '头像特征会被转译成喷绘' : '无头像也能生成基础板'}
      </footer>
    </section>
  );
}

export default function ReviewPage() {
  return (
    <main className="dwr-page">
      <section className="dwr-hero">
        <div className="dwr-hero__copy">
          <span className="dwr-kicker">Deck Wall review build</span>
          <h1>最终效果是滑板喷绘墙，不是头像贴片。</h1>
          <p>
            有头像时，头像只作为生成参考，最终输出是一块统一街头质感的滑板喷绘板；
            无头像也能生成基础板，但复杂度更低。所有人的板组成一面滑板墙。
          </p>
          <div className="dwr-legend">
            <span>头像 = 生成参考</span>
            <span>结果 = 滑板喷绘作品</span>
            <span>列表面 = 竖向瓦片墙</span>
          </div>
          <div className="dwr-links">
            <a href="?play=1">查看真实游戏空环境</a>
            <a href="https://github.com/yinxinghuan/deck-wall/archive/refs/heads/master.zip">迁移工具 zip</a>
          </div>
        </div>

        <div className="dwr-phone" aria-label="Final game preview">
          <div className="dwr-phone__speaker" />
          <div className="dwr-final">
            <header>
              <span>WALL 12</span>
              <strong>DECK WALL</strong>
            </header>
            <WallPreview count={12} />
            <div className="dwr-final__detail">
              <MiniDeck index={0} side="front" />
              <MiniDeck index={0} side="back" />
              <span>DETAIL: FRONT / BACK</span>
            </div>
            <div className="dwr-final__bar">
              <span>头像高级板</span>
              <button>GENERATE MY DECK</button>
            </div>
          </div>
        </div>
      </section>

      <section className="dwr-detail-review">
        <div>
          <span className="dwr-kicker">Final detail</span>
          <h2>正面是 AlterU 品牌面，背面是玩家喷绘。</h2>
          <p>
            墙上看到的是不带轮子的彩色背面。点进详情后，正面是 AlterU 平台 Logo 品牌面，
            视觉更暗、比例更小；背面才是全彩作品图，并在这面叠加 SVG 轮架、轮子、螺丝和轴承。
          </p>
          <div className="dwr-wheel-variants">
            {(['charcoal', 'cream', 'mint'] as WheelVariant[]).map((variant, index) => (
              <figure key={variant}>
                <MiniDeck index={index + 3} side="back" wheelVariant={variant} />
                <figcaption>{variant === 'charcoal' ? 'BLACK' : variant === 'cream' ? 'CREAM' : 'MINT'}</figcaption>
              </figure>
            ))}
          </div>
        </div>
        <div className="dwr-detail-review__boards">
          <figure>
            <MiniDeck index={0} side="front" large />
            <figcaption>FRONT / ALTERU MARK</figcaption>
          </figure>
          <figure>
            <MiniDeck index={0} side="back" large wheelVariant="cream" />
            <figcaption>BACK / AVATAR STYLE</figcaption>
          </figure>
        </div>
      </section>

      <section className="dwr-wheel-scale-review">
        <header>
          <span className="dwr-kicker">Wheel scale review</span>
          <h2>按参考图重调后的轮子比例</h2>
          <p>这里展示的是详情页同一套 SVG 硬件，方便直接评审轮子大小、外扩距离和轮架位置。</p>
        </header>
        <div className="dwr-wheel-scale-review__boards">
          {(['charcoal', 'cream', 'mint'] as WheelVariant[]).map((variant, index) => (
            <figure key={variant}>
              <MiniDeck index={index + 6} side="back" large wheelVariant={variant} />
              <figcaption>{variant === 'charcoal' ? 'BLACK WHEEL' : variant === 'cream' ? 'CREAM WHEEL' : 'MINT WHEEL'}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="dwr-generated-review">
        <header>
          <span className="dwr-kicker">Generated artwork sample</span>
          <h2>新生成图案：先铺满，再套板形。</h2>
          <p>
            左侧是这次模拟生成的原始矩形图，不包含滑板外框、轮子、墙面背景或黑边；
            右侧是同一张图进入背面遮罩后的最终观感，用来确认裁切不会吃掉主体。
          </p>
        </header>
        <div className="dwr-generated-review__body">
          <figure className="dwr-generated-review__raw">
            <img src={REVIEW_GENERATED_DECK_IMAGE} alt="Generated full-bleed skateboard artwork sample" draggable={false} />
            <figcaption>RAW GENERATED IMAGE / NO BOARD OUTLINE</figcaption>
          </figure>
          <figure className="dwr-generated-review__deck">
            <MiniDeck index={11} side="back" large wheelVariant="mint" imageUrl={REVIEW_GENERATED_DECK_IMAGE} />
            <figcaption>MASKED BACK / FINAL DETAIL STYLE</figcaption>
          </figure>
        </div>
      </section>

      <section className="dwr-section-head">
        <span className="dwr-kicker">State review</span>
        <h2>所有设计状态</h2>
        <p>这些状态都在评审页展示，避免生产环境缺头像或不能生成时看不到最终体验。</p>
      </section>

      <section className="dwr-states">
        <StateCard
          title="01 / 有头像"
          caption="点击生成时使用头像作为 ref_url，生成更个人化的街头喷绘板。"
          mode="avatar"
        />
        <StateCard
          title="02 / 无头像"
          caption="仍然可以生成基础板，同时提示建立头像会得到更好的效果。"
          mode="basic"
        />
        <StateCard
          title="03 / 生成中"
          caption="等待态按铺底漆、压喷绘、封层上墙三个阶段推进。"
          mode="generating"
        />
        <StateCard
          title="04 / 完成"
          caption="生成结果成为一块作品板，立即进入自己的本地墙和公共墙。"
          mode="complete"
        />
        <StateCard
          title="05 / 公共墙"
          caption="大家的板以竖向滚动的规则瓦片墙共建，列表只看作品，点开详情再看正反两面和作者信息。"
          mode="wall"
        />
      </section>
    </main>
  );
}
