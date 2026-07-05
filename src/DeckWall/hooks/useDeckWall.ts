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
import { FIELD_H, FIELD_W, REVIEW_DECK_IMAGES, type DeckEntry, type DeckSave, type ProfileInfo, type SaveRow, type WallEntry } from '../types';

const MAX_MINE = 12;
const MAX_WALL = 24;

const DEFAULT_SAVE: DeckSave = { decks: [], totalGenerated: 0 };

const avatarPrompt = [
  'Edge-to-edge vertical skateboard deck graphic crop, adult underground street art, gritty spray paint portrait inspired by the reference face,',
  'no visible board outline, no surrounding wall background, the artwork fills the entire tall frame, sticker collage, halftone photocopy texture, scratches, tape residue,',
  'premium board graphic, full deck artwork surface, no wheels, no black side margins, not cute, not childish, not cartoon, no readable brand logos',
].join(' ');

const basicPrompt = [
  'Edge-to-edge vertical skateboard deck graphic crop, simple raw two-color street tag, spray paint, sticker scraps, scratches,',
  'no visible board outline, no surrounding wall background, the artwork fills the entire tall frame, underground skate shop wall aesthetic,',
  'full deck artwork surface, no wheels, no black side margins, no portrait, no readable brand logos',
].join(' ');

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
    prompt: index % 3 === 0 ? basicPrompt : avatarPrompt,
    hasAvatar: index % 3 !== 0,
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
    const elapsed = Date.now() - startedAt;
    if (elapsed < 35000) return 'stagePrep';
    if (elapsed < 120000) return 'stageSpray';
    return 'stageSeal';
  }, [status, startedAt]);

  const generateDeck = useCallback(async () => {
    if (!mirror || status === 'generating') return;
    setStatus('generating');
    setStartedAt(Date.now());
    setError('');
    const hasAvatar = !!profile?.head_url;
    const prompt = hasAvatar ? avatarPrompt : basicPrompt;
    try {
      const imageUrl = await gen.generate({
        prompt,
        ...(hasAvatar ? { ref_url: profile!.head_url! } : {}),
      });
      const now = Date.now();
      const deck: DeckEntry = {
        id: makeId(),
        createdAt: now,
        mode: hasAvatar ? 'avatar' : 'basic',
        imageUrl,
        prompt,
        hasAvatar,
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
      setTimeout(() => refreshWall().catch(() => {}), 1400);
    } catch (e) {
      setStatus('failed');
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
    selected,
    setSelected,
    error,
    scale,
    generateDeck,
    openAuthor,
    generating: gen.loading || status === 'generating',
  };
}
