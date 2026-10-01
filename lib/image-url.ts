const configuredImageHosts = new Set([
  "images.unsplash.com",
  "res.cloudinary.com",
]);

export function canUseNextImage(url: string): boolean {
  if (url.startsWith("/")) return true;

  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" && configuredImageHosts.has(parsed.hostname)
    );
  } catch {
    return false;
  }
}
