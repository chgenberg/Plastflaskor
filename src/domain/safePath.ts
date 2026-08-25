/** Relative in-app path only. Blocks open redirects (`//evil`, `https://…`). */
export function safeInternalPath(value: string | null | undefined, fallback = "/") {
  if (!value) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (value.includes("://") || value.includes("\\")) return fallback;
  return value;
}

export function contentDisposition(filename: string, inline: boolean) {
  const safe = filename.replace(/[\r\n"]/g, "_").slice(0, 180) || "fil";
  return `${inline ? "inline" : "attachment"}; filename="${safe}"`;
}
