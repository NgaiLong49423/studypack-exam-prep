import { readdir, readFile } from 'node:fs/promises'
import { resolve, relative } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const source = resolve(root, 'subjects')
const artifact = resolve(root, 'app', 'dist', 'subjects')

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async (entry) => entry.isDirectory()
    ? filesIn(resolve(directory, entry.name))
    : [resolve(directory, entry.name)]))
  return nested.flat()
}

const sourceFiles = await filesIn(source)
const artifactFiles = await filesIn(artifact)
const sourceRelative = sourceFiles.map((file) => relative(source, file)).sort()
const artifactRelative = artifactFiles.map((file) => relative(artifact, file)).sort()
if (JSON.stringify(sourceRelative) !== JSON.stringify(artifactRelative)) throw new Error('Pages artifact content file list does not match subjects/.')

for (const file of sourceRelative) {
  const [sourceContent, artifactContent] = await Promise.all([readFile(resolve(source, file)), readFile(resolve(artifact, file))])
  if (!sourceContent.equals(artifactContent)) throw new Error(`Pages artifact content differs from subjects/: ${file}`)
}

console.log(`Deploy artifact verification: ${sourceRelative.length} subject content file(s) match.`)
