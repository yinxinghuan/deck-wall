import { useEffect, type CSSProperties } from 'react';
import { FIELD_H, FIELD_W, REVIEW_BACK_IMAGE, type DeckVariant, type WallEntry } from './types';
import { useDeckWall } from './hooks/useDeckWall';
import { SkateTruckSvg, type WheelVariant } from './components/SkateTruckSvg';
import { t } from './i18n';
import { playClick, playFail, playGenerate, playOpen, playSuccess, resumeAudio } from './utils/sounds';
import './DeckWall.less';

const aigramSrc = './img/aigram.svg';

function authorInitial(name?: string) {
  return (name || '?').trim().slice(0, 1).toUpperCase() || '?';
}

function wheelVariantFor(entry: WallEntry): WheelVariant {
  if (entry.wheelVariant) return entry.wheelVariant;
  const variants: WheelVariant[] = ['charcoal', 'cream', 'mint'];
  const seed = `${entry.id}-${entry.createdAt || 0}`;
  const score = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return variants[score % variants.length];
}

function productionStep(game: ReturnType<typeof useDeckWall>) {
  if (game.generationPhase === 'saving') return 3;
  if (game.generationPhase === 'brand') return 2;
  return game.elapsedMs < 35000 ? 0 : 1;
}

function productionProgress(game: ReturnType<typeof useDeckWall>) {
  const sec = game.elapsedMs / 1000;
  const step = productionStep(game);
  if (step === 0) return Math.min(18 + (sec / 35) * 14, 32);
  if (step === 1) return Math.min(36 + ((sec - 35) / 85) * 22, 58);
  if (step === 2) return Math.min(68 + Math.sin(sec * 0.9) * 3, 74);
  return 92;
}

function productionCopyKey(game: ReturnType<typeof useDeckWall>, hasAvatar: boolean) {
  if (game.generationPhase === 'brand') return 'productionBrand';
  if (game.generationPhase === 'saving') return 'productionSaving';
  return hasAvatar ? 'productionArtAvatar' : 'productionArtBasic';
}

function productionNoteKey(elapsedMs: number) {
  return `productionNote${Math.floor(elapsedMs / 9000) % 4}`;
}

const productionStepKeys = ['stagePrep', 'stageSpray', 'stageBrand', 'stageSeal'] as const;

