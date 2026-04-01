import { existsSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFilePath = fileURLToPath(import.meta.url);
const scriptsDirectory = path.dirname(currentFilePath);
const projectRoot = path.resolve(scriptsDirectory, "..");

const generatedPaths = [
  path.join(projectRoot, ".next"),
  path.join(projectRoot, "tsconfig.tsbuildinfo")
];

for (const generatedPath of generatedPaths) {
  if (!existsSync(generatedPath)) {
    continue;
  }

  rmSync(generatedPath, { recursive: true, force: true });
}
