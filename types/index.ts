export interface Game {
  id: string;
  name: string;
  appId: string;
  imageUrl?: string | null;
  createdAt: string;
  _count?: { keys: number };
}

export interface ActivationKey {
  id: string;
  key: string;
  appId: string;
  gameName?: string | null;
  used: boolean;
  usedBy?: string | null;
  usedAt?: string | null;
  createdAt: string;
}
