import { useEffect, type CSSProperties } from 'react';
import { FIELD_H, FIELD_W, REVIEW_BACK_IMAGE, type WallEntry } from './types';
import { useDeckWall } from './hooks/useDeckWall';
import { t } from './i18n';
import { playClick, playFail, playGenerate, playOpen, playSuccess, resumeAudio } from './utils/sounds';
import './DeckWall.less';

const aigramSrc = './img/aigram.svg';

function authorInitial(name?: string) {
  return (name || '?').trim().slice(0, 1).toUpperCase() || '?';
}

function deckStyle(entry: WallEntry, index: number): CSSProperties {
  const row = Math.floor(index / 3);
  const col = index % 3;
  const xPattern = row % 2 === 0 ? [-8, 4, -2] : [8, -4, 6];
  const imageUrl = entry.imageUrl.startsWith('http')
    ? entry.imageUrl
    : new URL(entry.imageUrl, document.baseURI).href;
  const backUrl = (entry.backImageUrl || REVIEW_BACK_IMAGE).startsWith('http')
    ? (entry.backImageUrl || REVIEW_BACK_IMAGE)
    : new URL(entry.backImageUrl || REVIEW_BACK_IMAGE, document.baseURI).href;
  return {
    '--x': `${xPattern[col]}px`,
    '--y': '0px',
    '--z': `${20 + row * 10 + col}`,
    '--deck-img': `url(${imageUrl})`,
    '--deck-back-img': `url(${backUrl})`,
  } as CSSProperties;
}

function DeckCard({
  entry,
  index,
  onOpen,
}: {
  entry: WallEntry;
  index: number;
  onOpen: () => void;
}) {
  return (
    <button type="button" className="dw-card" style={deckStyle(entry, index)} onClick={onOpen}>
      <span className="dw-card__art" />
      <span className="dw-card__shine" />
    </button>
  );
}

