/** Rasterize only the profile image already displayed in the document. */
export async function readDocumentAvatar(root: HTMLElement) {
  const image = root.querySelector<HTMLImageElement>("img");
  if (!image) return null;
  const url = new URL(image.currentSrc || image.src, window.location.href);
  if (!["https:", "http:", "data:"].includes(url.protocol))
    throw new Error("Unsupported image");
  const response = await fetch(url, {
    credentials: url.origin === window.location.origin ? "same-origin" : "omit",
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error("Profile image is unavailable");
  const blob = await response.blob();
  if (blob.size > 5_000_000) throw new Error("Profile image is too large");
  const objectUrl = URL.createObjectURL(blob);
  const bitmap = new Image();
  try {
    bitmap.src = objectUrl;
    await bitmap.decode();
    const canvas = document.createElement("canvas");
    canvas.width = 192;
    canvas.height = 192;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image conversion is unavailable");
    const side = Math.min(bitmap.naturalWidth, bitmap.naturalHeight);
    context.drawImage(
      bitmap,
      (bitmap.naturalWidth - side) / 2,
      (bitmap.naturalHeight - side) / 2,
      side,
      side,
      0,
      0,
      192,
      192,
    );
    const png = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (value) =>
          value ? resolve(value) : reject(new Error("Image conversion failed")),
        "image/png",
      ),
    );
    return new Uint8Array(await png.arrayBuffer());
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
