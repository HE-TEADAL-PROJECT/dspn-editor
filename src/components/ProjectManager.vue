<template>
  <div class="project-manager">
    <input ref="importInput" type="file" accept=".xml" style="display:none" @change="onImportSelected">

    <div class="pm-header">
      <span class="pm-title">Project</span>
    </div>

    <div class="pm-toolbar">
      <div class="tb-row">
        <button class="tb-btn" title="New file" @click="newFile">
          <i class="fa-regular fa-file-circle-plus"></i>
        </button>
        <button class="tb-btn" title="New folder" @click="newFolder">
          <i class="fa-solid fa-folder-plus"></i>
        </button>
        <button class="tb-btn" title="Import file from disk" @click="importInput.click()">
          <i class="fa-solid fa-file-import"></i>
        </button>
        <button class="tb-btn" title="Open file" :disabled="!selectedEntry || selectedEntry.isDir" @click="onOpenFile(selectedEntry.path)">
          <i class="fa-regular fa-folder-open"></i>
        </button>
      </div>
      <div class="tb-row">
        <button class="tb-btn" title="Duplicate file" :disabled="!selectedEntry || selectedEntry.isDir" @click="duplicateSelected">
          <i class="fa-regular fa-copy"></i>
        </button>
        <button class="tb-btn" title="Rename" :disabled="!selectedEntry" @click="renameSelected">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
        <button class="tb-btn tb-btn--danger" title="Delete file" :disabled="!selectedEntry || selectedEntry.isDir" @click="deleteSelected">
          <i class="fa-regular fa-file-excel"></i>
        </button>
        <button class="tb-btn tb-btn--danger" title="Delete folder" :disabled="!selectedEntry || !selectedEntry.isDir" @click="deleteSelected">
          <i class="fa-solid fa-folder-minus"></i>
        </button>
      </div>
    </div>

    <div
      class="pm-tree"
      :class="{ 'drop-target': isRootDragOver }"
      @dragover.prevent="isRootDragOver = true"
      @dragleave="isRootDragOver = false"
      @drop.stop="onRootDrop"
    >
      <FileTreeNode
        v-for="entry in rootEntries"
        :key="entry.path"
        :entry="entry"
        :refresh-signal="refreshSignal"
        :selected-path="selectedEntry?.path ?? null"
        @open-file="onOpenFile"
        @select="selectedEntry = $event"
        @move-file="onMoveFile"
      />
      <div v-if="rootEntries.length === 0" class="pm-no-files">No files found.</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import FileTreeNode from './FileTreeNode.vue'
import { browseDir, getAllFiles, readFile, writeFile, createFile, createDir, deleteEntry, renameEntry } from '../api/projectApi.js'

const emit = defineEmits(['open-file', 'project-changed', 'file-renamed', 'files-changed'])

const rootEntries = ref([])
const selectedEntry = ref(null)
const refreshSignal = ref(0)
const importInput = ref(null)
const isRootDragOver = ref(false)

async function refreshTree() {
  rootEntries.value = await browseDir('')
  refreshSignal.value++
  try {
    const files = await getAllFiles('')
    emit('files-changed', files)
  } catch (e) {
    console.error('getAllFiles failed', e)
  }
}

onMounted(async () => {
  try {
    await refreshTree()
    emit('project-changed', '')
  } catch {
    // server not available
  }
})

// Compute the directory to create items in:
// - if a dir is selected → inside it
// - if a file is selected → alongside it
// - nothing selected → root
const targetDir = computed(() => {
  if (!selectedEntry.value) return ''
  if (selectedEntry.value.isDir) return selectedEntry.value.path
  const parts = selectedEntry.value.path.split('/')
  parts.pop()
  return parts.join('/')
})

async function newFile() {
  const name = prompt('File name:', 'diagram.xml')
  if (!name) return
  const filename = name.endsWith('.xml') ? name : name + '.xml'
  const filePath = targetDir.value ? `${targetDir.value}/${filename}` : filename
  try {
    await createFile(filePath)
    await refreshTree()
  } catch (e) {
    alert('Could not create file: ' + e.message)
  }
}

async function newFolder() {
  const name = prompt('Folder name:')
  if (!name) return
  const dirPath = targetDir.value ? `${targetDir.value}/${name}` : name
  try {
    await createDir(dirPath)
    await refreshTree()
  } catch (e) {
    alert('Could not create folder: ' + e.message)
  }
}

