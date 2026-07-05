import { REVIEW_DECK_IMAGES, type WallEntry } from './types';
import './ReviewPage.less';

const names = ['Maya', 'Jun', 'Rae', 'Noor', 'Ari', 'Lux', 'Theo', 'Iris', 'Sol', 'Nia', 'Bo', 'Kai'];

function mockDeck(index: number, hasAvatar = index % 3 !== 1): WallEntry {
  return {
    id: `review-deck-${index}`,
    createdAt: Date.now() - index * 60000,
    mode: hasAvatar ? 'avatar' : 'basic',
    imageUrl: REVIEW_DECK_IMAGES[index % REVIEW_DECK_IMAGES.length],
    prompt: '',
    hasAvatar,
    userId: `review-${index}`,
    userName: names[index % names.length],
  };
}

function boardStyle(index: number) {
  const row = Math.floor(index / 3);
  const col = index % 3;
  const xPattern = row % 2 === 0 ? [-6, 4, -2] : [7, -4, 5];
  return {
    '--x': `${xPattern[col]}px`,
    '--y': '0px',
    '--z': `${20 + row * 10 + col}`,
    '--deck-img': `url(${new URL(REVIEW_DECK_IMAGES[index % REVIEW_DECK_IMAGES.length], document.baseURI).href})`,
  } as React.CSSProperties;
}

function MiniDeck({ index, large = false }: { index: number; large?: boolean }) {
  return (
    <span className={`dwr-deck ${large ? 'dwr-deck--large' : ''}`} style={boardStyle(index)}>
      <span />
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
          <MiniDeck index={mode === 'basic' ? 1 : mode === 'complete' ? 8 : 0} large />
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
            <div className="dwr-final__bar">
              <span>头像高级板</span>
              <button>GENERATE MY DECK</button>
            </div>
          </div>
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
