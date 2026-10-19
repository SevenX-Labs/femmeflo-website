const MAX_SIZE_BYTES = 1024 * 1024; // 1 MB
const MAX_DIMENSION = 1920;
const INITIAL_QUALITY = 0.85;
const MIN_QUALITY = 0.3;
const QUALITY_STEP = 0.1;

export async function compressImageToWebp(file: File | Blob): Promise<File> {
  const bitmap = await createImageBitmap(file);

  let width = bitmap.width;
  let height = bitmap.height;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = INITIAL_QUALITY;
  let blob = await canvas.convertToBlob({ type: "image/webp", quality });

  while (blob.size > MAX_SIZE_BYTES && quality > MIN_QUALITY) {
    quality -= QUALITY_STEP;
    blob = await canvas.convertToBlob({ type: "image/webp", quality });
  }

  const originalName =
    file instanceof File ? file.name.replace(/\.[^.]+$/, "") : "photo";

  return new File([blob], `${originalName}.webp`, { type: "image/webp" });
}
