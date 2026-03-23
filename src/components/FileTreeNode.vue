<template>
  <div class="tree-node">
    <!-- Directory row -->
    <div
      v-if="entry.isDir"
      class="node-row dir-row"
      :class="{ selected: selectedPath === entry.path, 'drop-target': isDragOver }"
      @click="onDirClick"
      @dragover.prevent="isDragOver = true"
      @dragleave="isDragOver = false"
      @drop.stop="onDrop"
    >
      <span class="node-icon">
        <i :class="open ? 'fa-solid fa-folder-open' : 'fa-solid fa-folder'"></i>
      </span>
      <span class="node-name">{{ entry.name }}</span>
    </div>

    <!-- File row -->
    <div
      v-else
      class="node-row file-row"
      :class="{ selected: selectedPath === entry.path }"
      draggable="true"
      @dragstart="onDragStart"
      @click="onFileClick"
      @dblclick="$emit('open-file', entry.path)"
    >
      <span class="node-icon"><i class="fa-regular fa-file-code"></i></span>
      <span class="node-name">{{ entry.name }}</span>
    </div>

    <!-- Children -->
    <div v-if="entry.isDir && open" class="node-children">
      <div v-if="loading" class="node-loading">Loading…</div>
      <FileTreeNode
        v-for="child in children"
        :key="child.path"
        :entry="child"
        :selected-path="selectedPath"
        :refresh-signal="refreshSignal"
        @open-file="$emit('open-file', $event)"
        @select="$emit('select', $event)"
        @move-file="$emit('move-file', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { browseDir } from '../api/projectApi.js'

const props = defineProps({
  entry: { type: Object, required: true },
  selectedPath: { type: String, default: null },
  refreshSignal: { type: Number, default: 0 },
})

const emit = defineEmits(['open-file', 'select', 'move-file'])

const open = ref(false)
const loading = ref(false)
const children = ref([])
const isDragOver = ref(false)

function onFileClick() {
  if (props.selectedPath === props.entry.path) {
    emit('open-file', props.entry.path)
  } else {
    emit('select', props.entry)
  }
}

watch(() => props.refreshSignal, async (val) => {
  if (val > 0 && open.value) {
    children.value = await browseDir(props.entry.path)
  }
})

async function onDirClick() {
  emit('select', props.entry)
  if (!open.value && children.value.length === 0) {
    loading.value = true
    try {
      children.value = await browseDir(props.entry.path)
    } finally {
      loading.value = false
    }
  }
  open.value = !open.value
}

function onDragStart(event) {
  event.dataTransfer.setData('text/plain', props.entry.path)
  event.dataTransfer.effectAllowed = 'move'
}

function onDrop(event) {
  isDragOver.value = false
  const fromPath = event.dataTransfer.getData('text/plain')
  if (!fromPath || fromPath === props.entry.path) return
  emit('move-file', { fromPath, toDir: props.entry.path })
}
</script>

<style scoped>
.tree-node { font-size: 13px; }
.node-row {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 2px 4px;
  cursor: pointer;
  border-radius: 3px;
  white-space: nowrap;
  overflow: hidden;
}
.node-row:hover { background: #c8dcf0; }
.node-row.selected { background: #2a5298; color: #fff; }
.node-row.drop-target { background: #aed4f5; outline: 2px dashed #2a5298; }
.file-row { color: #333; cursor: grab; }
.dir-row { color: #555; font-weight: 500; }
.node-icon { flex-shrink: 0; width: 14px; text-align: center; font-size: 12px; }
.node-name { overflow: hidden; text-overflow: ellipsis; }
.node-children { padding-left: 14px; }
.node-loading { font-size: 11px; color: #888; padding: 2px 4px; }
</style>