function deckStyle(entry: WallEntry, index: number): CSSProperties {
  const row = Math.floor(index / 3);
  const col = index % 3;
  const rowShift = row % 2 === 0 ? 0 : 38;
  const imageUrl = entry.imageUrl.startsWith('http')
    ? entry.imageUrl
    : new URL(entry.imageUrl, document.baseURI).href;
  const backUrl = (entry.backImageUrl || REVIEW_BACK_IMAGE).startsWith('http')
    ? (entry.backImageUrl || REVIEW_BACK_IMAGE)
    : new URL(entry.backImageUrl || REVIEW_BACK_IMAGE, document.baseURI).href;
  return {
    '--x': `${rowShift}px`,
    '--y': '0px',
    '--z': `${20 + row * 12 + col}`,
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
  const activeProductionStep = productionStep(game);
  const productionVariant = (['charcoal', 'cream', 'mint'] as DeckVariant[])[activeProductionStep % 3];

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
            <span className="dw-cta__mark">{game.generating ? t('generating') : t('craftCtaTitle')}</span>
            <span className="dw-cta__copy">{hasAvatar ? t('craftCtaSubAvatar') : t('craftCtaSubBasic')}</span>
            <span className="dw-cta__arrow" aria-hidden>→</span>
          </button>

          {!game.isInAigram && <p className="dw-offplatform">{t('offPlatform')}</p>}
        </section>

        {game.generating && (
          <section className={`dw-production dw-production--${productionVariant}`} aria-live="polite">
            <div className="dw-production__top">
              <span>{t('productionKicker')}</span>
              <strong>{t('productionTitle')}</strong>
              <p>{t(productionCopyKey(game, hasAvatar) as any)}</p>
            </div>

            <div className="dw-production__bench">
              <div className="dw-production__deck" aria-hidden>
                <span className="dw-production__spray dw-production__spray--one" />
                <span className="dw-production__spray dw-production__spray--two" />
                <span className="dw-production__grain" />
              </div>
              <div className="dw-production__labels" aria-hidden>
                <span>{t('productionDeckSide')}</span>
                <span>{t('productionBrandSide')}</span>
              </div>
            </div>

            <div className="dw-production__steps">
              {productionStepKeys.map((key, index) => (
                <span
                  key={key}
                  className={index < activeProductionStep ? 'is-done' : index === activeProductionStep ? 'is-active' : ''}
                >
                  {t(key)}
                </span>
              ))}
            </div>

            <div className="dw-production__meter">
              <span style={{ width: `${productionProgress(game)}%` }} />
            </div>

            <div className="dw-production__ticket">
              <span>{t('productionTicket')}</span>
              <strong>{t(productionNoteKey(game.elapsedMs) as any)}</strong>
              <em>{t('productionElapsed', { n: Math.floor(game.elapsedMs / 1000) })}</em>
            </div>
          </section>
        )}

        {game.selected && (
          <div className="dw-modal" role="dialog" aria-modal="true" onClick={() => game.setSelected(null)}>
            <div className="dw-modal__body" onClick={ev => ev.stopPropagation()}>
              <button type="button" className="dw-modal__close" onClick={() => game.setSelected(null)} aria-label={t('backToWall')}>
                <span aria-hidden>←</span>
                {t('backToWall')}
              </button>
              <div
                className="dw-modal__boards"
                onClick={() => game.setSelected(null)}
                role="button"
                aria-label={t('backToWall')}
              >
                <div className={`dw-modal__deck dw-modal__deck--front dw-modal__deck--brand dw-modal__deck--brand-${wheelVariantFor(game.selected)}`} style={deckStyle(game.selected, 0)}>
                  <span className="dw-modal__brand-art" />
                </div>
                <div className="dw-modal__deck dw-modal__deck--back" style={deckStyle(game.selected, 0)}>
                  <span className="dw-modal__back-art" />
                  <SkateTruckSvg className="dw-modal__back-svg" variant={wheelVariantFor(game.selected)} />
                </div>
              </div>
              <div className="dw-modal__identity">
                {game.selected.isSelf ? (
                  <div className="dw-modal__author-card dw-modal__author-card--self">
                    <span className="dw-modal__avatar" aria-hidden>
                      {game.selected.userAvatarUrl ? (
                        <img src={game.selected.userAvatarUrl} alt="" draggable={false} />
                      ) : (
                        <span>{authorInitial(game.selected.userName || t('self'))}</span>
                      )}
                    </span>
                    <span className="dw-modal__name">
                      <small>{game.selected.hasAvatar ? t('avatarBadge') : t('noAvatarBadge')}</small>
                      <strong>{game.selected.userName || t('self')}</strong>
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="dw-modal__author-card"
                    onClick={() => game.openAuthor(game.selected!)}
                    disabled={!game.isInAigram}
                    aria-label={t('openProfile', { n: game.selected.userName || 'rider' })}
                  >
                    <span className="dw-modal__avatar" aria-hidden>
                      {game.selected.userAvatarUrl ? (
                        <img src={game.selected.userAvatarUrl} alt="" draggable={false} />
                      ) : (
                        <span>{authorInitial(game.selected.userName)}</span>
                      )}
                    </span>
                    <span className="dw-modal__name">
                      <small>{game.selected.hasAvatar ? t('avatarBadge') : t('noAvatarBadge')}</small>
                      <strong>{game.selected.userName || 'rider'}</strong>
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <img className="dw-watermark" src={aigramSrc} alt="" draggable={false} />
      </section>
    </main>
  );
}
