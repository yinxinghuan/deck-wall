import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { FIELD_H, FIELD_W, REVIEW_BACK_IMAGE, type DeckVariant, type WallEntry } from './types';
import { useDeckWall } from './hooks/useDeckWall';
import { SkateTruckSvg, type WheelVariant } from './components/SkateTruckSvg';
import { timeAgo, type GuestMessage } from '../shared/social/guestbook';
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

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
}

function productionCopyKey(game: ReturnType<typeof useDeckWall>, hasAvatar: boolean) {
  if (game.generationPhase === 'brand') return 'productionBrand';
  if (game.generationPhase === 'saving') return 'productionSaving';
  return hasAvatar ? 'productionArtAvatar' : 'productionArtBasic';
}

function productionNoteKey(elapsedMs: number) {
  return `productionNote${Math.floor(elapsedMs / 9000) % 4}`;
}

function formatCooldown(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  return `${minutes}m ${String(total % 60).padStart(2, '0')}s`;
}

const productionStepKeys = ['stagePrep', 'stageSpray', 'stageBrand', 'stageSeal'] as const;

function deckStyle(entry: WallEntry, index: number): CSSProperties {
  const row = Math.floor(index / 3);
  const col = index % 3;
  const rowShift = row % 2 === 0 ? 0 : 34;
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

function CommentAvatar({ message }: { message: GuestMessage }) {
  return (
    <span className="dw-comment__avatar" aria-hidden>
      {message.userAvatarUrl ? (
        <img src={message.userAvatarUrl} alt="" draggable={false} />
      ) : (
        <span>{authorInitial(message.userName)}</span>
      )}
    </span>
  );
}

function DetailSocial({
  game,
  entry,
  onInputFocusChange,
}: {
  game: ReturnType<typeof useDeckWall>;
  entry: WallEntry;
  onInputFocusChange: (focused: boolean) => void;
}) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const comments = game.commentsFor(entry);
  const likes = game.likesFor(entry);
  const liked = game.hasLiked(entry);

  useEffect(() => {
    setDraft('');
  }, [entry.id]);

  function submitComment(ev: FormEvent) {
    ev.preventDefault();
    if (game.sendComment(entry, draft)) setDraft('');
  }

  function focusComposer() {
    onInputFocusChange(true);
    window.setTimeout(() => {
      inputRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    }, 80);
  }

  function blurComposer() {
    window.setTimeout(() => onInputFocusChange(false), 120);
  }

  const latestComments = comments.slice(-3).reverse();

  return (
    <div className="dw-modal__social">
      <div className="dw-modal__identity">
        {entry.isSelf ? (
          <div className="dw-modal__author-card dw-modal__author-card--self">
            <span className="dw-modal__avatar" aria-hidden>
              {entry.userAvatarUrl ? (
                <img src={entry.userAvatarUrl} alt="" draggable={false} />
              ) : (
                <span>{authorInitial(entry.userName || t('self'))}</span>
              )}
            </span>
            <span className="dw-modal__name">
              <small>{entry.hasAvatar ? t('avatarBadge') : t('noAvatarBadge')}</small>
              <strong>{entry.userName || t('self')}</strong>
            </span>
          </div>
        ) : (
          <button
            type="button"
            className="dw-modal__author-card"
            onClick={() => game.openAuthor(entry)}
            disabled={!game.isInAigram}
            aria-label={t('openProfile', { n: entry.userName || 'rider' })}
          >
            <span className="dw-modal__avatar" aria-hidden>
              {entry.userAvatarUrl ? (
                <img src={entry.userAvatarUrl} alt="" draggable={false} />
              ) : (
                <span>{authorInitial(entry.userName)}</span>
              )}
            </span>
            <span className="dw-modal__name">
              <small>{entry.hasAvatar ? t('avatarBadge') : t('noAvatarBadge')}</small>
              <strong>{entry.userName || 'rider'}</strong>
            </span>
          </button>
        )}

        <div className="dw-social__metrics" aria-label={`${t('likeCount', { n: likes.length })}, ${t('commentCount', { n: comments.length })}`}>
          <span>{likes.length}</span>
          <span>{comments.length}</span>
        </div>
      </div>

      <div className="dw-social__actions">
        <button
          type="button"
          className={`dw-like ${liked ? 'dw-like--active' : ''}`}
          onClick={() => game.toggleLike(entry)}
          aria-pressed={liked}
        >
          <span aria-hidden>{liked ? '♥' : '♡'}</span>
          {liked ? t('liked') : t('like')}
        </button>
        <span>{t('comments')}</span>
      </div>

      <div className="dw-comments">
        {latestComments.length ? latestComments.map(message => {
          const isMine = message.fromUserId === String(game.telegramId || 'self') || message.userName === 'YOU';
          const author = message.userName || (isMine ? t('self') : 'rider');
          return (
            <div className="dw-comment" key={message.id}>
              {isMine ? (
                <div className="dw-comment__author dw-comment__author--self">
                  <CommentAvatar message={message} />
                  <strong>{t('self')}</strong>
                </div>
              ) : (
                <button
                  type="button"
                  className="dw-comment__author"
                  onClick={() => game.openUserProfile(message.fromUserId)}
                  disabled={!game.isInAigram}
                >
                  <CommentAvatar message={message} />
                  <strong>{author}</strong>
                </button>
              )}
              <p>{message.text}</p>
              <time>{timeAgo(message.ts, navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en')}</time>
            </div>
          );
        }) : (
          <p className="dw-comments__empty">{t('noComments')}</p>
        )}
      </div>

      <form className="dw-comment-form" onSubmit={submitComment}>
        <input
          ref={inputRef}
          value={draft}
          onChange={ev => setDraft(ev.target.value)}
          onFocus={focusComposer}
          onBlur={blurComposer}
          maxLength={140}
          placeholder={t('commentPlaceholder')}
        />
        <button type="submit" disabled={!draft.trim()}>{t('sendComment')}</button>
      </form>
    </div>
  );
}

export default function DeckWall() {
  const game = useDeckWall();
  const hasAvatar = !!game.profile?.head_url;
  const activeProductionStep = productionStep(game);
  const productionVariant = (['charcoal', 'cream', 'mint'] as DeckVariant[])[activeProductionStep % 3];
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [commentFocused, setCommentFocused] = useState(false);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (isTypingTarget(ev.target)) return;
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

  useEffect(() => {
    const updateKeyboardInset = () => {
      const vv = window.visualViewport;
      if (!vv) {
        setKeyboardInset(0);
        return;
      }
      const rawInset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardInset(rawInset > 40 ? Math.min(300, Math.ceil(rawInset / Math.max(game.scale, 0.1))) : 0);
    };
    updateKeyboardInset();
    window.visualViewport?.addEventListener('resize', updateKeyboardInset);
    window.visualViewport?.addEventListener('scroll', updateKeyboardInset);
    window.addEventListener('resize', updateKeyboardInset);
    return () => {
      window.visualViewport?.removeEventListener('resize', updateKeyboardInset);
      window.visualViewport?.removeEventListener('scroll', updateKeyboardInset);
      window.removeEventListener('resize', updateKeyboardInset);
    };
  }, [game.scale]);

  useEffect(() => {
    if (!game.selected) setCommentFocused(false);
  }, [game.selected]);

  async function handleGenerate() {
    if (game.generating || !game.profileLoaded || !game.canCraft) return;
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
          '--dw-keyboard-inset': `${keyboardInset}px`,
        } as CSSProperties}
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

          <button
            type="button"
            className={`dw-cta ${!game.canCraft ? 'dw-cta--cooldown' : ''}`}
            onPointerDown={handleGenerate}
            disabled={game.generating || !game.profileLoaded || !game.canCraft}
          >
            <span className="dw-cta__mark">
              {game.generating ? t('generating') : game.canCraft ? t('craftCtaTitle') : t('craftCooldownTitle')}
            </span>
            <span className="dw-cta__copy">
              {game.canCraft
                ? hasAvatar ? t('craftCtaSubAvatar') : t('craftCtaSubBasic')
                : t('craftCooldownSub', { n: formatCooldown(game.cooldownRemainingMs) })}
            </span>
            <span className="dw-cta__arrow" aria-hidden>{game.canCraft ? '→' : '⌁'}</span>
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

            <div className="dw-production__cue">
              <span>{t(productionStepKeys[activeProductionStep])}</span>
              <strong>{t(productionNoteKey(game.elapsedMs) as any)}</strong>
              <div className="dw-production__dots" aria-hidden>
                {productionStepKeys.map((key, index) => (
                  <i
                    key={key}
                    className={index < activeProductionStep ? 'is-done' : index === activeProductionStep ? 'is-active' : ''}
                  />
                ))}
              </div>
            </div>

            <div className="dw-production__meter">
              <span style={{ width: `${productionProgress(game)}%` }} />
            </div>
          </section>
        )}

        {game.selected && (
          <div
            className={`dw-modal ${keyboardInset > 0 || commentFocused ? 'dw-modal--keyboard' : ''}`}
            role="dialog"
            aria-modal="true"
            onClick={() => game.setSelected(null)}
          >
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
              <DetailSocial game={game} entry={game.selected} onInputFocusChange={setCommentFocused} />
            </div>
          </div>
        )}

        <img className="dw-watermark" src={aigramSrc} alt="" draggable={false} />
      </section>
    </main>
  );
}