export default function DeckWall() {
  const game = useDeckWall();
  const hasAvatar = !!game.profile?.head_url;

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        game.setSelected(null);
        return;
      }
      if (ev.key !== ' ' && ev.key !== 'Enter') return;
      ev.preventDefault();
      handleGenerate();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  async function handleGenerate() {
    if (game.generating || !game.profileLoaded) return;
    resumeAudio();
    playClick();
    playGenerate();
    try {
      await game.generateDeck();
      playSuccess();
    } catch {
      playFail();
    }
  }

  function openEntry(entry: WallEntry) {
    playOpen();
    game.setSelected(entry);
  }

  return (
    <main className="dw-shell">
      <section
        className="dw-stage"
        style={{
          width: FIELD_W,
          height: FIELD_H,
          transform: `scale(${game.scale})`,
        }}
      >
        <header className="dw-header">
          <div>
            <span className="dw-kicker">{t('visible')} {game.wall.length}</span>
            <h1>{t('title')}</h1>
          </div>
          <span className="dw-mine">{t('mine')} {game.mine.length}</span>
        </header>

        <p className="dw-subtitle">{t('subtitle')}</p>

        <section className="dw-wall" aria-label={t('wall')}>
          {game.wall.map((entry, index) => (
            <DeckCard
              key={entry.id}
              entry={entry}
              index={index}
              onOpen={() => openEntry(entry)}
            />
          ))}
        </section>

        <section className={`dw-generator dw-generator--${game.status}`}>
          <div className="dw-generator__status">
            <span className={`dw-avatar ${hasAvatar ? 'dw-avatar--ready' : ''}`}>
              {hasAvatar ? <img src={game.profile!.head_url} alt="" draggable={false} /> : '?'}
            </span>
            <div>
              <strong>{hasAvatar ? t('avatarBadge') : t('noAvatarBadge')}</strong>
              <p>{hasAvatar ? '头像会被转译成统一街头喷绘板。' : t('profileHint')}</p>
            </div>
          </div>

          {game.generating && (
            <div className="dw-progress">
              <span />
              <p>{t(game.stageLabel as any)}</p>
            </div>
          )}

          {game.status === 'failed' && <p className="dw-error">{game.error || 'Generation failed.'}</p>}

          <button type="button" className="dw-cta" onPointerDown={handleGenerate} disabled={game.generating || !game.profileLoaded}>
            {game.generating ? t('generating') : hasAvatar ? t('generateAvatar') : t('generateBasic')}
          </button>

          {!game.isInAigram && <p className="dw-offplatform">{t('offPlatform')}</p>}
        </section>

        {game.selected && (
          <div className="dw-modal" role="dialog" aria-modal="true" onClick={() => game.setSelected(null)}>
            <div className="dw-modal__body" onClick={ev => ev.stopPropagation()}>
              <div className="dw-modal__boards">
                <div className="dw-modal__deck dw-modal__deck--front" style={deckStyle(game.selected, 0)}>
                  <span className="dw-modal__label">Front</span>
                  <span className="dw-modal__art" />
                </div>
                <div className="dw-modal__deck dw-modal__deck--back" style={deckStyle(game.selected, 0)}>
                  <span className="dw-modal__label">Back</span>
                  <span className="dw-modal__back-art" />
                  <svg className="dw-modal__back-svg" viewBox="0 0 112 350" aria-hidden="true">
                    <defs>
                      <linearGradient id="dwTruckMetal" x1="0" x2="1" y1="0" y2="1">
                        <stop offset="0" stopColor="#e8e0c9" stopOpacity="0.82" />
                        <stop offset="0.52" stopColor="#6f6a60" stopOpacity="0.8" />
                        <stop offset="1" stopColor="#f5efe0" stopOpacity="0.68" />
                      </linearGradient>
                      <radialGradient id="dwWheelRubber" cx="50%" cy="45%" r="60%">
                        <stop offset="0" stopColor="#2b2b2f" />
                        <stop offset="0.55" stopColor="#111114" />
                        <stop offset="1" stopColor="#050506" />
                      </radialGradient>
                    </defs>
                    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M33 94h46" stroke="url(#dwTruckMetal)" strokeWidth="7" />
                      <path d="M42 82h28l8 12-8 12H42l-8-12z" fill="rgba(232,224,201,0.22)" stroke="rgba(243,239,226,0.62)" strokeWidth="1.4" />
                      <circle cx="47" cy="89" r="2.4" fill="#f3efe2" opacity="0.64" />
                      <circle cx="65" cy="89" r="2.4" fill="#f3efe2" opacity="0.64" />
                      <circle cx="47" cy="99" r="2.4" fill="#f3efe2" opacity="0.64" />
                      <circle cx="65" cy="99" r="2.4" fill="#f3efe2" opacity="0.64" />
                      <circle cx="28" cy="94" r="13" fill="url(#dwWheelRubber)" stroke="rgba(243,239,226,0.24)" strokeWidth="1.4" />
                      <circle cx="84" cy="94" r="13" fill="url(#dwWheelRubber)" stroke="rgba(243,239,226,0.24)" strokeWidth="1.4" />
                      <circle cx="28" cy="94" r="4" fill="#d7ff2f" opacity="0.55" />
                      <circle cx="84" cy="94" r="4" fill="#d7ff2f" opacity="0.55" />

                      <path d="M33 256h46" stroke="url(#dwTruckMetal)" strokeWidth="7" />
                      <path d="M42 244h28l8 12-8 12H42l-8-12z" fill="rgba(232,224,201,0.22)" stroke="rgba(243,239,226,0.62)" strokeWidth="1.4" />
                      <circle cx="47" cy="251" r="2.4" fill="#f3efe2" opacity="0.64" />
                      <circle cx="65" cy="251" r="2.4" fill="#f3efe2" opacity="0.64" />
                      <circle cx="47" cy="261" r="2.4" fill="#f3efe2" opacity="0.64" />
                      <circle cx="65" cy="261" r="2.4" fill="#f3efe2" opacity="0.64" />
                      <circle cx="28" cy="256" r="13" fill="url(#dwWheelRubber)" stroke="rgba(243,239,226,0.24)" strokeWidth="1.4" />
                      <circle cx="84" cy="256" r="13" fill="url(#dwWheelRubber)" stroke="rgba(243,239,226,0.24)" strokeWidth="1.4" />
                      <circle cx="28" cy="256" r="4" fill="#ff4f8b" opacity="0.58" />
                      <circle cx="84" cy="256" r="4" fill="#ff4f8b" opacity="0.58" />
                    </g>
                  </svg>
                </div>
              </div>
              <div className="dw-modal__copy">
                <div className="dw-modal__meta">
                  <span>{game.selected.hasAvatar ? t('avatarBadge') : t('noAvatarBadge')}</span>
                  <h2>{game.selected.isSelf ? t('complete') : game.selected.userName || 'Deck'}</h2>
                  {game.selected.isSelf ? (
                    <strong className="dw-modal__self">{t('self')}</strong>
                  ) : (
                    <button
                      type="button"
                      className="dw-modal__author"
                      onClick={() => game.openAuthor(game.selected!)}
                      disabled={!game.isInAigram}
                    >
                      <span className="dw-author__avatar">
                        {game.selected.userAvatarUrl ? (
                          <img src={game.selected.userAvatarUrl} alt="" draggable={false} />
                        ) : (
                          <span>{authorInitial(game.selected.userName)}</span>
                        )}
                      </span>
                      <span>{game.selected.userName || 'rider'}</span>
                    </button>
                  )}
                </div>
                <button type="button" onClick={() => game.setSelected(null)}>Close</button>
              </div>
            </div>
          </div>
        )}

        <img className="dw-watermark" src={aigramSrc} alt="" draggable={false} />
      </section>
    </main>
  );
}
