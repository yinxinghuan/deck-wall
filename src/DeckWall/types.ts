export const FIELD_W = 390;
export const FIELD_H = 680;

export type DeckMode = 'avatar' | 'basic';
export type DeckStatus = 'idle' | 'generating' | 'complete' | 'failed';

export interface DeckEntry {
  id: string;
  createdAt: number;
  mode: DeckMode;
  imageUrl: string;
  backImageUrl?: string;
  prompt: string;
  backPrompt?: string;
  hasAvatar: boolean;
  userId: string;
  userName?: string;
  userAvatarUrl?: string;
}

export interface DeckSave {
  decks: DeckEntry[];
  totalGenerated: number;
  _lastActive?: number;
}

export interface ProfileInfo {
  name?: string;
  head_url?: string;
}

export interface SaveRow {
  user_id?: string;
  resource_data?: string;
  time?: string;
}

export interface WallEntry extends DeckEntry {
  userId: string;
  userName?: string;
  userAvatarUrl?: string;
  isSelf?: boolean;
}

export const REVIEW_DECK_SHEET = './img/review-deck-sheet.jpg';
export const REVIEW_DECK_IMAGES = Array.from(
  { length: 12 },
  (_, index) => `./img/review-decks/deck-${String(index).padStart(2, '0')}.jpg`,
);
export const REVIEW_GENERATED_DECK_IMAGE = './img/review-decks/generated-preview-00.png';
export const REVIEW_BACK_IMAGE = './img/review-back.svg';
