
export enum ArtStyle {
  ANIME_2D = 'Anime 2D Cổ Điển',
  RENDER_3D = '3D Render Sống Động',
  WATERCOLOR = 'Màu Nước Nghệ Thuật',
  MANGA = 'Manga Đen Trắng',
  CHIBI = 'Chibi Dễ Thương'
}

export enum ViewAngle {
  FRONT = 'Góc Chính Diện',
  SIDE = 'Góc Nghiêng',
  BACK = 'Phía Sau',
  TURNAROUND = 'Bảng Thiết Kế (Turnaround Sheet)',
  DYNAMIC = 'Góc Động (Dynamic)'
}

export interface CharacterConfig {
  style: ArtStyle;
  view: ViewAngle;
  gender: string;
  hairStyle: string;
  hairColor: string;
  eyeColor: string;
  clothing: string;
  accessories: string;
  pose: string;
  customPose?: string; // New: For free posing
  background: string;
  expression: string;
  lightingStyle: string; // New: Lighting direction/style
  lightingColor: string; // New: Lighting color tone
  effects: string; // New: Special visual effects
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  createdAt: number;
  rotationSet?: string[]; // Stores [Front, Side, Back] URLs for 360 view
}

export interface SavedPreset {
  id: string;
  name: string;
  config: CharacterConfig;
  createdAt: number;
}

export type LogLevel = 'info' | 'success' | 'warning' | 'error';

export interface LogEntry {
  id: string;
  timestamp: number;
  message: string;
  level: LogLevel;
  details?: string; // Optional detailed info (e.g. full prompt or error stack)
}
