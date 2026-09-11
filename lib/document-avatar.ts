/** Rasterize only the profile image already displayed in the document. */
export async function readDocumentAvatar(
  root: HTMLElement,
  signal?: AbortSignal,
) {
  const image = root.querySelector<HTMLImageElement>("img");
  if (!image) return null;
  return readDocumentImage(image, signal);
}

export async function readDocumentImage(
  image: HTMLImageElement,
  signal?: AbortSignal,
) {
  const url = new URL(image.currentSrc || image.src, window.location.href);
  if (!["https:", "http:", "data:"].includes(url.protocol))
    throw new Error("Unsupported image");
  const response = await fetch(url, {
    credentials: url.origin === window.location.origin ? "same-origin" : "omit",
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(5000)])
      : AbortSignal.timeout(5000),
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
    const ratio = Math.min(
      1,
      1200 / Math.max(bitmap.naturalWidth, bitmap.naturalHeight),
    );
    canvas.width = Math.max(1, Math.round(bitmap.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(bitmap.naturalHeight * ratio));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image conversion is unavailable");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
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
