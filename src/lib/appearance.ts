import type {
  AppearanceSettings,
  BackgroundType,
  SortOrder,
  ThemeMode,
  ThemePreset,
} from "../types";

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "morning",
    name: "晨光",
    note: "暖白与陶土",
    mode: "light",
    accent: "#a3543c",
    background:
      "radial-gradient(circle at 18% 12%, #fdf8ee 0%, transparent 44%), radial-gradient(circle at 84% 9%, #edd3b6 0%, transparent 40%), linear-gradient(135deg, #efe4d2 0%, #e7dac7 52%, #d9cbb8 100%)",
    swatch: ["#f5ecdd", "#d9c3a8"],
  },
  {
    id: "moss",
    name: "青苔",
    note: "雾绿与宣纸",
    mode: "light",
    accent: "#58705a",
    background:
      "radial-gradient(circle at 18% 16%, #f2f1df 0%, transparent 42%), radial-gradient(circle at 90% 92%, #aab7a2 0%, transparent 46%), linear-gradient(145deg, #e5e8da 0%, #d7ddce 50%, #c8d1c0 100%)",
    swatch: ["#e6e9dc", "#b7c1ad"],
  },
  {
    id: "salt",
    name: "海盐",
    note: "雾蓝与清光",
    mode: "light",
    accent: "#4f6e7d",
    background:
      "radial-gradient(circle at 80% 10%, #f5f1e8 0%, transparent 36%), radial-gradient(circle at 15% 94%, #bcccd1 0%, transparent 48%), linear-gradient(150deg, #e7edef 0%, #dbe5e8 48%, #cbd9dd 100%)",
    swatch: ["#e7edf0", "#c4d3d8"],
  },
  {
    id: "persimmon",
    name: "柿秋",
    note: "暖橘与旧纸",
    mode: "light",
    accent: "#a34b36",
    background:
      "radial-gradient(circle at 76% 12%, rgba(205, 134, 91, 0.5) 0%, transparent 40%), radial-gradient(circle at 8% 90%, rgba(255, 246, 230, 0.62) 0%, transparent 46%), linear-gradient(135deg, #eddac9 0%, #e4c8b4 52%, #d4ad97 100%)",
    swatch: ["#f2dfd0", "#cf9b7e"],
  },
  {
    id: "dusk",
    name: "暮色",
    note: "炭棕与余晖",
    mode: "dark",
    accent: "#d3a078",
    background:
      "radial-gradient(circle at 76% 13%, rgba(195, 132, 88, 0.34) 0%, transparent 38%), radial-gradient(circle at 8% 86%, rgba(81, 94, 91, 0.2) 0%, transparent 45%), linear-gradient(150deg, #282521 0%, #3a332d 52%, #1b1d1e 100%)",
    swatch: ["#3c332c", "#17191a"],
  },
  {
    id: "ink",
    name: "深墨",
    note: "墨青与微光",
    mode: "dark",
    accent: "#b5c3b4",
    background:
      "radial-gradient(circle at 82% 10%, rgba(116, 143, 139, 0.28) 0%, transparent 40%), radial-gradient(circle at 9% 88%, rgba(59, 82, 89, 0.28) 0%, transparent 44%), linear-gradient(160deg, #121a1c 0%, #182326 50%, #0b1113 100%)",
    swatch: ["#1d292b", "#0a0f11"],
  },
];

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  mode: "light",
  backgroundType: "preset",
  presetId: "morning",
  solidColor: "#e8ddcb",
  gradientFrom: "#f2e7d7",
  gradientTo: "#d4c1aa",
  gradientAngle: 135,
  backgroundBrightness: 1,
  imageOpacity: 0.72,
  imageBlur: 0,
  imageDim: 0.18,
  sortOrder: "newest",
};

const BACKGROUND_TYPES: BackgroundType[] = [
  "preset",
  "solid",
  "gradient",
  "image",
];

const MODES: ThemeMode[] = ["light", "dark"];
const SORT_ORDERS: SortOrder[] = ["newest", "oldest"];
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function finiteNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  return typeof value === "number" && Number.isFinite(value)
    ? clamp(value, min, max)
    : fallback;
}

function color(value: unknown, fallback: string): string {
  return typeof value === "string" && HEX_COLOR.test(value) ? value : fallback;
}

export function getPreset(presetId: string): ThemePreset {
  return (
    THEME_PRESETS.find((preset) => preset.id === presetId) ?? THEME_PRESETS[0]
  );
}

export function sanitizeAppearance(value: unknown): AppearanceSettings {
  const source =
    value && typeof value === "object"
      ? (value as Partial<AppearanceSettings>)
      : {};

  return {
    mode: MODES.includes(source.mode as ThemeMode)
      ? (source.mode as ThemeMode)
      : DEFAULT_APPEARANCE.mode,
    backgroundType: BACKGROUND_TYPES.includes(
      source.backgroundType as BackgroundType,
    )
      ? (source.backgroundType as BackgroundType)
      : DEFAULT_APPEARANCE.backgroundType,
    presetId: THEME_PRESETS.some((preset) => preset.id === source.presetId)
      ? String(source.presetId)
      : DEFAULT_APPEARANCE.presetId,
    solidColor: color(source.solidColor, DEFAULT_APPEARANCE.solidColor),
    gradientFrom: color(
      source.gradientFrom,
      DEFAULT_APPEARANCE.gradientFrom,
    ),
    gradientTo: color(source.gradientTo, DEFAULT_APPEARANCE.gradientTo),
    gradientAngle: Math.round(
      finiteNumber(
        source.gradientAngle,
        DEFAULT_APPEARANCE.gradientAngle,
        0,
        360,
      ),
    ),
    backgroundBrightness: finiteNumber(
      source.backgroundBrightness,
      DEFAULT_APPEARANCE.backgroundBrightness,
      0.5,
      1.3,
    ),
    imageOpacity: finiteNumber(
      source.imageOpacity,
      DEFAULT_APPEARANCE.imageOpacity,
      0.2,
      1,
    ),
    imageBlur: finiteNumber(
      source.imageBlur,
      DEFAULT_APPEARANCE.imageBlur,
      0,
      24,
    ),
    imageDim: finiteNumber(
      source.imageDim,
      DEFAULT_APPEARANCE.imageDim,
      0,
      0.75,
    ),
    sortOrder: SORT_ORDERS.includes(source.sortOrder as SortOrder)
      ? (source.sortOrder as SortOrder)
      : DEFAULT_APPEARANCE.sortOrder,
  };
}

export function getAccent(appearance: AppearanceSettings): string {
  const preset = getPreset(appearance.presetId);

  if (
    appearance.backgroundType === "preset" &&
    preset.mode === appearance.mode
  ) {
    return preset.accent;
  }

  return appearance.mode === "dark" ? "#d0a07e" : "#9f543d";
}

export function getBaseBackground(appearance: AppearanceSettings): string {
  const preset = getPreset(appearance.presetId);

  switch (appearance.backgroundType) {
    case "solid":
      return appearance.solidColor;
    case "gradient":
      return `linear-gradient(${appearance.gradientAngle}deg, ${appearance.gradientFrom}, ${appearance.gradientTo})`;
    case "image":
      return `linear-gradient(145deg, ${appearance.gradientFrom}, ${appearance.gradientTo})`;
    case "preset":
    default:
      return preset.background;
  }
}
