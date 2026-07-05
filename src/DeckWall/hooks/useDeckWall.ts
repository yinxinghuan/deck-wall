import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  callAigramAPI,
  isInAigram,
  openAigramProfile,
  telegramId,
  type AigramResponse,
} from '@shared/runtime';
import { useGenImage } from '@shared/runtime';
import { useGameSave } from '@shared/save';
import { FIELD_H, FIELD_W, REVIEW_BACK_IMAGE, REVIEW_DECK_IMAGES, type DeckEntry, type DeckSave, type DeckVariant, type ProfileInfo, type SaveRow, type WallEntry } from '../types';

const MAX_MINE = 12;
const MAX_WALL = 24;

const DEFAULT_SAVE: DeckSave = { decks: [], totalGenerated: 0 };
const ALPHA_REF_URL = 'https://images.aiwaves.tech/bag-watermark/alteru_white_1024.png';

const avatarPrompt = [
  'Full-bleed vertical street art graphic for a skateboard deck, using the reference avatar only as raw identity inspiration.',
  'Extract broad traits only: face silhouette, hairstyle direction, expression energy, color temperature, accessory hints, and attitude.',
  'Reinvent those traits as an original underground skate poster character, stencil mask, torn sticker collage, halftone photocopy texture, spray paint overspray, scratches, tape residue, and screenprint registration errors.',
  'The final artwork should feel like a second-generation graphic interpretation of the person, not a pasted avatar and not a literal photo portrait.',
  'Artwork fills the entire rectangular image edge to edge, strongest visual mass centered in the middle vertical strip so a long rounded skateboard mask can crop it cleanly.',
  'Do not preserve the exact face, do not copy the photo composition, do not paste a circular avatar, do not create a photorealistic headshot, do not make a cute caricature.',
  'Do not draw the skateboard outline, do not draw a board silhouette, no surrounding wall background, no black side margins, no wheels, no trucks, not childish, no readable brand logos',
].join(' ');

const basicPrompt = [
  'Full-bleed vertical street art texture for a skateboard deck, simple raw two-color street tag, spray paint, sticker scraps, scratches,',
  'the artwork fills the entire rectangular image edge to edge, strongest tag/detail composition centered in the middle vertical strip so a long rounded skateboard mask can crop it cleanly, underground skate shop wall aesthetic,',
  'do not draw the skateboard outline, do not draw a board silhouette, no surrounding wall background, no black side margins, no wheels, no trucks, no portrait, no readable brand logos',
].join(' ');

function variantForSeed(seed: string): DeckVariant {
  const variants: DeckVariant[] = ['charcoal', 'cream', 'mint'];
  const score = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return variants[score % variants.length];
}

function buildBackPrompt(variant: DeckVariant = 'charcoal') {
  const palette = {
    charcoal: 'matte black deck field, dirty cream alpha mark, one tiny hot pink registration accent, black hardware family',
    cream: 'warm cream deck field, black alpha mark, soft silver scuffs, black micro accents, cream wheel family',
    mint: 'deep black deck field, mint aqua alpha mark, cyan edge glints, restrained white scuffs, mint wheel family',
  }[variant];
  return [
    'Full-bleed vertical skateboard deck BACK graphic, created from the reference AlterU Greek alpha logo.',
    'The alpha logo is the central hero mark but deliberately smaller and more premium: it should occupy about 38 percent of the board height, not fill the whole deck.',
    `Palette version: ${palette}.`,
    'Simpler and more restrained than the color artwork: generous negative space, subtle halftone grain, sparse scratches, premium skate brand identity.',
    'Artwork fills the entire rectangular image edge to edge, strongest logo composition centered in the middle vertical strip so a long rounded skateboard mask can crop it cleanly.',
    'Do not draw the skateboard outline, do not draw a board silhouette, no rounded border, no frame, no inner rim, no edge stroke, no surrounding wall background, no black side margins.',
    'No wheels, no trucks, no screws, no extra text, no readable brand name, not cute, not childish, not cartoon.',
  ].join(' ');
}

