/**
 * Resizes and re-encodes an image in the browser before upload.
 *
 * Phone photos are frequently 5-15 MB at full resolution, which is far more
 * than this gallery needs. Shrinking them client-side cuts the number of bytes
 * sent over the network (usually by 5-10x), which is the main driver of upload
 * time.
 */

// Longest edge of the resulting image. 2560px keeps plenty of detail for a
// web photo gallery while drastically reducing file size.
const MAX_DIMENSION = 2560;
const JPEG_QUALITY = 0.95;

export async function compressImage(file: File): Promise<File> {
  // Only attempt to compress raster images we can decode. Leave anything else
  // (e.g. SVG, HEIC the browser can't decode) untouched.
  if (!file.type.startsWith("image/")) {
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    // `imageOrientation: "from-image"` bakes in EXIF rotation so portrait
    // phone photos don't end up sideways after re-encoding.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // If the browser can't decode it, fall back to the original file.
    return file;
  }

  const { width, height } = bitmap;
  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  const targetWidth = Math.round(width * scale);
  const targetHeight = Math.round(height * scale);

  try {
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return file;
    }
    // JPEG has no alpha channel — without this, transparent regions (e.g.
    // PNG logos) encode as black. Flatten onto white instead.
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );

    if (!blob || blob.size >= file.size) {
      // Compression didn't help (e.g. already small/optimized) — keep original.
      return file;
    }

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } finally {
    bitmap.close();
  }
}
