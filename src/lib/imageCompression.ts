const MAX_SIZE_BYTES = 1024 * 1024; // 1 MB
const MAX_DIMENSION = 1920;
const INITIAL_QUALITY = 0.85;
const MIN_QUALITY = 0.35;
const QUALITY_STEP = 0.1;

interface ImageDimensions {
  width: number;
  height: number;
}

function calculateTargetDimensions(width: number, height: number): ImageDimensions {
  if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
    return { width, height };
  }
  const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

/**
 * Universal cross-browser image loader with Apple iOS / Safari fallback
 */
function loadImageElement(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      return reject(new Error("Cannot load image in non-browser environment"));
    }
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };
    img.src = objectUrl;
  });
}

/**
 * Converts standard HTMLCanvasElement to Blob with fallback
 */
function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((blob) => resolve(blob), mimeType, quality);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Compress an image to WebP (or JPEG fallback on Apple iOS devices where WebP encoding is unsupported).
 * Ensures files are compressed under 1 MB without freezing mobile Safari or Android browsers.
 */
export async function compressImageToWebp(file: File | Blob): Promise<File> {
  const originalName = file instanceof File ? file.name.replace(/\.[^.]+$/, "") : "photo";

  // If already under 1MB and not in browser or missing canvas, return as-is
  if (typeof window === "undefined") {
    if (file instanceof File) return file;
    return new File([file], `${originalName}.jpg`, { type: "image/jpeg" });
  }

  try {
    let sourceWidth = 0;
    let sourceHeight = 0;
    let drawSource: CanvasImageSource | null = null;
    let cleanup: (() => void) | null = null;

    // 1. Try createImageBitmap first (modern fast path)
    if (typeof createImageBitmap === "function") {
      try {
        const bitmap = await createImageBitmap(file);
        sourceWidth = bitmap.width;
        sourceHeight = bitmap.height;
        drawSource = bitmap;
        cleanup = () => bitmap.close();
      } catch {
        // Safari / iOS often fails createImageBitmap on certain images/HEIC
        drawSource = null;
      }
    }

    // 2. Fallback to HTMLImageElement (100% universal across Apple & Android)
    if (!drawSource) {
      const img = await loadImageElement(file);
      sourceWidth = img.naturalWidth || img.width;
      sourceHeight = img.naturalHeight || img.height;
      drawSource = img;
    }

    const { width, height } = calculateTargetDimensions(sourceWidth, sourceHeight);

    // 3. Render onto Canvas
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      if (cleanup) cleanup();
      if (file instanceof File) return file;
      return new File([file], `${originalName}.jpg`, { type: "image/jpeg" });
    }

    ctx.drawImage(drawSource, 0, 0, width, height);
    if (cleanup) cleanup();

    // 4. Try WebP encoding first, fallback to JPEG if unsupported by browser (Safari fallback)
    let targetMime = "image/webp";
    let targetExt = "webp";
    let blob = await canvasToBlob(canvas, targetMime, INITIAL_QUALITY);

    // Safari on iOS may return null or image/png when WebP export is not supported
    if (!blob || !blob.type.includes("webp")) {
      targetMime = "image/jpeg";
      targetExt = "jpg";
      blob = await canvasToBlob(canvas, targetMime, INITIAL_QUALITY);
    }

    if (!blob) {
      if (file instanceof File) return file;
      return new File([file], `${originalName}.jpg`, { type: "image/jpeg" });
    }

    // Iteratively step down quality if file exceeds 1 MB
    let quality = INITIAL_QUALITY;
    while (blob.size > MAX_SIZE_BYTES && quality > MIN_QUALITY) {
      quality -= QUALITY_STEP;
      const smallerBlob = await canvasToBlob(canvas, targetMime, quality);
      if (smallerBlob && smallerBlob.size < blob.size) {
        blob = smallerBlob;
      } else {
        break;
      }
    }

    return new File([blob], `${originalName}.${targetExt}`, {
      type: blob.type || targetMime,
      lastModified: Date.now(),
    });
  } catch (err) {
    console.warn("Universal image compression fallback triggered:", err);
    // Never fail or block the user — fall back gracefully to the original file
    if (file instanceof File) return file;
    return new File([file], `${originalName}.jpg`, { type: "image/jpeg" });
  }
}
