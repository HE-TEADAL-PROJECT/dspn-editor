import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT ?? 3001

const PROJECT_ROOT = path.resolve(process.env.PROJECT_ROOT ?? path.join(__dirname, '..', 'projects'))

app.use(cors())
app.use(express.json())

// Serve built frontend in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist')
  app.use(express.static(distPath))
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

function safePath(rel) {
  const resolved = path.resolve(PROJECT_ROOT, rel || '.')
  if (!resolved.startsWith(PROJECT_ROOT)) throw new Error('Path traversal denied')
  return resolved
}

// GET /api/browse?path=
app.get('/api/browse', (req, res) => {
  let abs
  try {
    abs = safePath(req.query.path || '')
  } catch {
    return res.status(400).json({ error: 'Invalid path' })
  }
  try {
    const entries = fs.readdirSync(abs, { withFileTypes: true })
    const result = []
    for (const e of entries) {
      if (e.isDirectory()) {
        result.push({ name: e.name, path: path.relative(PROJECT_ROOT, path.join(abs, e.name)), isDir: true })
      } else if (e.isFile() && e.name.endsWith('.xml')) {
        result.push({ name: e.name, path: path.relative(PROJECT_ROOT, path.join(abs, e.name)), isDir: false })
      }
    }
    result.sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    res.json(result)
  } catch (e) {
    res.status(404).json({ error: 'Directory not found' })
  }
})

// GET /api/file?path=
app.get('/api/file', (req, res) => {
  let abs
  try {
    abs = safePath(req.query.path || '')
  } catch {
    return res.status(400).json({ error: 'Invalid path' })
  }
  try {
    const content = fs.readFileSync(abs, 'utf-8')
    res.type('application/xml').send(content)
  } catch {
    res.status(404).json({ error: 'File not found' })
  }
})

// POST /api/file { path, content, overwrite? }
app.post('/api/file', (req, res) => {
  const { path: relPath, content, overwrite = true } = req.body
  let abs
  try {
    abs = safePath(relPath)
  } catch {
    return res.status(400).json({ error: 'Invalid path' })
  }
  if (!overwrite && fs.existsSync(abs)) {
    return res.status(409).json({ error: `A file named "${path.basename(abs)}" already exists.` })
  }
  try {
    fs.writeFileSync(abs, content, 'utf-8')
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/mkdir { path }
app.post('/api/mkdir', (req, res) => {
  const { path: relPath } = req.body
  let abs
  try { abs = safePath(relPath) } catch { return res.status(400).json({ error: 'Invalid path' }) }
  if (fs.existsSync(abs)) {
    return res.status(409).json({ error: `A folder named "${path.basename(abs)}" already exists.` })
  }
  try {
    fs.mkdirSync(abs, { recursive: true })
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST /api/rename { oldPath, newPath }
app.post('/api/rename', (req, res) => {
  const { oldPath, newPath } = req.body
  let absOld, absNew
  try {
    absOld = safePath(oldPath)
    absNew = safePath(newPath)
  } catch {
    return res.status(400).json({ error: 'Invalid path' })
  }
  if (fs.existsSync(absNew)) {
    return res.status(409).json({ error: `A file named "${path.basename(absNew)}" already exists.` })
  }
  try {
    fs.renameSync(absOld, absNew)
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// DELETE /api/entry?path=
app.delete('/api/entry', (req, res) => {
  let abs
  try { abs = safePath(req.query.path || '') } catch { return res.status(400).json({ error: 'Invalid path' }) }
  try {
    const stat = fs.statSync(abs)
    if (stat.isDirectory()) fs.rmSync(abs, { recursive: true })
    else fs.unlinkSync(abs)
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.listen(PORT, () => {
  console.log(`Project server running on http://localhost:${PORT}`)
  console.log(`Project root: ${PROJECT_ROOT}`)
})
