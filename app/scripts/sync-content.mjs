import { cp, mkdir, rm } from 'node:fs/promises'
import { resolve } from 'node:path'

const repositoryRoot = resolve(import.meta.dirname, '..', '..')
const source = resolve(repositoryRoot, 'subjects')
const destination = resolve(repositoryRoot, 'app', 'public', 'subjects')

await rm(destination, { recursive: true, force: true })
await mkdir(destination, { recursive: true })
await cp(source, destination, { recursive: true })
