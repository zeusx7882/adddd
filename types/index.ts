export interface Game {
  id: string;
  name: string;
  appId: string;
  createdAt: string;
  _count?: { keys: number };
}

export interface Key {
  id: string;
  key: string;
  gameId: string;
  status: "AVAILABLE" | "USED";
  createdAt: string;
}
