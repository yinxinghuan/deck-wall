import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  callAigramAPI,
  isInAigram,
  openAigramProfile,
  telegramId,
  type AigramResponse,
} from '@shared/runtime';
import { useGameEvent, useGenImage } from '@shared/runtime';
import { useGameSave } from '@shared/save';
import {
  appendMessage,
  guestbookNotifyConfig,
  messagesByTarget,
  newId,
  newMessage,
  threadFor,
  type GuestMessage,
} from '../../shared/social/guestbook';
import { FIELD_H, FIELD_W, REVIEW_BACK_IMAGE, REVIEW_DECK_IMAGES, type DeckEntry, type DeckLike, type DeckSave, type DeckVariant, type ProfileInfo, type SaveRow, type WallEntry } from '../types';

const MAX_MINE = 12;
const MAX_WALL = 24;
const MAX_LIKES_STORED = 80;
const CRAFT_COOLDOWN_MS = 12 * 60 * 60 * 1000;

const DEFAULT_SAVE: DeckSave = { decks: [], totalGenerated: 0 };
const ALPHA_REF_URL = 'https://images.aiwaves.tech/bag-watermark/alteru_white_1024.png';

function nameGraphicLine(userName?: string) {
  const clean = (userName || '').replace(/[{}<>"'`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 24);
  if (!clean) {
    return 'If no usable rider name is available, do not invent text; use abstract sticker typography instead.';
  }
  return [
    `Optional rider-name material: "${clean}".`,
    'Treat the name as graphic raw material, not as a plain caption: it may become initials, cropped block letters, vertical type, sideways type, sticker fragments, stencil cuts, or partial decorative typography.',
    'Keep any name-derived typography near the center vertical zone so the skateboard clipping keeps it visible, but it does not need to be perfectly readable.',
  ].join(' ');
}

function creativeBriefFor(seed: string) {
  const score = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const directions = [
    'masked rider stencil with torn wheat-paste layers and aggressive eye-shape abstraction',
    'punk sticker-bomb collage with fragmented face geometry, safety-label fragments, and marker scrawls',
    'photocopy zine portrait energy with hard halftone, scratched ink, and warped typography',
    'night-market spray tag composition with neon overspray, chipped paint, and vertical symbol stack',
    'garage-band poster texture with cropped eyes, sharp stencil shadows, and registration misprint color fields',
    'old skate-shop counter sticker sheet with peeled corners, barcode scraps, and rough screenprint blocks',
  ];
  const compositions = [
    'central vertical mask, large negative-space band across the lower third, small sticker fragments near both rails',
    'oversized cropped face fragment in the upper half, diagonal tape tear through the center, dense marks near the tail',
    'big abstract icon in the middle, repeated initials as background texture, high-contrast tag near the nose',
    'split-column layout: one bold silhouette stripe, one noisy collage stripe, and a centered focal mark',
    'poster-like title block pushed through the center, with the strongest detail between 38% and 62% of image height',
    'asymmetric vertical stack, heavy dark shape on one side, bright scuffed highlight on the opposite side',
  ];
  const palettes = [
    'hot pink, dirty cream, black carbon, and cyan registration accents',
    'acid green, smoke black, off-white paper, and one electric blue scrape',
    'faded red, photocopy gray, tar black, and yellow warning-label accents',
    'mint aqua, deep purple-black, bone white, and magenta spray dust',
    'sun-bleached orange, asphalt black, pale teal, and cream sticker paper',
    'cobalt blue, chalk white, charcoal, and small neon lime marks',
  ];
  const materials = [
    'spray paint bloom, torn stickers, knife scratches, paper glue, and halftone dots',
    'screenprint overprint, photocopy grain, rubbed wax, chipped enamel, and tape residue',
    'paint marker strokes, scuffed varnish, stencil overspray, old label adhesive, and dust',
    'wet ink drag, cracked paper, thumb-smudged toner, sticker edges, and scraped deck-shop texture',
    'rough risograph noise, misregistered color plates, black marker cuts, and peeled paper fibers',
    'sun-faded paste-up texture, grit, staple holes, printer streaks, and layered sticker ghosts',
  ];
  const pick = <T,>(items: T[], offset: number) => items[(score + offset) % items.length];
  return [
    `Creative variation seed: ${seed}.`,
    `Direction: ${pick(directions, 0)}.`,
    `Composition: ${pick(compositions, 2)}.`,
    `Palette: ${pick(palettes, 4)}.`,
    `Material language: ${pick(materials, 6)}.`,
    'Make this generation clearly distinct from other decks by changing the main silhouette, composition, color balance, and typography placement.',
  ].join(' ');
}

function avatarPromptFor(userName?: string, seed = 'avatar-default') {
  return [
  'Full-bleed vertical rectangular street art graphic intended to be clipped by the app into a skateboard later, using the reference avatar only as raw identity inspiration.',
  'Extract broad traits only: face silhouette, hairstyle direction, expression energy, color temperature, accessory hints, and attitude.',
  'Reinvent those traits as an original underground skate poster character, stencil mask, torn sticker collage, halftone photocopy texture, spray paint overspray, scratches, tape residue, and screenprint registration errors.',
  creativeBriefFor(seed),
  nameGraphicLine(userName),
  'The final artwork should feel like a second-generation graphic interpretation of the person, not a pasted avatar and not a literal photo portrait.',
  'Artwork fills the entire rectangular image edge to edge, with the strongest visual mass centered in the middle vertical strip.',
  'Do not preserve the exact face, do not copy the photo composition, do not paste a circular avatar, do not create a photorealistic headshot, do not make a cute caricature.',
  'Do not include any pre-cut outer shape, object silhouette, border, frame, surrounding wall background, black side margins, wheels, trucks, childish styling, or readable brand logos.',
  ].join(' ');
}

function basicPromptFor(userName?: string, seed = 'basic-default') {
  return [
  'Full-bleed vertical rectangular street art texture intended to be clipped by the app into a skateboard later, simple raw two-color street tag, spray paint, sticker scraps, scratches,',
  creativeBriefFor(seed),
  nameGraphicLine(userName),
  'the artwork fills the entire rectangular image edge to edge, strongest tag/detail composition centered in the middle vertical strip, underground skate shop wall aesthetic,',
  'do not include any pre-cut outer shape, object silhouette, border, frame, surrounding wall background, black side margins, wheels, trucks, portrait, or readable brand logos',
  ].join(' ');
}

const avatarPrompt = avatarPromptFor();
const basicPrompt = basicPromptFor();

function variantForSeed(seed: string): DeckVariant {
  const variants: DeckVariant[] = ['charcoal', 'cream', 'mint'];
  const score = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return variants[score % variants.length];
}

function brandBriefFor(seed: string) {
  const score = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const layouts = [
    'logo mark sits slightly above center with a wide quiet field below',
    'logo mark is centered but ghosted behind a subtle vertical varnish streak',
    'logo mark is smaller and lower, with sparse scuffs near the nose',
    'logo mark is offset by a few percent with a faint diagonal screenprint shadow',
    'logo mark appears as a restrained ink stamp under a translucent worn clear coat',
  ];
  const accents = [
    'one tiny registration dot near the upper truck zone',
    'two hairline scratches crossing the lower third',
    'a subtle edge glow along one rail',
    'faint halftone fading toward the tail',
    'a small worn-paper scuff near the centerline',
  ];
  return `${layouts[score % layouts.length]}; ${accents[(score + 3) % accents.length]}.`;
}

function buildBackPrompt(variant: DeckVariant = 'charcoal', seed = 'brand-default') {
  const palette = {
    charcoal: 'matte black field, dirty cream platform logo mark, one tiny hot pink registration accent, black hardware family',
    cream: 'warm cream field, black platform logo mark, soft silver scuffs, black micro accents, cream wheel family',
    mint: 'deep black field, mint aqua platform logo mark, cyan edge glints, restrained white scuffs, mint wheel family',
  }[variant];
  return [
    'Full-bleed vertical rectangular brand-side graphic, created from the reference AlterU platform logo image.',
    'Use the reference logo shape as the central hero mark, but deliberately smaller and more premium: it should occupy about 28 percent of the image height, not fill the whole artwork.',
    `Palette version: ${palette}.`,
    `Brand-side layout variation: ${brandBriefFor(seed)}`,
    'Simpler and more restrained than the color artwork: generous negative space, subtle halftone grain, sparse scratches, premium skate brand identity.',
    'Artwork fills the entire rectangular image edge to edge, strongest logo composition centered in the middle vertical strip.',
    'Do not include any pre-cut outer shape, object silhouette, rounded border, frame, inner rim, edge stroke, surrounding wall background, or black side margins.',
    'No invented alphabet letter, no substitute symbol, no wheels, no trucks, no screws, no extra text, no readable brand name, not cute, not childish, not cartoon.',
  ].join(' ');
}

function makeId() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return `deck-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function absoluteImageUrl(url: string) {
  return url.startsWith('http') ? url : new URL(url, document.baseURI).href;
}

function preloadImage(url: string): Promise<void> {
  return new Promise(resolve => {
    const image = new Image();
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve();
    };
    const timer = window.setTimeout(finish, 16000);
    image.onload = () => {
      if ('decode' in image) {
        image.decode().then(finish).catch(finish);
      } else {
        finish();
      }
    };
    image.onerror = finish;
    image.src = absoluteImageUrl(url);
  });
}

function demoDeck(index: number): DeckEntry {
  return {
    id: `demo-deck-${index}`,
    createdAt: Date.now() - index * 90000,
    mode: index % 3 === 0 ? 'basic' : 'avatar',
    imageUrl: REVIEW_DECK_IMAGES[index % REVIEW_DECK_IMAGES.length],
    backImageUrl: REVIEW_BACK_IMAGE,
    prompt: index % 3 === 0 ? basicPrompt : avatarPrompt,
    backPrompt: buildBackPrompt(variantForSeed(`demo-${index}`), `demo-${index}-brand`),
    hasAvatar: index % 3 !== 0,
    wheelVariant: variantForSeed(`demo-${index}`),
    userId: `demo-${index}`,
    userName: ['Maya', 'Jun', 'Rae', 'Noor', 'Ari', 'Lux', 'Theo', 'Iris'][index % 8],
  };
}

function makeDemoWall(): WallEntry[] {
  return Array.from({ length: 12 }, (_, index) => ({
    ...demoDeck(index),
    userId: `demo-${index}`,
    userName: ['Maya', 'Jun', 'Rae', 'Noor', 'Ari', 'Lux', 'Theo', 'Iris'][index % 8],
  }));
}

async function fetchProfile(userId: string): Promise<ProfileInfo | null> {
  try {
    const res = await callAigramAPI<AigramResponse<ProfileInfo>>(
      `/note/telegram/user/get/info/by/telegram_id?telegram_id=${encodeURIComponent(userId)}`,
      'GET',
    );
    return res?.data ?? null;
  } catch {
    return null;
  }
}

function stampedMessages(
  grouped: Map<string, GuestMessage[]>,
  profileMap: Map<string, ProfileInfo | null>,
): Map<string, GuestMessage[]> {
  const next = new Map<string, GuestMessage[]>();
  grouped.forEach((messages, target) => {
    next.set(target, messages.map(message => {
      const p = message.fromUserId ? profileMap.get(message.fromUserId) : null;
      return {
        ...message,
        userName: p?.name || message.userName,
        userAvatarUrl: p?.head_url || message.userAvatarUrl,
      };
    }));
  });
  return next;
}

function likesByTarget(rows: SaveRow[]): Map<string, DeckLike[]> {
  const grouped = new Map<string, DeckLike[]>();
  for (const row of rows) {
    if (!row?.user_id || !row.resource_data) continue;
    let save: DeckSave;
    try {
      save = JSON.parse(row.resource_data) as DeckSave;
    } catch {
      continue;
    }
    for (const like of save.likes || []) {
      if (!like?.id || !like.target) continue;
      const stamped: DeckLike = { ...like, fromUserId: row.user_id };
      const bucket = grouped.get(like.target);
      if (bucket) bucket.push(stamped);
      else grouped.set(like.target, [stamped]);
    }
  }
  return grouped;
}

function stampedLikes(
  grouped: Map<string, DeckLike[]>,
  profileMap: Map<string, ProfileInfo | null>,
): Map<string, DeckLike[]> {
  const next = new Map<string, DeckLike[]>();
  grouped.forEach((likes, target) => {
    next.set(target, likes.map(like => {
      const p = like.fromUserId ? profileMap.get(like.fromUserId) : null;
      return {
        ...like,
        userName: p?.name || like.userName,
        userAvatarUrl: p?.head_url || like.userAvatarUrl,
      };
    }));
  });
  return next;
}

function uniqueLikesFor(
  target: string,
  grouped: Map<string, DeckLike[]>,
  myLikes: DeckLike[] | undefined,
  myUserId?: string | null,
): DeckLike[] {
  const byUser = new Map<string, DeckLike>();
  const myKey = myUserId || 'self';
  const myHasLike = (myLikes || []).some(like => like.target === target);
  for (const like of grouped.get(target) || []) {
    if ((like.fromUserId || like.id) === myKey && !myHasLike) continue;
    byUser.set(like.fromUserId || like.id, like);
  }
  for (const like of myLikes || []) {
    if (like.target !== target) continue;
    byUser.set(myKey, { ...like, fromUserId: like.fromUserId ?? myKey });
  }
  return [...byUser.values()].sort((a, b) => b.ts - a.ts);
}

export function useDeckWall() {
  const { savedData, persist } = useGameSave<DeckSave>('deck-wall');
  const { trigger } = useGameEvent();
  const gen = useGenImage();
  const [mirror, setMirror] = useState<DeckSave | undefined>(undefined);
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [wall, setWall] = useState<WallEntry[]>([]);
  const [messageThreads, setMessageThreads] = useState<Map<string, GuestMessage[]>>(new Map());
  const [likeThreads, setLikeThreads] = useState<Map<string, DeckLike[]>>(new Map());
  const [status, setStatus] = useState<'idle' | 'generating' | 'complete' | 'failed'>('idle');
  const [startedAt, setStartedAt] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [generationPhase, setGenerationPhase] = useState<'idle' | 'art' | 'brand' | 'saving'>('idle');
  const [selected, setSelected] = useState<WallEntry | null>(null);
  const [error, setError] = useState('');
  const [scale, setScale] = useState(1);
  const [nowMs, setNowMs] = useState(Date.now());
  const notifiedMessages = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (mirror === undefined && savedData !== undefined) {
      setMirror(savedData ?? DEFAULT_SAVE);
    }
  }, [savedData, mirror]);

  useEffect(() => {
    const compute = () => {
      const vv = window.visualViewport;
      const root = document.getElementById('root')?.getBoundingClientRect();
      const width = Math.max(1, Math.min(
        vv?.width || window.innerWidth,
        root?.width || window.innerWidth,
      ));
      const height = Math.max(1, Math.min(
        vv?.height || window.innerHeight,
        root?.height || window.innerHeight,
      ));
      setScale(Math.min(width / FIELD_W, height / FIELD_H));
    };
    compute();
    window.addEventListener('resize', compute);
    window.addEventListener('orientationchange', compute);
    window.visualViewport?.addEventListener('resize', compute);
    window.visualViewport?.addEventListener('scroll', compute);
    return () => {
      window.removeEventListener('resize', compute);
      window.removeEventListener('orientationchange', compute);
      window.visualViewport?.removeEventListener('resize', compute);
      window.visualViewport?.removeEventListener('scroll', compute);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isInAigram || !telegramId) {
        if (!cancelled) {
          setProfile(null);
          setProfileLoaded(true);
        }
        return;
      }
      const p = await fetchProfile(String(telegramId));
      if (!cancelled) {
        setProfile(p);
        setProfileLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const mine = mirror?.decks ?? [];
  const cooldownRemainingMs = Math.max(0, (mirror?.lastGeneratedAt || 0) + CRAFT_COOLDOWN_MS - nowMs);
  const canCraft = cooldownRemainingMs <= 0;

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const refreshWall = useCallback(async () => {
    if (!isInAigram) {
      const demo = makeDemoWall().map((entry, index) => ({
        ...entry,
        likeCount: 6 + index,
        commentCount: index % 3,
      }));
      setWall(demo);
      setMessageThreads(new Map([
        ['demo-deck-0', [
          {
            id: 'demo-message-0',
            target: 'demo-deck-0',
            text: '这块像旧贴纸被撕开以后又重新喷了一层。',
            ts: Date.now() - 1000 * 60 * 8,
            fromUserId: 'demo-note-0',
            userName: 'Noor',
          },
        ]],
      ]));
      setLikeThreads(new Map([
        ['demo-deck-0', [
          { id: 'demo-like-0', target: 'demo-deck-0', ts: Date.now() - 1000 * 60 * 5, fromUserId: 'demo-note-1', userName: 'Maya' },
          { id: 'demo-like-1', target: 'demo-deck-0', ts: Date.now() - 1000 * 60 * 15, fromUserId: 'demo-note-2', userName: 'Jun' },
        ]],
      ]));
      return;
    }
    try {
      const sessionId = (window as any).__GAME_UUID__;
      const res = await callAigramAPI<AigramResponse<SaveRow[]>>(
        `/note/aigram/ai/game/get/data/list?session_id=${encodeURIComponent(sessionId)}`,
        'GET',
      );
      const rows = Array.isArray(res?.data) ? res.data : [];
      const pairs: Array<{ userId: string; deck: DeckEntry }> = [];
      for (const row of rows) {
        if (!row.user_id || !row.resource_data) continue;
        try {
          const save = JSON.parse(row.resource_data) as DeckSave;
          for (const deck of save.decks || []) {
            if (deck?.id && deck.imageUrl) pairs.push({ userId: row.user_id, deck });
          }
        } catch {
          /* skip corrupt saves */
        }
      }
      pairs.sort((a, b) => (b.deck.createdAt || 0) - (a.deck.createdAt || 0));
      const limited = pairs.slice(0, MAX_WALL);
      const rawMessages = messagesByTarget(rows.filter((row): row is { user_id: string; resource_data: string } => !!row.user_id && !!row.resource_data));
      const rawLikes = likesByTarget(rows);
      const allInteractorIds = new Set<string>();
      rawMessages.forEach(messages => messages.forEach(message => {
        if (message.fromUserId) allInteractorIds.add(message.fromUserId);
      }));
      rawLikes.forEach(likes => likes.forEach(like => {
        if (like.fromUserId) allInteractorIds.add(like.fromUserId);
      }));
      const ids = Array.from(new Set([...limited.map(p => p.userId), ...allInteractorIds]));
      const profiles = await Promise.all(ids.map(async id => [id, await fetchProfile(id)] as const));
      const profileMap = new Map(profiles);
      const stampedMessageMap = stampedMessages(rawMessages, profileMap);
      const stampedLikeMap = stampedLikes(rawLikes, profileMap);
      setMessageThreads(stampedMessageMap);
      setLikeThreads(stampedLikeMap);
      setWall(limited.map(({ userId, deck }) => {
        const p = profileMap.get(userId);
        const comments = stampedMessageMap.get(deck.id) || [];
        const likes = uniqueLikesFor(deck.id, stampedLikeMap, mirror?.likes, telegramId ? String(telegramId) : null);
        return {
          ...deck,
          userId,
          userName: p?.name || deck.userName,
          userAvatarUrl: p?.head_url || deck.userAvatarUrl,
          likeCount: likes.length,
          commentCount: comments.length,
          likedByMe: likes.some(like => like.fromUserId === String(telegramId || 'self')),
        };
      }));
    } catch {
      setWall([]);
    }
  }, [mirror?.likes]);

  useEffect(() => {
    refreshWall().catch(() => {});
  }, [refreshWall]);

  useEffect(() => {
    if (status !== 'generating' || !startedAt) return;
    const tick = () => setElapsedMs(Date.now() - startedAt);
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [status, startedAt]);

  const mergedWall = useMemo(() => {
    const cloudIds = new Set(wall.map(item => item.id));
    const myUserId = telegramId ? String(telegramId) : 'self';
    const selfEntries: WallEntry[] = mine
      .filter(deck => !cloudIds.has(deck.id))
      .map(deck => ({
        ...deck,
        userId: 'self',
        userName: 'YOU',
        userAvatarUrl: profile?.head_url,
        isSelf: true,
        likeCount: uniqueLikesFor(deck.id, likeThreads, mirror?.likes, myUserId).length,
        commentCount: threadFor(deck.id, messageThreads, mirror?.messages, myUserId).length,
        likedByMe: (mirror?.likes || []).some(like => like.target === deck.id),
      }));
    const stampedWall = wall.map(entry => {
      const likes = uniqueLikesFor(entry.id, likeThreads, mirror?.likes, myUserId);
      const comments = threadFor(entry.id, messageThreads, mirror?.messages, myUserId);
      return {
        ...entry,
        likeCount: likes.length,
        commentCount: comments.length,
        likedByMe: likes.some(like => like.fromUserId === myUserId),
      };
    });
    return [...selfEntries, ...stampedWall]
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, MAX_WALL);
  }, [likeThreads, messageThreads, mine, mirror?.likes, mirror?.messages, profile?.head_url, wall]);

  const stageLabel = useMemo(() => {
    if (status !== 'generating') return '';
    if (generationPhase === 'brand') return 'stageBrand';
    if (generationPhase === 'saving') return 'stageSeal';
    const elapsed = elapsedMs;
    if (elapsed < 35000) return 'stagePrep';
    return 'stageSpray';
  }, [elapsedMs, generationPhase, status]);

  const generateDeck = useCallback(async () => {
    if (!mirror || status === 'generating' || !canCraft) return;
    setStatus('generating');
    setStartedAt(Date.now());
    setElapsedMs(0);
    setGenerationPhase('art');
    setError('');
    const draftId = makeId();
    const draftCreatedAt = Date.now();
    const seed = `${draftId}-${draftCreatedAt}`;
    const hasAvatar = !!profile?.head_url;
    const prompt = hasAvatar ? avatarPromptFor(profile?.name, seed) : basicPromptFor(profile?.name, seed);
    const wheelVariant = variantForSeed(`${draftId}-${draftCreatedAt}`);
    try {
      const imageUrl = await gen.generate({
        prompt,
        ...(hasAvatar ? { ref_url: profile!.head_url! } : {}),
      });
      setGenerationPhase('brand');
      const backPrompt = buildBackPrompt(wheelVariant, `${seed}-brand`);
      const backImageUrl = await gen.generate({
        prompt: backPrompt,
        ref_url: ALPHA_REF_URL,
      });
      setGenerationPhase('saving');
      const now = Date.now();
      const deck: DeckEntry = {
        id: draftId,
        createdAt: now,
        mode: hasAvatar ? 'avatar' : 'basic',
        imageUrl,
        backImageUrl,
        prompt,
        backPrompt,
        hasAvatar,
        wheelVariant,
        userId: telegramId || 'self',
        userName: profile?.name,
        userAvatarUrl: profile?.head_url,
      };
      await Promise.all([
        preloadImage(deck.imageUrl),
        preloadImage(deck.backImageUrl || REVIEW_BACK_IMAGE),
      ]);
      const next: DeckSave = {
        ...mirror,
        decks: [deck, ...mirror.decks].slice(0, MAX_MINE),
        totalGenerated: (mirror.totalGenerated || 0) + 1,
        lastGeneratedAt: now,
      };
      setMirror(next);
      persist(next);
      setSelected({ ...deck, userId: 'self', isSelf: true });
      setStatus('complete');
      setGenerationPhase('idle');
      setTimeout(() => refreshWall().catch(() => {}), 1400);
    } catch (e) {
      setStatus('failed');
      setGenerationPhase('idle');
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [canCraft, gen, mirror, persist, profile, refreshWall, status]);

  const myUserId = telegramId ? String(telegramId) : 'self';

  const commentsFor = useCallback((entry: WallEntry | null): GuestMessage[] => {
    if (!entry) return [];
    return threadFor(entry.id, messageThreads, mirror?.messages, myUserId).map(message => (
      message.fromUserId === myUserId
        ? { ...message, userName: 'YOU', userAvatarUrl: profile?.head_url }
        : message
    ));
  }, [messageThreads, mirror?.messages, myUserId, profile?.head_url]);

  const likesFor = useCallback((entry: WallEntry | null): DeckLike[] => {
    if (!entry) return [];
    return uniqueLikesFor(entry.id, likeThreads, mirror?.likes, myUserId).map(like => (
      like.fromUserId === myUserId
        ? { ...like, userName: 'YOU', userAvatarUrl: profile?.head_url }
        : like
    ));
  }, [likeThreads, mirror?.likes, myUserId, profile?.head_url]);

  const hasLiked = useCallback((entry: WallEntry | null): boolean => {
    if (!entry) return false;
    return likesFor(entry).some(like => like.fromUserId === myUserId);
  }, [likesFor, myUserId]);

  const toggleLike = useCallback((entry: WallEntry) => {
    if (!entry?.id) return;
    setMirror(prev => {
      const base = prev ?? mirror ?? DEFAULT_SAVE;
      const alreadyLiked = (base.likes || []).some(like => like.target === entry.id);
      const nextLikes = alreadyLiked
        ? (base.likes || []).filter(like => like.target !== entry.id)
        : [
            {
              id: newId(),
              target: entry.id,
              toUserId: entry.isSelf ? undefined : entry.userId,
              ts: Date.now(),
            },
            ...(base.likes || []),
          ].slice(0, MAX_LIKES_STORED);
      const next: DeckSave = { ...base, likes: nextLikes };
      persist(next);
      return next;
    });
  }, [mirror, persist]);

  const sendComment = useCallback((entry: WallEntry, text: string) => {
    if (!entry?.id) return false;
    const msg = newMessage(entry.id, entry.isSelf ? undefined : entry.userId, text);
    if (!msg) return false;

    setMirror(prev => {
      const base = prev ?? mirror ?? DEFAULT_SAVE;
      const next = appendMessage(base, msg);
      persist(next);
      return next;
    });

    if (!entry.isSelf && entry.userId && entry.userId !== myUserId && !notifiedMessages.current.has(entry.id)) {
      notifiedMessages.current.add(entry.id);
      trigger(
        'deck_wall_note',
        guestbookNotifyConfig({
          toUserId: entry.userId,
          refUrl: entry.imageUrl?.startsWith('http')
            ? entry.imageUrl
            : new URL(entry.imageUrl, document.baseURI).href,
          template: '{sender_name} left a mark on your deck',
          imagePrompt: 'A street skateboard wall notification, premium skate deck detail, social note energy.',
          note: msg.text,
        }),
      );
    }

    setTimeout(() => refreshWall().catch(() => {}), 800);
    return true;
  }, [mirror, myUserId, persist, refreshWall, trigger]);

  const openAuthor = useCallback((entry: WallEntry) => {
    if (!isInAigram || entry.isSelf || !entry.userId || entry.userId === 'self') return;
    openAigramProfile(entry.userId);
  }, []);

  const openUserProfile = useCallback((userId?: string) => {
    if (!isInAigram || !userId || userId === 'self' || userId === myUserId) return;
    openAigramProfile(userId);
  }, [myUserId]);

  return {
    profile,
    profileLoaded,
    isInAigram,
    telegramId,
    mine,
    wall: mergedWall,
    status,
    stageLabel,
    elapsedMs,
    generationPhase,
    canCraft,
    cooldownRemainingMs,
    selected,
    setSelected,
    error,
    scale,
    commentsFor,
    likesFor,
    hasLiked,
    toggleLike,
    sendComment,
    generateDeck,
    openAuthor,
    openUserProfile,
    generating: gen.loading || status === 'generating',
  };
}
