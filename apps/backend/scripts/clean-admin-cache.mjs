import { rm } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, "..")

const targets = [
  path.join(root, "node_modules", ".vite"),
  path.join(root, "public", "admin"),
]

for (const target of targets) {
  await rm(target, { recursive: true, force: true })
  console.log(`Cleared ${path.relative(root, target)}`)
}