async function deleteSelected() {
  if (!selectedEntry.value) return
  const label = selectedEntry.value.isDir ? 'folder' : 'file'
  if (!confirm(`Delete ${label} "${selectedEntry.value.name}"?`)) return
  try {
    await deleteEntry(selectedEntry.value.path)
    selectedEntry.value = null
    await refreshTree()
  } catch (e) {
    alert('Could not delete: ' + e.message)
  }
}

async function onImportSelected(event) {
  const file = event.target.files[0]
  if (!file) return
  event.target.value = ''
  const text = await file.text()
  const filePath = targetDir.value ? `${targetDir.value}/${file.name}` : file.name
  try {
    await writeFile(filePath, text)
    await refreshTree()
  } catch (e) {
    alert('Could not import file: ' + e.message)
  }
}

async function onMoveFile({ fromPath, toDir }) {
  isRootDragOver.value = false
  const fileName = fromPath.split('/').pop()
  const newPath = toDir ? `${toDir}/${fileName}` : fileName
  if (newPath === fromPath) return
  try {
    await renameEntry(fromPath, newPath)
    emit('file-renamed', { oldPath: fromPath, newPath, newName: fileName })
    await refreshTree()
  } catch (e) {
    alert('Could not move file: ' + e.message)
  }
}

function onRootDrop(event) {
  isRootDragOver.value = false
  const fromPath = event.dataTransfer.getData('text/plain')
  if (!fromPath) return
  const parts = fromPath.split('/')
  if (parts.length === 1) return  // already at root
  onMoveFile({ fromPath, toDir: '' })
}

async function duplicateSelected() {
  if (!selectedEntry.value || selectedEntry.value.isDir) return
  const original = selectedEntry.value
  const nameParts = original.name.replace(/\.xml$/i, '')
  const dir = original.path.includes('/') ? original.path.split('/').slice(0, -1).join('/') : ''
  const newName = nameParts + ' copy.xml'
  const newPath = dir ? `${dir}/${newName}` : newName
  try {
    const content = await readFile(original.path)
    await createFile(newPath)
    await writeFile(newPath, content)
    await refreshTree()
  } catch (e) {
    alert('Could not duplicate file: ' + e.message)
  }
}

async function renameSelected() {
  if (!selectedEntry.value) return
  const newName = prompt('New name:', selectedEntry.value.name)
  if (!newName || newName === selectedEntry.value.name) return
  await onRenameFile({ entry: selectedEntry.value, newName })
}

async function onRenameFile({ entry, newName }) {
  const parts = entry.path.split('/')
  parts[parts.length - 1] = newName.endsWith('.xml') ? newName : newName + '.xml'
  const newPath = parts.join('/')
  try {
    await renameEntry(entry.path, newPath)
    emit('file-renamed', { oldPath: entry.path, newPath, newName: parts[parts.length - 1] })
    await refreshTree()
  } catch (e) {
    alert('Could not rename: ' + e.message)
  }
}

async function onOpenFile(filePath) {
  try {
    const xmlText = await readFile(filePath)
    const fileName = filePath.split('/').pop()
    emit('open-file', { xmlText, fileName, serverPath: filePath })
  } catch (e) {
    alert('Could not read file: ' + e.message)
  }
}
</script>

<style scoped>
.project-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
  font-family: inherit;
}

.pm-header {
  padding: 6px 8px;
  border-bottom: 1px solid #c5d8ee;
  background: #2a5298;
  border-radius: 6px 6px 0 0;
}

.pm-title {
  font-size: 12px;
  font-weight: 600;
  color: #e0eaf8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.pm-toolbar {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 3px 4px;
  border-bottom: 1px solid #c5d8ee;
  background: #dde8f5;
}

.tb-row {
  display: flex;
  gap: 2px;
  background: transparent;
}

.tb-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 3px 6px;
  border-radius: 3px;
  font-size: 13px;
  color: #2a4f7a;
  line-height: 1;
}
.tb-btn:hover:not(:disabled) { background: #b8d0ea; color: #1a3a5c; }
.tb-btn:disabled { color: #aac0d8; cursor: default; }
.tb-btn--danger:hover:not(:disabled) { background: #fde8e8; color: #c00; }

.pm-tree { padding: 4px; overflow-y: auto; flex: 1; background: #f0f5fa; border-radius: 0 0 6px 6px; }
.pm-tree.drop-target { background: #d0e8f8; outline: 2px dashed #2a5298; outline-offset: -3px; }
.pm-no-files { font-size: 12px; color: #88a8c8; padding: 8px 4px; }
</style>
