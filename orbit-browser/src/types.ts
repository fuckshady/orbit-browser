export interface Tab {
  id: string;
  space: string;
  url: string;
  title: string;
  favicon?: string;
  loading?: boolean;
  back?: boolean;
  forward?: boolean;
  error?: string;
}
export interface Space {
  id: string;
  name: string;
  icon: string;
  wallpaper: string;
  accent: string;
}
export interface Link {
  id: string;
  name: string;
  url: string;
}
export interface Settings {
  appearanceMode: "classic" | "adaptive";
  glassColorSource: "wallpaper" | "manual";
  glassColor: string;
  glassTransparency: number;
  glassIntensity: number;
  glassBlur: number;
  theme: string;
  engine: string;
  accent: string;
  opacity: number;
  animations: boolean;
  verticalTabs: boolean;
  links: Link[];
  aiEndpoint: string;
  aiModel: string;
}
export interface RecordItem {
  id: string;
  url: string;
  title: string;
  date: number;
  favicon?: string;
  space?: string;
  folder?: string;
}
export interface Download {
  id: string;
  name: string;
  path: string;
  received: number;
  total: number;
  state: string;
  paused: boolean;
  speed: number;
}
export interface SavedWallpaper {
  id: string;
  name: string;
  src: string;
  page: string;
  resolution: string;
  date: number;
}
export interface WallhavenResult {
  id: string;
  thumbnail: string;
  page: string;
  width: number;
  height: number;
  resolution: string;
}
export interface WallhavenSearch {
  items: WallhavenResult[];
  page: number;
  pages: number;
  total: number;
  seed?: string;
}
export interface State {
  wallpapers: SavedWallpaper[];
  tabs: Tab[];
  active: string;
  space: string;
  spaces: Space[];
  settings: Settings;
  history: RecordItem[];
  bookmarks: RecordItem[];
  downloads: Download[];
  aiConfigured: boolean;
}
export interface OrbitAPI {
  call(action: string, payload?: unknown): Promise<any>;
  subscribe(fn: (s: State) => void): () => void;
  shortcut(fn: (s: string) => void): () => void;
}
declare global {
  interface Window {
    orbit: OrbitAPI;
  }
}
