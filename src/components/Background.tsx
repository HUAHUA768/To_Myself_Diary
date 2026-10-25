import type { AppearanceSettings, BackgroundImage } from "../types";
import { getBaseBackground } from "../lib/appearance";

interface BackgroundProps {
  appearance: AppearanceSettings;
  image: BackgroundImage | null;
}

export function Background({ appearance, image }: BackgroundProps) {
  const base = getBaseBackground(appearance);
  const isImageMode = appearance.backgroundType === "image";
  const showImage = isImageMode && image !== null;
  const applyBaseBrightness =
    appearance.backgroundType === "solid" ||
    appearance.backgroundType === "gradient";

  return (
    <div className="ambient" aria-hidden="true">
      <div
        className="ambient-base"
        style={{
          background: base,
          filter: applyBaseBrightness
            ? `brightness(${appearance.backgroundBrightness})`
            : undefined,
        }}
      />
      {showImage ? (
        <>
          <div
            className="ambient-photo"
            style={{
              backgroundImage: `url("${image.dataUrl}")`,
              opacity: appearance.imageOpacity,
              filter: `blur(${appearance.imageBlur}px)`,
              transform: `scale(${1.035 + appearance.imageBlur / 220})`,
            }}
          />
          <div
            className="ambient-photo-shade"
            style={{ opacity: appearance.imageDim }}
          />
        </>
      ) : null}
      <div className="ambient-vignette" />
      <div className="ambient-grain" />
    </div>
  );
}