function makeId() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return `deck-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function demoDeck(index: number): DeckEntry {
  return {
    id: `demo-deck-${index}`,
    createdAt: Date.now() - index * 90000,
    mode: index % 3 === 0 ? 'basic' : 'avatar',
    imageUrl: REVIEW_DECK_IMAGES[index % REVIEW_DECK_IMAGES.length],
    backImageUrl: REVIEW_BACK_IMAGE,
    prompt: index % 3 === 0 ? basicPrompt : avatarPrompt,
    backPrompt: buildBackPrompt(variantForSeed(`demo-${index}`)),
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

export function useDeckWall() {
  const { savedData, persist } = useGameSave<DeckSave>('deck-wall');
  const gen = useGenImage();
  const [mirror, setMirror] = useState<DeckSave | undefined>(undefined);
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [wall, setWall] = useState<WallEntry[]>([]);
  const [status, setStatus] = useState<'idle' | 'generating' | 'complete' | 'failed'>('idle');
  const [startedAt, setStartedAt] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [generationPhase, setGenerationPhase] = useState<'idle' | 'art' | 'brand' | 'saving'>('idle');
  const [selected, setSelected] = useState<WallEntry | null>(null);
  const [error, setError] = useState('');
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (mirror === undefined && savedData !== undefined) {
      setMirror(savedData ?? DEFAULT_SAVE);
    }
  }, [savedData, mirror]);

  useEffect(() => {
    const compute = () => setScale(Math.min(window.innerWidth / FIELD_W, window.innerHeight / FIELD_H));
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
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

  const refreshWall = useCallback(async () => {
    if (!isInAigram) {
      setWall(makeDemoWall());
      return;
    }
    try {
      const sessionId = (window as any).__GAME_UUID__;
      const res = await callAigramAPI<AigramResponse<SaveRow[]>>(
        `/note/aigram/ai/game/get/data/list?session_id=${encodeURIComponent(sessionId)}`,
        'GET',
      );
      const pairs: Array<{ userId: string; deck: DeckEntry }> = [];
      for (const row of Array.isArray(res?.data) ? res.data : []) {
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
      const ids = Array.from(new Set(limited.map(p => p.userId)));
      const profiles = await Promise.all(ids.map(async id => [id, await fetchProfile(id)] as const));
      const profileMap = new Map(profiles);
      setWall(limited.map(({ userId, deck }) => {
        const p = profileMap.get(userId);
        return {
          ...deck,
          userId,
          userName: p?.name || deck.userName,
          userAvatarUrl: p?.head_url || deck.userAvatarUrl,
        };
      }));
    } catch {
      setWall([]);
    }
  }, []);

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
    const selfEntries: WallEntry[] = mine
      .filter(deck => !cloudIds.has(deck.id))
      .map(deck => ({
        ...deck,
        userId: 'self',
        userName: 'YOU',
        userAvatarUrl: profile?.head_url,
        isSelf: true,
      }));
    return [...selfEntries, ...wall]
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, MAX_WALL);
  }, [mine, wall, profile?.head_url]);

  const stageLabel = useMemo(() => {
    if (status !== 'generating') return '';
    if (generationPhase === 'brand') return 'stageBrand';
    if (generationPhase === 'saving') return 'stageSeal';
    const elapsed = elapsedMs;
    if (elapsed < 35000) return 'stagePrep';
    return 'stageSpray';
  }, [elapsedMs, generationPhase, status]);

  const generateDeck = useCallback(async () => {
    if (!mirror || status === 'generating') return;
    setStatus('generating');
    setStartedAt(Date.now());
    setElapsedMs(0);
    setGenerationPhase('art');
    setError('');
    const hasAvatar = !!profile?.head_url;
    const prompt = hasAvatar ? avatarPrompt : basicPrompt;
    const draftId = makeId();
    const draftCreatedAt = Date.now();
    const wheelVariant = variantForSeed(`${draftId}-${draftCreatedAt}`);
    try {
      const imageUrl = await gen.generate({
        prompt,
        ...(hasAvatar ? { ref_url: profile!.head_url! } : {}),
      });
      setGenerationPhase('brand');
      const backPrompt = buildBackPrompt(wheelVariant);
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
      const next: DeckSave = {
        ...mirror,
        decks: [deck, ...mirror.decks].slice(0, MAX_MINE),
        totalGenerated: (mirror.totalGenerated || 0) + 1,
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
  }, [gen, mirror, persist, profile, refreshWall, status]);

  const openAuthor = useCallback((entry: WallEntry) => {
    if (!isInAigram || entry.isSelf || !entry.userId || entry.userId === 'self') return;
    openAigramProfile(entry.userId);
  }, []);

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
    selected,
    setSelected,
    error,
    scale,
    generateDeck,
    openAuthor,
    generating: gen.loading || status === 'generating',
  };
}
