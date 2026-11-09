import { readFile } from "node:fs/promises";
import { join } from "node:path";

let cached: Promise<
  { name: string; data: Buffer; weight: 400 | 700; style: "normal" }[]
> | null = null;

export function loadFonts() {
  cached ??= Promise.all([
    readFile(join(process.cwd(), "assets/fonts/BeVietnamPro-Regular.ttf")),
    readFile(join(process.cwd(), "assets/fonts/BeVietnamPro-Bold.ttf")),
  ])
    .then(([regular, bold]) => [
      {
        name: "BeVietnam",
        data: regular,
        weight: 400 as const,
        style: "normal" as const,
      },
      {
        name: "BeVietnam",
        data: bold,
        weight: 700 as const,
        style: "normal" as const,
      },
    ])
    .catch((e) => {
      cached = null;
      throw e;
    });
  return cached;
}
