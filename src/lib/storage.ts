import { createStore, del, get, set } from "idb-keyval";
import type {
  AppearanceSettings,
  BackgroundImage,
  NoteDocument,
} from "../types";
import {
  DEFAULT_APPEARANCE,
  sanitizeAppearance,
} from "./appearance";
import { normalizeDocument } from "./document";

const store = createStore("to-myself-local", "documents");

const NOTEBOOK_KEY = "notebook-v1";
const BACKGROUND_IMAGE_KEY = "background-image-v1";
const APPEARANCE_KEY = "to-myself:appearance:v1";

export async function loadNotebook(): Promise<NoteDocument | null> {
  const value = await get<unknown>(NOTEBOOK_KEY, store);
  if (!value) return null;
  return normalizeDocument(value);
}

export async function saveNotebook(notebook: NoteDocument): Promise<void> {
  await set(NOTEBOOK_KEY, notebook, store);
}

export async function loadBackgroundImage(): Promise<BackgroundImage | null> {
  const value = await get<unknown>(BACKGROUND_IMAGE_KEY, store);
  if (
    value &&
    typeof value === "object" &&
    "dataUrl" in value &&
    typeof value.dataUrl === "string" &&
    value.dataUrl.startsWith("data:image/")
  ) {
    return {
      dataUrl: value.dataUrl,
      name:
        "name" in value && typeof value.name === "string"
          ? value.name
          : "自定义背景",
    };
  }

  return null;
}

export async function saveBackgroundImage(
  image: BackgroundImage,
): Promise<void> {
  await set(BACKGROUND_IMAGE_KEY, image, store);
}

export async function removeBackgroundImage(): Promise<void> {
  await del(BACKGROUND_IMAGE_KEY, store);
}

export function loadAppearance(): AppearanceSettings {
  try {
    const raw = window.localStorage.getItem(APPEARANCE_KEY);
    if (!raw) return DEFAULT_APPEARANCE;
    return sanitizeAppearance(JSON.parse(raw));
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export function saveAppearance(appearance: AppearanceSettings): void {
  try {
    window.localStorage.setItem(APPEARANCE_KEY, JSON.stringify(appearance));
  } catch {
    // The visible save indicator still reflects the notebook itself.
  }
}
