import type { Area } from "react-easy-crop";

const AVATAR_MAX_SIZE = 200;
const AVATAR_JPEG_QUALITY = 0.7;

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => reject(new Error("Failed to load image")));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

/** Crop, resize to max 200×200, and return a compressed base64 JPEG data URL for Firestore. */
export async function getCroppedAvatarDataUrl(imageSrc: string, pixelCrop: Area): Promise<string> {
  const image = await createImage(imageSrc);
  const outputSize = Math.min(Math.min(pixelCrop.width, pixelCrop.height), AVATAR_MAX_SIZE);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  canvas.width = outputSize;
  canvas.height = outputSize;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize
  );

  return canvas.toDataURL("image/jpeg", AVATAR_JPEG_QUALITY);
}
