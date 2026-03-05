<template>
  <div class="home">
    <h1>DSPN Diagram Editor</h1>
    <div class="button-container">
      <button class="btn btn-primary" @click="createNewDiagram">New Diagram</button>
      <button class="btn btn-secondary" @click="triggerFileInput">Load Existing Diagram</button>
    </div>
    <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
    <input ref="fileInput" type="file" accept=".xml" style="display:none" @change="onFileSelected">
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { pendingDiagram } from '../diagramStore.js'

const router = useRouter()
const fileInput = ref(null)
const errorMsg = ref('')

const createNewDiagram = () => {
  router.push({ name: 'DiagramEditor' })
}

const triggerFileInput = () => {
  errorMsg.value = ''
  fileInput.value.click()
}

const onFileSelected = (event) => {
  const file = event.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const parsed = parseXml(e.target.result)
      pendingDiagram.value = parsed
      router.push({ name: 'DiagramEditor' })
    } catch {
      errorMsg.value = 'Invalid XML file. Please select a valid diagram file.'
    }
  }
  reader.readAsText(file)
  event.target.value = ''
}

function parseXml(xmlString) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlString, 'application/xml')
  if (doc.querySelector('parsererror')) throw new Error('Parse error')

  const items = []
  doc.querySelectorAll('elements > *').forEach(el => {
    const item = {
      type: el.tagName,
      iconName: el.getAttribute('icon'),
      x: parseFloat(el.getAttribute('x')),
      y: parseFloat(el.getAttribute('y')),
    }
    for (const attr of el.attributes) {
      if (!['id', 'icon', 'x', 'y'].includes(attr.name)) {
        item[attr.name] = attr.value
      }
    }
    items.push(item)
  })

  const conns = []
  doc.querySelectorAll('connections > *').forEach(conn => {
    conns.push({
      type: conn.tagName,
      from: parseInt(conn.getAttribute('from')),
      to: parseInt(conn.getAttribute('to')),
    })
  })

  return { items, conns }
}
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 2rem;
}

h1 {
  font-size: 2.5rem;
  color: #333;
  margin: 0;
}

.button-container {
  display: flex;
  gap: 1.5rem;
}

.btn {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
}

.btn-primary {
  background-color: #42b883;
  color: white;
}

.btn-primary:hover {
  background-color: #359268;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 184, 131, 0.3);
}

.btn-secondary {
  background-color: #646cff;
  color: white;
}

.btn-secondary:hover {
  background-color: #535bf2;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(100, 108, 255, 0.3);
}

.error {
  color: #e74c3c;
  font-size: 0.9rem;
  margin: 0;
}
</style>
