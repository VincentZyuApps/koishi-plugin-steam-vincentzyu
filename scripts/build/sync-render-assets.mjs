import { cp, mkdir, rm } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..', '..')
const source = resolve(root, 'src', 'render')
const target = resolve(root, 'lib', 'render')

await rm(target, { recursive: true, force: true })
await mkdir(target, { recursive: true })
await cp(resolve(source, 'templates'), resolve(target, 'templates'), { recursive: true })
await cp(resolve(source, 'styles'), resolve(target, 'styles'), { recursive: true })
