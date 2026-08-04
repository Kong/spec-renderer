import { chmod, copyFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pc from 'picocolors'

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const cliDistDir = path.join(rootDir, 'dist', 'cli')

await mkdir(path.join(cliDistDir, 'preview-page'), { recursive: true })
await copyFile(
  path.join(rootDir, 'cli', 'preview-page', 'index.html'),
  path.join(cliDistDir, 'preview-page', 'index.html'),
)
await chmod(path.join(cliDistDir, 'index.js'), 0o755)

console.log(`${pc.green('✔')} CLI assets copied and dist/cli/index.js made executable.`)
console.log(`${pc.cyan('i')} Run it locally with: ${pc.bold('node dist/cli/index.js preview <path-to-spec-or-url>')}`)
