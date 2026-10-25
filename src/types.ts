export type ThemeMode = "light" | "dark";
export type BackgroundType = "preset" | "solid" | "gradient" | "image";
export type SortOrder = "newest" | "oldest";
export type SaveState = "idle" | "saving" | "saved" | "error";

export interface NoteEntry {
  date: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoteDocument {
  version: 1;
  title: string;
  entries: NoteEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface AppearanceSettings {
  mode: ThemeMode;
  backgroundType: BackgroundType;
  presetId: string;
  solidColor: string;
  gradientFrom: string;
  gradientTo: string;
  gradientAngle: number;
  backgroundBrightness: number;
  imageOpacity: number;
  imageBlur: number;
  imageDim: number;
  sortOrder: SortOrder;
}

export interface ThemePreset {
  id: string;
  name: string;
  note: string;
  mode: ThemeMode;
  accent: string;
  background: string;
  swatch: [string, string];
}

export interface BackgroundImage {
  dataUrl: string;
  name: string;
}

export interface JsonBackup {
  format: "to-myself-backup";
  version: 1;
  exportedAt: string;
  notebook: NoteDocument;
  appearance: AppearanceSettings;
  backgroundImage: BackgroundImage | null;
}

export type ParsedImport =
  | {
      kind: "json";
      notebook: NoteDocument;
      appearance?: AppearanceSettings;
      backgroundImage?: BackgroundImage | null;
    }
  | {
      kind: "markdown";
      notebook: NoteDocument;
    };

export interface ToastMessage {
  id: number;
  message: string;
  tone?: "default" | "success" | "error";
}
