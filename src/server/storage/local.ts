import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const ROOT = path.join(process.cwd(), "storage/local");

export function storagePath(key: string) {
  if (!key || key.startsWith("/") || key.includes("\0")) {
    throw new Error("Ogiltig fillagringsnyckel");
  }
  const root = path.resolve(ROOT);
  const full = path.resolve(root, key);
  if (full !== root && !full.startsWith(root + path.sep)) {
    throw new Error("Ogiltig fillagringsnyckel");
  }
  return full;
}

export async function putLocalFile(key: string, bytes: Buffer) {
  const full = storagePath(key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, bytes);
  return key;
}

export async function getLocalFile(key: string) {
  try {
    return await readFile(storagePath(key));
  } catch {
    return null;
  }
}
