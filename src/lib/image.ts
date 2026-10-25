import type { BackgroundImage } from "../types";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_DIMENSION = 2560;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("图片读取失败。"));
    reader.onerror = () => reject(new Error("图片读取失败。"));
    reader.readAsDataURL(file);
  });
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("无法识别这张图片。"));
    image.src = source;
  });
}

export async function prepareBackgroundImage(
  file: File,
): Promise<BackgroundImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error("请选择图片文件（JPG、PNG、WebP 等）。");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("图片不能超过 20MB，请换一张小一点的照片。");
  }

  const originalDataUrl = await readAsDataUrl(file);
  const image = await loadImage(originalDataUrl);
  const scale = Math.min(
    1,
    MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight),
  );
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    if (originalDataUrl.length < 6_000_000) {
      return { dataUrl: originalDataUrl, name: file.name };
    }
    throw new Error("浏览器无法处理这张图片。");
  }

  context.fillStyle = "#1d1915";
  context.fillRect(0, 0, width, height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, width, height);

  let dataUrl = canvas.toDataURL("image/webp", 0.86);
  if (!dataUrl.startsWith("data:image/webp")) {
    dataUrl = canvas.toDataURL("image/jpeg", 0.86);
  }

  if (!dataUrl.startsWith("data:image/")) {
    throw new Error("图片处理失败，请换一张试试。");
  }

  return {
    dataUrl,
    name: file.name.slice(0, 140) || "自定义背景",
  };
}
