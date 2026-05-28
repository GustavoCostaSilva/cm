import fs from 'node:fs'
import path from 'node:path'

// Files are stored on the VPS disk (the app runs as a persistent process).
// Override with UPLOADS_DIR; defaults to <project>/data/uploads.
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), 'data', 'uploads')

function clientDir(clientId: string): string {
  const dir = path.join(UPLOADS_DIR, clientId)
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function saveFile(clientId: string, storedName: string, data: Buffer): void {
  fs.writeFileSync(path.join(clientDir(clientId), storedName), data)
}

export function readFileBuffer(clientId: string, storedName: string): Buffer {
  return fs.readFileSync(path.join(clientDir(clientId), storedName))
}

export function deleteFile(clientId: string, storedName: string): void {
  try {
    fs.unlinkSync(path.join(clientDir(clientId), storedName))
  } catch {
    /* already gone */
  }
}

export function fileExists(clientId: string, storedName: string): boolean {
  return fs.existsSync(path.join(clientDir(clientId), storedName))
}
