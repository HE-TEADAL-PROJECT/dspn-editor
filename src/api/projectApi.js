export async function browseDir(dirPath = '') {
  const res = await fetch(`/api/browse?path=${encodeURIComponent(dirPath)}`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function getAllFiles(dirPath = '') {
  const entries = await browseDir(dirPath)
  const files = []
  for (const e of entries) {
    if (e.isDir) files.push(...await getAllFiles(e.path))
    else files.push(e)
  }
  return files
}

export async function readFile(filePath) {
  const res = await fetch(`/api/file?path=${encodeURIComponent(filePath)}`)
  if (!res.ok) throw new Error(await res.text())
  return res.text()
}

export async function createFile(filePath) {
  const blank = '<?xml version="1.0" encoding="UTF-8"?>\n<diagram>\n  <elements/>\n  <connections/>\n</diagram>\n'
  const res = await fetch('/api/file', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: filePath, content: blank, overwrite: false }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? res.statusText)
  }
}

export async function createDir(dirPath) {
  const res = await fetch('/api/mkdir', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: dirPath }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? res.statusText)
  }
}

export async function deleteEntry(entryPath) {
  const res = await fetch(`/api/entry?path=${encodeURIComponent(entryPath)}`, { method: 'DELETE' })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? res.statusText)
  }
}

export async function renameEntry(oldPath, newPath) {
  const res = await fetch('/api/rename', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldPath, newPath }),
  })
  if (!res.ok) throw new Error(await res.text())
}

export async function writeFile(filePath, content) {
  const res = await fetch('/api/file', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: filePath, content }),
  })
  if (!res.ok) throw new Error(await res.text())
}
