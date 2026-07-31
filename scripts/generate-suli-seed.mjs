import { mkdir, writeFile } from "node:fs/promises";
import { createSuliProfile } from "../src/core/seeds/suliProfile.js";

const targetDirectory = new URL("../seeds/", import.meta.url);
const targetFile = new URL("suli-operating-system.json", targetDirectory);

await mkdir(targetDirectory, { recursive: true });
await writeFile(targetFile, `${JSON.stringify(createSuliProfile(), null, 2)}\n`, "utf8");

console.log(`Generated ${targetFile.pathname}`);

