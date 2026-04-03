export interface Highlight {
  id: string;
  text: string;
  color: string;
  containerSelector: string;
  createdAt: number;
}

export interface StorageData {
  highlights: Record<string, Highlight[]>;
}

export interface Message {
  type: string;
  payload?: any;
}