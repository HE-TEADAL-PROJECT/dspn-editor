<template>
  <div class="editor">
    <header class="app-header">
      <span class="app-title">DSPN Editor</span>
      <span class="app-version">v{{ appVersion }}</span>
    </header>

    <div class="editor-body">
      <ProjectManager @open-file="openFromProject" @project-changed="p => currentProjectRoot = p" @file-renamed="onFileRenamed" @files-changed="onFilesChanged" class="project-manager-panel" />

      <div class="tab-area">
        <!-- Tab bar -->
        <div class="tab-bar">
          <button
            v-for="(tab, i) in tabs"
            :key="tab.id"
            class="tab-btn"
            :class="{ active: activeTabIndex === i }"
            @click="activeTabIndex = i"
          >
            <span class="tab-title">{{ tabTitle(tab) }}</span>
            <span class="tab-close" @click.stop="closeTab(i)">×</span>
          </button>
        </div>

        <!-- Empty state -->
        <div v-if="tabs.length === 0" class="no-diagram-placeholder">
          <p>Open an existing file or create a new one using the Project Manager on the left.</p>
        </div>

        <!-- Tab panels -->
        <div
          v-for="(tab, i) in tabs"
          :key="tab.id"
          v-show="activeTabIndex === i"
          class="canvas-wrapper"
        >
          <div class="canvas-area">
            <!-- View toggle -->
            <div class="view-toggle" :class="tab.view === 'xml' ? 'view-toggle--light' : 'view-toggle--dark'">
              <button :class="{ active: tab.view === 'diagram' }" @click.stop="tab.view = 'diagram'">Diagram</button>
              <button :class="{ active: tab.view === 'xml' }" @click.stop="tab.view = 'xml'">XML</button>
            </div>

            <!-- XML view -->
            <div v-if="tab.view === 'xml'" class="xml-view">
              <pre class="xml-content">{{ buildXml(tab) }}</pre>
            </div>

            <div
              v-show="tab.view === 'diagram'"
              class="canvas-container"
              :class="{ selecting: tab.isSelecting }"
              :ref="el => setCanvasContainerRef(el, tab.id)"
            @dragover="onCanvasDragOver"
            @drop="e => onCanvasDrop(e, tab)"
            @click="e => onCanvasClick(e, tab)"
            @mousedown.capture="e => onCanvasMouseDownCapture(e, tab)"
          >
            <canvas class="diagram-canvas"></canvas>

            <!-- Wrapper that gives the scroll container the correct layout size -->
            <div class="canvas-scene-wrapper" :style="sceneWrapperStyle(tab)">

            <!-- Scalable scene -->
            <div class="canvas-scene" :style="{ transform: `scale(${tab.zoom})`, transformOrigin: '0 0' }">

              <!-- SVG connections -->
              <svg class="connections">
                <defs>
                  <marker id="arrow" viewBox="0 0 8 6" markerWidth="5" markerHeight="4" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L8,3 z" fill="#333"/>
                  </marker>
                  <marker id="dot" viewBox="0 0 6 6" markerWidth="4" markerHeight="4" refX="3" refY="3" orient="auto">
                    <circle cx="3" cy="3" r="2.5" fill="#333"/>
                  </marker>
                  <marker id="v-arrow" viewBox="0 0 8 10" markerWidth="5" markerHeight="6" refX="8" refY="5" orient="auto">
                    <path d="M0,0 L8,5 L0,10 L3,5 Z" fill="#000"/>
                  </marker>
                  <marker id="triangle" viewBox="0 0 8 8" markerWidth="5" markerHeight="5" refX="6" refY="4" orient="auto">
                    <polygon points="0,0 8,4 0,8" fill="#000"/>
                  </marker>
                  <marker id="diamond" viewBox="0 0 10 10" markerWidth="6" markerHeight="6" refX="0" refY="5" orient="auto">
                    <polygon points="0,5 5,0 10,5 5,10" fill="#000"/>
                  </marker>
                </defs>
                <line
                  v-for="(conn, ci) in tab.connections"
                  :key="ci"
                  v-bind="connectionPoints(conn, tab)"
                  :stroke="tab.selectedConnection === ci ? '#646cff' : connectionColor(conn.type)"
                  :stroke-width="tab.selectedConnection === ci ? 2.5 : 1.5"
                  :stroke-dasharray="connectionDash(conn.type)"
                  :marker-start="conn.type === 'assigned' ? 'url(#dot)' : conn.type === 'composed' ? 'url(#diamond)' : null"
                  :marker-end="conn.type === 'assigned' ? 'url(#arrow)' : conn.type === 'access' ? 'url(#v-arrow)' : conn.type === 'flow' ? 'url(#triangle)' : null"
                />
              </svg>

              <!-- Connection delete button -->
              <div class="conn-overlays">
                <button
                  v-if="tab.selectedConnection !== null"
                  class="conn-delete-btn"
                  :style="{
                    left: connectionMidpoint(tab.connections[tab.selectedConnection], tab).x + 'px',
                    top:  connectionMidpoint(tab.connections[tab.selectedConnection], tab).y + 'px'
                  }"
                  @click.stop="deleteConnection(tab, tab.selectedConnection)"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>

              <!-- Placed items -->
              <div class="placed-items">
                <div
                  v-for="(item, index) in tab.placedItems"
                  :key="index"
                  class="placed"
                  :class="{
                    selected: tab.selectedItems.has(index) || tab.connectFirst === index,
                    dragging: tab.draggingIndex === index,
                    'placed--junction': isJunction(item.type),
                    'placed--label': item.type === 'label',
                    'placed--group': item.type === 'group',
                  }"
                  :style="isJunction(item.type)
                    ? { left: item.x + 'px', top: item.y + 'px' }
                    : item.type === 'label'
                      ? { left: item.x + 'px', top: item.y + 'px', width: item.width + 'px', height: item.height + 'px', transform: 'none', border: 'none', background: 'transparent' }
                    : item.type === 'group'
                      ? { left: item.x + 'px', top: item.y + 'px', width: item.width + 'px', height: item.height + 'px' }
                      : { left: item.x + 'px', top: item.y + 'px', borderColor: iconColor(item.type), background: iconBgColor(item.type) }"
                  @mousedown="e => onItemMouseDown(e, index, tab)"
                  @click="e => onItemClick(e, index, tab)"
                  @dblclick="e => onItemDblClick(e, index, tab)"
                >
                  <template v-if="item.iconName === 'junction-and' || item.iconName === 'junction-or'">
                    <span class="junction-circle junction-in-canvas" :class="item.iconName === 'junction-and' ? 'junction-and' : 'junction-or'"></span>
                  </template>
                  <template v-else-if="item.type === 'label'">
                    <input
                      v-if="tab.editingLabelIndex === index"
                      type="text"
                      class="label-textarea"
                      v-model="item.text"
                      :style="{ fontSize: (item.fontSize || 15) + 'px' }"
                      @blur="tab.editingLabelIndex = null; tab.isDirty = true"
                      @keydown.escape.stop="tab.editingLabelIndex = null"
                      @keydown.enter.stop="tab.editingLabelIndex = null"
                      @click.stop
                      @mousedown.stop
                      :ref="el => { if (el) el.focus() }"
                    />
                    <span v-else class="placed-label-text" :style="{ fontSize: (item.fontSize || 15) + 'px' }">{{ item.text }}</span>
                    <div class="group-resize-handle group-resize-handle--nw" @mousedown.stop="onGroupResizeMouseDown($event, index, 'nw', tab)"></div>
                    <div class="group-resize-handle group-resize-handle--ne" @mousedown.stop="onGroupResizeMouseDown($event, index, 'ne', tab)"></div>
                    <div class="group-resize-handle group-resize-handle--sw" @mousedown.stop="onGroupResizeMouseDown($event, index, 'sw', tab)"></div>
                    <div class="group-resize-handle group-resize-handle--se" @mousedown.stop="onGroupResizeMouseDown($event, index, 'se', tab)"></div>
                  </template>
                  <template v-else-if="item.type === 'group'">
                    <span v-if="item.name" class="placed-group-name">{{ item.name }}</span>
                    <div class="group-resize-handle group-resize-handle--nw" @mousedown.stop="onGroupResizeMouseDown($event, index, 'nw', tab)"></div>
                    <div class="group-resize-handle group-resize-handle--ne" @mousedown.stop="onGroupResizeMouseDown($event, index, 'ne', tab)"></div>
                    <div class="group-resize-handle group-resize-handle--sw" @mousedown.stop="onGroupResizeMouseDown($event, index, 'sw', tab)"></div>
                    <div class="group-resize-handle group-resize-handle--se" @mousedown.stop="onGroupResizeMouseDown($event, index, 'se', tab)"></div>
                  </template>
                  <template v-else>
                    <i :class="['fas', 'fa-' + item.iconName]" :style="{ color: iconColor(item.type) }"></i>
                    <span v-if="item.name" class="item-label">
                      <span v-if="item.mode === 'pseudo'" class="item-mode-badge">pseudo</span>
                      {{ item.name }}
                      <span v-if="item.expression" class="item-expression">[{{ item.expression }}]</span>
                      <span v-if="item.algorithm" class="item-expression">[{{ item.algorithm }}]</span>
                      <span v-if="(item.type === 'policy-doc' || item.type === 'transformation-policy') && item.filename" class="item-expression">[{{ basename(item.filename) }}]</span>
                    </span>
                  </template>
                  <button v-if="tab.selectedItem === index" class="delete-btn" @click.stop="deleteItem(index, tab)">
                    <i class="fas fa-trash"></i>
                  </button>
                  <button v-if="tab.selectedItem === index && item.type !== 'label' && item.type !== 'group'" class="connect-start-btn" @click.stop="startConnection(index, tab)">
                    <i class="fas fa-arrow-right"></i>
                  </button>
                  <button v-if="tab.selectedItem === index && (item.type === 'policy-doc' || item.type === 'transformation-policy') && item.filename" class="open-policy-btn" @click.stop="openPolicyDoc(item)">
                    <i class="fas fa-plus"></i>
                  </button>
                </div>
              </div>

              <div
                v-if="tab.selectionRect"
                class="selection-rect"
                :style="{
                  left: Math.min(tab.selectionRect.x0, tab.selectionRect.x1) + 'px',
                  top: Math.min(tab.selectionRect.y0, tab.selectionRect.y1) + 'px',
                  width: Math.abs(tab.selectionRect.x1 - tab.selectionRect.x0) + 'px',
                  height: Math.abs(tab.selectionRect.y1 - tab.selectionRect.y0) + 'px',
                }"
              ></div>

            </div><!-- end canvas-scene -->
            </div><!-- end canvas-scene-wrapper -->

            <!-- Clear confirmation modal -->
            <div v-if="tab.showClearConfirm" class="conn-modal-overlay">
              <div class="conn-modal">
                <p>Clear the entire diagram?</p>
                <button @click="confirmClear(tab)">Yes, clear</button>
                <button class="cancel" @click="tab.showClearConfirm = false">Cancel</button>
              </div>
            </div>

            <!-- Connection type modal -->
            <!-- Invalid connection modal -->
            <div v-if="tab.invalidConnection" class="conn-modal-overlay">
              <div class="conn-modal conn-modal--error">
                <p class="conn-modal-title">Relation not admissible</p>
                <p class="conn-modal-subtitle">
                  A <strong>{{ tab.invalidConnection.fromType }}</strong> cannot be connected to a <strong>{{ tab.invalidConnection.toType }}</strong>.
                </p>
                <p class="conn-modal-subtitle" v-if="tab.invalidConnection.admissible.length > 0">Admissible relations from <strong>{{ tab.invalidConnection.fromType }}</strong>:</p>
                <ul v-if="tab.invalidConnection.admissible.length > 0" class="conn-modal-list">
                  <li v-for="r in tab.invalidConnection.admissible" :key="r.to">
                    → <strong>{{ r.to }}</strong> ({{ r.types.join(', ') }})
                  </li>
                </ul>
                <p v-else class="conn-modal-subtitle">No admissible relations exist from this element.</p>
                <button class="cancel" @click="tab.invalidConnection = null">Close</button>
              </div>
            </div>

            <div v-if="tab.pendingConnection" class="conn-modal-overlay">
              <div class="conn-modal">
                <p>Select connection type</p>
                <button v-for="t in tab.pendingConnection.allowed" :key="t" @click="confirmConnection(tab, t)">{{ t }}</button>
                <button class="cancel" @click="cancelConnection(tab)">Cancel</button>
              </div>
            </div>

          </div>

            <!-- Canvas toolbar (outside scroll container so it stays fixed) -->
            <div v-show="tab.view === 'diagram'" class="canvas-toolbar" @click.stop @dragover.prevent>
              <span v-if="tab.diagramName || tab.serverPath" class="canvas-filename">
                <template v-if="tab.diagramName">{{ tab.diagramName }}</template>
                <template v-if="tab.serverPath"> [{{ tab.serverPath }}]</template>
              </span>
              <span v-if="tab.isConnecting" class="canvas-connecting">select second item to connect</span>
              <button class="btn-canvas-align" :disabled="tab.selectedItems.size < 2" @click="alignItems(tab, 'horizontal')" title="Align horizontally (same row)">
                <i class="fas fa-grip-lines"></i>
              </button>
              <button class="btn-canvas-align" :disabled="tab.selectedItems.size < 2" @click="alignItems(tab, 'vertical')" title="Align vertically (same column)">
                <i class="fas fa-grip-lines-vertical"></i>
              </button>
              <button class="btn-canvas-select" :class="{ active: tab.isSelecting }" @click="toggleSelect(tab)" title="Select (drag to select multiple items)">
                <i class="fas fa-object-group"></i>
              </button>
              <button class="btn-canvas-undo" :disabled="!tab.undoStack.length" @click="undo(tab)" title="Undo">
                <i class="fas fa-rotate-left"></i>
              </button>
              <button class="btn-canvas-undo" :disabled="!tab.redoStack.length" @click="redo(tab)" title="Redo">
                <i class="fas fa-rotate-right"></i>
              </button>
              <button class="btn-canvas-save" @click="saveDiagram">
                <i class="fas fa-floppy-disk"></i> Save
              </button>
              <button class="btn-canvas-clear" @click="promptClear(tab)">
                <i class="fas fa-trash"></i> Clear
              </button>
            </div>

            <!-- Zoom controls (outside scroll container so they stay fixed) -->
            <div v-show="tab.view === 'diagram'" class="zoom-controls" @click.stop>
              <button class="zoom-btn" @click="zoomIn(tab)" title="Zoom in">+</button>
              <button class="zoom-btn" @click="zoomOut(tab)" title="Zoom out">−</button>
            </div>

          </div><!-- end canvas-area -->

          <!-- Properties panel -->
          <div class="properties-panel">
            <div v-if="tab.selectedConnection !== null" class="properties-content">
              <h4>Connection</h4>
              <div class="property">
                <span class="label">Type:</span>
                <select v-model="tab.connections[tab.selectedConnection].type" class="input-value" @mousedown="pushUndo(tab)" @change="tab.isDirty = true">
                  <option
                    v-for="t in allowedTypes(tab.connections[tab.selectedConnection].from, tab.connections[tab.selectedConnection].to, tab)"
                    :key="t" :value="t"
                  >{{ t }}</option>
                </select>
              </div>
            </div>
            <div v-else-if="tab.selectedItem !== null" class="properties-content">
              <h4>Properties</h4>
              <div v-if="tab.placedItems[tab.selectedItem].name !== undefined" class="property">
                <span class="label">Name:</span>
                <input v-model="tab.placedItems[tab.selectedItem].name" type="text" class="input-value" placeholder="Name" @focus="pushUndo(tab)" @change="tab.isDirty = true">
              </div>
              <div v-if="tab.placedItems[tab.selectedItem].type === 'policy-doc' || tab.placedItems[tab.selectedItem].type === 'transformation-policy'" class="property">
                <span class="label">Filename:</span>
                <select v-model="tab.placedItems[tab.selectedItem].filename" class="input-value" @mousedown="pushUndo(tab)" @change="tab.isDirty = true">
                  <option value="">— none —</option>
                  <option v-for="f in projectFiles.filter(f => f.path !== tab.serverPath)" :key="f.path" :value="f.path">{{ f.path }}</option>
                </select>
              </div>
              <div v-if="tab.placedItems[tab.selectedItem].type === 'data-source'" class="property">
                <span class="label">Path:</span>
                <select v-if="openAPIfile" v-model="tab.placedItems[tab.selectedItem].path" class="input-value" @mousedown="pushUndo(tab)" @change="tab.isDirty = true; refreshConnectedRequestAttributes(tab, tab.selectedItem)">
                  <option value="">— select path —</option>
                  <option v-for="p in Object.keys(openAPIfile.paths ?? {}).filter(p => openAPIfile.paths[p].get)" :key="p" :value="p">{{ p }}</option>
                </select>
                <span v-else class="prop-no-api">No OpenAPI spec loaded</span>
              </div>
              <div v-if="tab.placedItems[tab.selectedItem].type === 'data-product'" class="property">
                <span class="label">OpenAPI file:</span>
                <input v-model="tab.placedItems[tab.selectedItem].openAPIUrl" type="text" class="input-value" placeholder="URL" @focus="pushUndo(tab)" @change="tab.isDirty = true">
                <button class="prop-load-btn" title="Inspect OpenAPI file" :disabled="!tab.placedItems[tab.selectedItem].openAPIUrl" @click="openEndpoint(tab.placedItems[tab.selectedItem].openAPIUrl)">Inspect</button>
                <button class="prop-load-btn" title="Load OpenAPI file" :disabled="!tab.placedItems[tab.selectedItem].openAPIUrl" @click="loadEndpoint(tab.placedItems[tab.selectedItem].openAPIUrl)">Load</button>
              </div>
              <div v-if="tab.placedItems[tab.selectedItem].type === 'shared-data-product'" class="property">
                <span class="label">Endpoint:</span>
                <input v-model="tab.placedItems[tab.selectedItem].endpoint" type="text" class="input-value" placeholder="URL" @focus="pushUndo(tab)" @change="tab.isDirty = true">
              </div>
              <div v-if="['user-attributes','system-attributes','request-attributes'].includes(tab.placedItems[tab.selectedItem].type)" class="property property--fill">
                <span class="label">Attributes:</span>
                <textarea
                  v-model="tab.placedItems[tab.selectedItem].attributes"
                  class="input-value input-value--fill input-value--json"
                  :class="{ 'input-value--json-invalid': !isValidJson(tab.placedItems[tab.selectedItem].attributes) && tab.placedItems[tab.selectedItem].attributes }"
                  placeholder='["name1", "name2"]'
                  spellcheck="false"
                  @focus="pushUndo(tab)"
                  @change="tab.isDirty = true"
                ></textarea>
              </div>
              <div v-if="tab.placedItems[tab.selectedItem].expression !== undefined" class="property">
                <span class="label">Expression:</span>
                <input v-model="tab.placedItems[tab.selectedItem].expression" type="text" class="input-value input-value--fill" placeholder="Expression" @focus="pushUndo(tab)" @change="tab.isDirty = true">
              </div>
              <div v-if="tab.placedItems[tab.selectedItem].mode !== undefined" class="property">
                <span class="label">Mode:</span>
                <label class="radio-label"><input type="radio" v-model="tab.placedItems[tab.selectedItem].mode" value="full" @change="pushUndo(tab); tab.isDirty = true"> Full</label>
                <label class="radio-label"><input type="radio" v-model="tab.placedItems[tab.selectedItem].mode" value="pseudo" @change="pushUndo(tab); tab.isDirty = true"> Pseudo</label>
              </div>
              <div v-if="tab.placedItems[tab.selectedItem].algorithm !== undefined" class="property">
                <span class="label">Algorithm:</span>
                <input v-model="tab.placedItems[tab.selectedItem].algorithm" type="text" class="input-value input-value--fill" placeholder="Algorithm" @focus="pushUndo(tab)" @change="tab.isDirty = true">
              </div>
              <div v-if="tab.placedItems[tab.selectedItem].type === 'label'" class="property">
                <span class="label">Font size:</span>
                <input
                  type="number"
                  min="8" max="96" step="1"
                  v-model.number="tab.placedItems[tab.selectedItem].fontSize"
                  class="input-value input-value--short"
                  @focus="pushUndo(tab)"
                  @change="tab.isDirty = true"
                >
              </div>
            </div>
            <div v-else-if="tab.diagramSelected" class="properties-content">
              <h4>Diagram</h4>
              <div class="property">
                <span class="label">Name:</span>
                <input v-model="tab.diagramName" type="text" class="input-value" placeholder="Diagram name" @change="tab.isDirty = true">
              </div>
              <div class="property property--fill">
                <span class="label">Description:</span>
                <textarea v-model="tab.diagramDescription" class="input-value input-textarea" placeholder="Description" @change="tab.isDirty = true"></textarea>
              </div>
            </div>
            <div v-else class="properties-empty">
              <p>Select an element or connector</p>
            </div>
          </div>
        </div>
      </div>
      <aside class="palette">
        <div class="palette-section palette-section--data">
          <h4>Data Source</h4>
          <div class="transformation-grid">
            <div class="palette-subsubsection">
              <div class="icon" draggable="true" data-type="data-product" data-icon="cube" @dragstart="onDragStart">
                <i class="fas fa-cube"></i>
              </div>
              <span class="label">Data Product</span>
            </div>
            <div class="palette-subsubsection">
              <div class="icon" draggable="true" data-type="data-source" data-icon="database" @dragstart="onDragStart">
                <i class="fas fa-database"></i>
              </div>
              <span class="label">Data</span>
            </div>
          </div>
        </div>
        <div class="palette-section palette-section--attributes">
          <h4>Attributes</h4>
          <div class="transformation-grid">
            <div class="palette-subsubsection">
              <div class="icon" draggable="true" data-type="user-attributes" data-icon="user" @dragstart="onDragStart">
                <i class="fas fa-user"></i>
              </div>
              <span class="label">User Attributes</span>
            </div>
            <div class="palette-subsubsection">
              <div class="icon" draggable="true" data-type="request-attributes" data-icon="paper-plane" @dragstart="onDragStart">
                <i class="fas fa-paper-plane"></i>
              </div>
              <span class="label">Request Attributes</span>
            </div>
            <div class="palette-subsubsection">
              <div class="icon" draggable="true" data-type="system-attributes" data-icon="gear" @dragstart="onDragStart">
                <i class="fas fa-gear"></i>
              </div>
              <span class="label">System Attributes</span>
            </div>
          </div>
        </div>
        <div class="palette-section palette-subsection--transformation">
          <h4>Policy Doc</h4>
          <div class="transformation-grid">
            <div class="palette-subsubsection">
              <div class="icon" draggable="true" data-type="policy-doc" data-icon="file-shield" @dragstart="onDragStart">
                <i class="fas fa-file-shield"></i>
              </div>
              <span class="label">Data Usage Policy</span>
            </div>
            <div class="palette-subsubsection">
              <div class="icon" draggable="true" data-type="transformation-policy" data-icon="file-pen" @dragstart="onDragStart">
                <i class="fas fa-file-pen"></i>
              </div>
              <span class="label">Transformation Policy</span>
            </div>
          </div>
        </div>
        <div class="palette-section palette-subsection--transformation">
          <h4>Policies</h4>
          <div class="transformation-grid">
            <div class="palette-subsubsection">
              <div class="icon" draggable="true" data-type="filter" data-icon="filter" @dragstart="onDragStart">
                <i class="fas fa-filter"></i>
              </div>
              <span class="label">Filter</span>
            </div>
            <div class="palette-subsubsection">
              <div class="icon" draggable="true" data-type="projection" data-icon="magnifying-glass" @dragstart="onDragStart">
                <i class="fas fa-magnifying-glass"></i>
              </div>
              <span class="label">Projection</span>
            </div>
            <div class="palette-subsubsection">
              <div class="icon" draggable="true" data-type="encryption" data-icon="lock" @dragstart="onDragStart">
                <i class="fas fa-lock"></i>
              </div>
              <span class="label">Encryption</span>
            </div>
            <div class="palette-subsubsection">
              <div class="icon" draggable="true" data-type="anonymization" data-icon="user-secret" @dragstart="onDragStart">
                <i class="fas fa-user-secret"></i>
              </div>
              <span class="label">Anonymization</span>
            </div>
            <div class="palette-subsubsection">
              <div class="icon" draggable="true" data-type="rename" data-icon="pen" @dragstart="onDragStart">
                <i class="fas fa-pen"></i>
              </div>
              <span class="label">Rename</span>
            </div>
            <div class="palette-subsubsection">
              <div class="icon" draggable="true" data-type="usage" data-icon="chart-line" @dragstart="onDragStart">
                <i class="fas fa-chart-line"></i>
              </div>
              <span class="label">Usage</span>
            </div>
            <div class="palette-subsubsection">
              <div class="icon" draggable="true" data-type="authorization" data-icon="shield-halved" @dragstart="onDragStart">
                <i class="fas fa-shield-halved"></i>
              </div>
              <span class="label">Authorization</span>
            </div>
          </div>
        </div>
        <div class="palette-section palette-section--exposed">
          <h4>Exposed Data</h4>
          <div class="transformation-grid">
            <div class="palette-subsubsection">
              <div class="icon" draggable="true" data-type="shared-data-product" data-icon="share-nodes" @dragstart="onDragStart">
                <i class="fas fa-share-nodes"></i>
              </div>
              <span class="label">Shared Data Product</span>
            </div>
            <div class="palette-subsubsection">
              <div class="icon" draggable="true" data-type="exposed-data" data-icon="share" @dragstart="onDragStart">
                <i class="fas fa-share"></i>
              </div>
              <span class="label">Exposed Data</span>
            </div>
          </div>
        </div>
        <div class="palette-section palette-section--others">
          <h4>Others</h4>
          <div class="transformation-grid">
            <div class="palette-subsubsection">
              <div class="icon" draggable="true" data-type="label" data-icon="font" @dragstart="onDragStart">
                <i class="fas fa-font"></i>
              </div>
              <span class="label">Label</span>
            </div>
            <div class="palette-subsubsection">
              <div class="icon" draggable="true" data-type="group" data-icon="border-none" @dragstart="onDragStart">
                <i class="fas fa-border-none"></i>
              </div>
              <span class="label">Group</span>
            </div>
          </div>
        </div>
        <div class="palette-section">
          <h4>Junctions</h4>
          <div class="transformation-grid">
            <div class="palette-subsubsection">
              <div class="icon" draggable="true" data-type="and-junction" data-icon="junction-and" @dragstart="onDragStart">
                <span class="junction-circle junction-and"></span>
              </div>
              <span class="label">AND Junction</span>
            </div>
            <div class="palette-subsubsection">
              <div class="icon" draggable="true" data-type="or-junction" data-icon="junction-or" @dragstart="onDragStart">
                <span class="junction-circle junction-or"></span>
              </div>
              <span class="label">OR Junction</span>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <footer class="app-footer">
      <span>
        Developed by the <a href="https://isgroup-polimi.github.io" target="_blank" rel="noopener">RAISE group at POLIMI</a>
        with huge support of Claude
      </span>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import ProjectManager from './ProjectManager.vue'
import { writeFile, readFile } from '../api/projectApi.js'
import { version } from '../../package.json'

const appVersion = version

const currentProjectRoot = ref(null)
const projectFiles = ref([])
const openAPIfile = ref(null)

// ── Tab management ──────────────────────────────────────────────────────────

let tabIdCounter = 0

function createTab(fileName = null, items = [], conns = []) {
  return {
    id: tabIdCounter++,
    fileName,
    placedItems: items,
    connections: conns,
    isConnecting: false,
    connectFirst: null,
    selectedItem: null,
    pendingConnection: null,
    invalidConnection: null,
    draggingIndex: null,
    hasDragged: false,
    selectedConnection: null,
    showClearConfirm: false,
    serverPath: null,
    isDirty: false,
    selectedItems: new Set(),
    isSelecting: false,
    selectionRect: null,
    editingLabelIndex: null,
    undoStack: [],
    redoStack: [],
    view: 'diagram',
    diagramSelected: true,
    diagramName: '',
    diagramDescription: '',
    zoom: 1,
  }
}

const tabs = ref([])
const activeTabIndex = ref(0)
const activeTab = computed(() => tabs.value[activeTabIndex.value])

function tabTitle(tab) {
  const name = tab.serverPath ?? tab.fileName ?? 'New Diagram'
  return (tab.isDirty ? '● ' : '') + name
}

function addTab() {
  tabs.value.push(createTab())
  activeTabIndex.value = tabs.value.length - 1
}

async function closeTab(i) {
  const tab = tabs.value[i]
  if (tab.isDirty) {
    const choice = confirm(`"${tab.fileName || 'New Diagram'}" has unsaved changes.\n\nSave before closing?`)
    if (choice) {
      activeTabIndex.value = i
      await saveDiagram()
    }
  }
  tabs.value.splice(i, 1)
  if (activeTabIndex.value >= tabs.value.length) {
    activeTabIndex.value = Math.max(0, tabs.value.length - 1)
  }
}

// ── Arrow-key movement ───────────────────────────────────────────────────────

const arrowKeysHeld = new Set()

function onArrowKey(e) {
  const ARROWS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
  if (!ARROWS.includes(e.key)) return
  const tag = document.activeElement?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

  const tab = activeTab.value
  if (!tab) return

  const indices = tab.selectedItems.size > 0
    ? [...tab.selectedItems]
    : tab.selectedItem !== null ? [tab.selectedItem] : []
  if (indices.length === 0) return

  e.preventDefault()

  if (!arrowKeysHeld.has(e.key)) {
    arrowKeysHeld.add(e.key)
    pushUndo(tab)
  }

  const step = e.shiftKey ? 10 : 1
  const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
  const dy = e.key === 'ArrowUp'   ? -step : e.key === 'ArrowDown'  ? step : 0
  indices.forEach(i => {
    tab.placedItems[i].x += dx
    tab.placedItems[i].y += dy
  })
  tab.isDirty = true
}

function onArrowKeyUp(e) {
  arrowKeysHeld.delete(e.key)
}

onMounted(() => {
  window.addEventListener('keydown', onArrowKey)
  window.addEventListener('keyup', onArrowKeyUp)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onArrowKey)
  window.removeEventListener('keyup', onArrowKeyUp)
})

// ── Undo / Redo ──────────────────────────────────────────────────────────────

function pushUndo(tab) {
  tab.undoStack.push({
    placedItems: JSON.parse(JSON.stringify(tab.placedItems)),
    connections: JSON.parse(JSON.stringify(tab.connections)),
  })
  tab.redoStack = []
}

function undo(tab) {
  if (!tab.undoStack.length) return
  tab.redoStack.push({
    placedItems: JSON.parse(JSON.stringify(tab.placedItems)),
    connections: JSON.parse(JSON.stringify(tab.connections)),
  })
  const prev = tab.undoStack.pop()
  tab.placedItems = prev.placedItems
  tab.connections = prev.connections
  tab.selectedItem = null
  tab.selectedItems = new Set()
  tab.selectedConnection = null
  tab.isDirty = true
}

function redo(tab) {
  if (!tab.redoStack.length) return
  tab.undoStack.push({
    placedItems: JSON.parse(JSON.stringify(tab.placedItems)),
    connections: JSON.parse(JSON.stringify(tab.connections)),
  })
  const next = tab.redoStack.pop()
  tab.placedItems = next.placedItems
  tab.connections = next.connections
  tab.selectedItem = null
  tab.selectedItems = new Set()
  tab.selectedConnection = null
  tab.isDirty = true
}

// ── Connection rules ─────────────────────────────────────────────────────────

const attributeTypes = ['user-attributes', 'request-attributes', 'system-attributes']
const transformationTypes = ['filter', 'projection', 'encryption', 'anonymization', 'rename']
const usageTypes = ['usage', 'authorization']
const policiesTypes = ['policy-doc', 'transformation-policy', ...transformationTypes, ...usageTypes]

const connectionRules = {
  'data-product:data-source':          ['composed'],
  'data-source:request-attributes':    ['composed'],
  'data-source:exposed-data':          ['flow'],
  'shared-data-product:exposed-data':  ['composed'],
  ...Object.fromEntries(transformationTypes.map(t => [`data-source:${t}`, ['flow']])),
  // Rule 1: data-source → transformation-policy (Transformation Policy Doc)
  'data-source:transformation-policy':    ['flow'],
  ...Object.fromEntries(transformationTypes.map(t => [`${t}:exposed-data`, ['flow']])),
  // Rule 5: transformation-policy → exposed-data
  'transformation-policy:exposed-data':   ['flow'],
  // Rule 2: transformation-policy → transformation-policy (no loops enforced at placement)
  'transformation-policy:transformation-policy': ['flow'],
  // Rule 3: transformation-policy → each transformation type
  ...Object.fromEntries(transformationTypes.map(t => [`transformation-policy:${t}`, ['flow']])),
  // Rule 4: each transformation type → transformation-policy
  ...Object.fromEntries(transformationTypes.map(t => [`${t}:transformation-policy`, ['flow']])),
  // Rule 6: policy-doc (Data Usage Policy Doc) → exposed-data with assigned
  'policy-doc:exposed-data':              ['assigned'],
  ...Object.fromEntries(usageTypes.map(t => [`${t}:exposed-data`, ['assigned']])),
  ...Object.fromEntries(
    transformationTypes.flatMap(a => transformationTypes.map(b => [`${a}:${b}`, ['flow']]))
  ),
  ...Object.fromEntries(
    attributeTypes.flatMap(a => [...transformationTypes, ...usageTypes].map(t => [`${a}:${t}`, ['access']]))
  ),
}

function allowedTypes(fromIndex, toIndex, tab) {
  const fromType = tab.placedItems[fromIndex].type
  const toType   = tab.placedItems[toIndex].type

  if (isJunction(fromType) && isJunction(toType)) {
    // upstream constraint: what non-junction nodes feed into fromIndex
    const sources = tab.connections
      .filter(c => c.to === fromIndex && !isJunction(tab.placedItems[c.from].type))
      .map(c => tab.placedItems[c.from].type)
    // downstream constraint: what non-junction nodes toIndex sends to
    const destinations = tab.connections
      .filter(c => c.from === toIndex && !isJunction(tab.placedItems[c.to].type))
      .map(c => tab.placedItems[c.to].type)

    if (sources.length === 0 && destinations.length === 0) return ['flow', 'assigned', 'access', 'composed']

    if (destinations.length === 0) {
      // only upstream context: intersect types each source can produce to any target
      const sets = sources.map(s =>
        [...new Set(Object.entries(connectionRules).filter(([k]) => k.startsWith(s + ':')).flatMap(([, v]) => v))]
      )
      return sets.reduce((acc, s) => acc.filter(t => s.includes(t)), sets[0] ?? [])
    }

    if (sources.length === 0) {
      // only downstream context: intersect types each destination can accept from any source
      const sets = destinations.map(d =>
        [...new Set(Object.entries(connectionRules).filter(([k]) => k.endsWith(':' + d)).flatMap(([, v]) => v))]
      )
      return sets.reduce((acc, s) => acc.filter(t => s.includes(t)), sets[0] ?? [])
    }

    // both known: for each (source, destination) pair apply connectionRules, then intersect
    const pairs = sources.flatMap(s => destinations.map(d => connectionRules[`${s}:${d}`] ?? []))
    return pairs.reduce((acc, s) => acc.filter(t => s.includes(t)), pairs[0] ?? [])
  }

  if (isJunction(toType)) {
    // A → junction: derive rules from what the junction already sends to
    const destinations = tab.connections
      .filter(c => c.from === toIndex && !isJunction(tab.placedItems[c.to].type))
      .map(c => tab.placedItems[c.to].type)
    if (destinations.length === 0) return ['flow', 'assigned', 'access', 'composed']
    const sets = destinations.map(d => connectionRules[`${fromType}:${d}`] ?? [])
    return sets.reduce((acc, s) => acc.filter(t => s.includes(t)), sets[0] ?? [])
  }

  if (isJunction(fromType)) {
    // junction → B: derive rules from what feeds into the junction
    const sources = tab.connections
      .filter(c => c.to === fromIndex && !isJunction(tab.placedItems[c.from].type))
      .map(c => tab.placedItems[c.from].type)
    if (sources.length === 0) return ['flow', 'assigned', 'access', 'composed']
    const sets = sources.map(s => connectionRules[`${s}:${toType}`] ?? [])
    return sets.reduce((acc, s) => acc.filter(t => s.includes(t)), sets[0] ?? [])
  }

  return connectionRules[`${fromType}:${toType}`] ?? []
}

// ── Geometry ─────────────────────────────────────────────────────────────────

const ITEM_HW = 49.5
const ITEM_HH = 26
const CONNECTOR_GAP = 7
const JUNCTION_RADIUS = 10

function isJunction(type) {
  return type === 'and-junction' || type === 'or-junction'
}

function rectEdgePoint(cx, cy, nx, ny) {
  const tx = nx !== 0 ? ITEM_HW / Math.abs(nx) : Infinity
  const ty = ny !== 0 ? ITEM_HH / Math.abs(ny) : Infinity
  const t = Math.min(tx, ty)
  return { x: cx + nx * (t + CONNECTOR_GAP), y: cy + ny * (t + CONNECTOR_GAP) }
}

function circleEdgePoint(cx, cy, nx, ny) {
  return { x: cx + nx * (JUNCTION_RADIUS + CONNECTOR_GAP), y: cy + ny * (JUNCTION_RADIUS + CONNECTOR_GAP) }
}

function connectionPoints(conn, tab) {
  const from = tab.placedItems[conn.from]
  const to   = tab.placedItems[conn.to]
  const dx = to.x - from.x
  const dy = to.y - from.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist === 0) return { x1: from.x, y1: from.y, x2: to.x, y2: to.y }
  const nx = dx / dist
  const ny = dy / dist
  const p1 = isJunction(from.type) ? circleEdgePoint(from.x, from.y, nx, ny)    : rectEdgePoint(from.x, from.y, nx, ny)
  const p2 = isJunction(to.type)   ? circleEdgePoint(to.x, to.y, -nx, -ny) : rectEdgePoint(to.x, to.y, -nx, -ny)
  return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }
}

function connectionMidpoint(conn, tab) {
  const pts = connectionPoints(conn, tab)
  return { x: (pts.x1 + pts.x2) / 2, y: (pts.y1 + pts.y2) / 2 }
}

function connectionColor(type) {
  return { assigned: '#333', access: '#000', flow: '#000', composed: '#000' }[type] ?? '#333'
}

function connectionDash(type) {
  return { assigned: '', access: '2,4', flow: '6,4', composed: '' }[type] ?? ''
}

// ── Diagram actions ───────────────────────────────────────────────────────────

function promptClear(tab) {
  tab.showClearConfirm = true
}

function confirmClear(tab) {
  pushUndo(tab)
  tab.placedItems = []
  tab.connections = []
  tab.isConnecting = false
  tab.connectFirst = null
  tab.selectedItem = null
  tab.selectedConnection = null
  tab.isDirty = true
  tab.showClearConfirm = false
}


const xmlTagToType = {
  'data-usage-policy-doc':    'policy-doc',
  'transformation-policy-doc': 'transformation-policy',
}
const typeToXmlTag = {
  'policy-doc':           'data-usage-policy-doc',
  'transformation-policy': 'transformation-policy-doc',
}
function typeToTag(type) { return typeToXmlTag[type] ?? type }
function tagToType(tag)  { return xmlTagToType[tag]  ?? tag  }

function parseXml(xmlString) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlString, 'application/xml')
  if (doc.querySelector('parsererror')) throw new Error('Parse error')

  const items = []
  doc.querySelectorAll('elements > *').forEach(el => {
    const item = {
      type: tagToType(el.tagName),
      iconName: el.getAttribute('icon'),
      x: parseFloat(el.getAttribute('x')),
      y: parseFloat(el.getAttribute('y')),
    }
    for (const attr of el.attributes) {
      if (!['id', 'icon', 'x', 'y'].includes(attr.name)) {
        item[attr.name] = attr.value
      }
    }
    if (item.type === 'data-source') {
      item.path = item.path ?? ''
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

  const diagramEl = doc.querySelector('dspn-diagram')
  const diagramName = diagramEl?.getAttribute('name') ?? ''
  const diagramDescription = diagramEl?.getAttribute('description') ?? ''

  return { items, conns, diagramName, diagramDescription }
}

async function openFromProject({ xmlText, fileName, serverPath }) {
  const existingIndex = tabs.value.findIndex(t => t.serverPath === serverPath)
  if (existingIndex !== -1) {
    activeTabIndex.value = existingIndex
    return
  }
  try {
    const parsed = parseXml(xmlText)
    const current = activeTab.value
    let target
    if (current && current.placedItems.length === 0 && !current.fileName) {
      current.placedItems = parsed.items
      current.connections = parsed.conns
      current.fileName = fileName
      current.serverPath = serverPath
      current.diagramName = parsed.diagramName
      current.diagramDescription = parsed.diagramDescription
      target = current
    } else {
      const tab = createTab(fileName, parsed.items, parsed.conns)
      tab.serverPath = serverPath
      tab.diagramName = parsed.diagramName
      tab.diagramDescription = parsed.diagramDescription
      tabs.value.push(tab)
      activeTabIndex.value = tabs.value.length - 1
      target = tab
    }
    autoLoadOpenAPI(parsed.items)
    fitToView(target)
  } catch {
    alert('Invalid XML file.')
  }
}

function onFilesChanged(files) {
  projectFiles.value = files
}

function refreshConnectedRequestAttributes(tab, dataSourceIndex) {
  tab.connections
    .filter(c => c.from === dataSourceIndex && tab.placedItems[c.to]?.type === 'request-attributes')
    .forEach(c => populateRequestAttributes(tab, dataSourceIndex, c.to))
}

function populateRequestAttributes(tab, fromIndex, toIndex) {
  const from = tab.placedItems[fromIndex]
  const to   = tab.placedItems[toIndex]
  if (from.type !== 'data-source' || to.type !== 'request-attributes') return
  if (!openAPIfile.value || !from.path) return
  const parameters = openAPIfile.value.paths?.[from.path]?.get?.parameters
  if (!parameters?.length) return
  to.attributes = JSON.stringify(
    parameters.map(p => ({
      name: p.name,
      in: p.in,
      required: p.required ?? false,
    })),
    null, 2
  )
}

function isValidJson(text) {
  if (!text) return true
  try {
    const parsed = JSON.parse(text)
    return Array.isArray(parsed) && parsed.every(e => typeof e === 'string')
  } catch { return false }
}

function openEndpoint(url) {
  if (url) window.open(url, '_blank')
}

async function fetchOpenAPI(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('File is not valid JSON. Only JSON-format OpenAPI files are supported.')
  }
  if (!data.openapi || !String(data.openapi).startsWith('3.')) {
    throw new Error(`Not an OpenAPI 3.0 document (found: ${data.openapi ?? 'no "openapi" field'}).`)
  }
  return data
}

async function loadEndpoint(url) {
  if (!url) return
  if (openAPIfile.value !== null) {
    const proceed = confirm('An OpenAPI spec is already loaded. Loading a new one will replace it. Continue?')
    if (!proceed) return
  }
  try {
    openAPIfile.value = await fetchOpenAPI(url)
    alert(`OpenAPI ${openAPIfile.value.openapi} document loaded: "${openAPIfile.value.info?.title ?? 'untitled'}"`)
  } catch (e) {
    openAPIfile.value = null
    alert('Load failed: ' + e.message)
  }
}

async function autoLoadOpenAPI(items) {
  const dataProduct = items.find(i => i.type === 'data-product' && i.openAPIUrl)
  if (!dataProduct) return
  try {
    openAPIfile.value = await fetchOpenAPI(dataProduct.openAPIUrl)
  } catch {
    openAPIfile.value = null
  }
}

async function openPolicyDoc(item) {
  const serverPath = item.filename
  const existingIndex = tabs.value.findIndex(t => t.serverPath === serverPath)
  if (existingIndex !== -1) {
    activeTabIndex.value = existingIndex
    return
  }
  try {
    const xmlText = await readFile(serverPath)
    const fileName = serverPath.split('/').pop()
    openFromProject({ xmlText, fileName, serverPath })
  } catch {
    alert('Could not open file: ' + serverPath)
  }
}

function onFileRenamed({ oldPath, newPath, newName }) {
  const tab = tabs.value.find(t => t.serverPath === oldPath)
  if (tab) {
    tab.serverPath = newPath
    tab.fileName = newName
  }
}

async function saveDiagram() {
  const tab = activeTab.value
  if (tab.serverPath) {
    await writeFile(tab.serverPath, buildXml(tab))
    tab.isDirty = false
    return
  }
  if (currentProjectRoot.value !== null) {
    let filename = tab.fileName
    if (!filename) {
      filename = prompt('Enter filename for the diagram:', 'diagram.xml')
      if (!filename) return
      if (!filename.endsWith('.xml')) filename += '.xml'
      tab.fileName = filename
    }
    const serverPath = currentProjectRoot.value
      ? `${currentProjectRoot.value}/${filename}`
      : filename
    await writeFile(serverPath, buildXml(tab))
    tab.serverPath = serverPath
    tab.isDirty = false
    return
  }
  let filename = tab.fileName
  if (!filename) {
    filename = prompt('Enter filename for the diagram:', 'diagram.xml')
    if (!filename) return
    if (!filename.endsWith('.xml')) filename += '.xml'
    tab.fileName = filename
  }
  downloadXml(filename, tab)
  tab.isDirty = false
}

function downloadXml(filename, tab) {
  const xml = buildXml(tab)
  const blob = new Blob([xml], { type: 'application/xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function buildXml(tab) {
  const escape = str => String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const elementsXml = tab.placedItems.map((item, i) => {
    const tag = escape(typeToTag(item.type))
    const base = `    <${tag} id="${i}" icon="${escape(item.iconName)}" x="${item.x}" y="${item.y}"`
    const extras = Object.entries(item)
      .filter(([k]) => !['type', 'iconName', 'x', 'y'].includes(k))
      .map(([k, v]) => ` ${k}="${escape(v)}"`)
      .join('')
    return base + extras + `/>`
  }).join('\n')

  const connectionsXml = tab.connections.map(conn =>
    `    <${escape(conn.type)} from="${conn.from}" to="${conn.to}"/>`
  ).join('\n')

  const diagramAttrs = [
    ` version="0.1"`,
    tab.diagramName ? ` name="${escape(tab.diagramName)}"` : '',
    tab.diagramDescription ? ` description="${escape(tab.diagramDescription)}"` : '',
  ].join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<dspn-diagram${diagramAttrs}>
  <elements>
${elementsXml}
  </elements>
  <connections>
${connectionsXml}
  </connections>
</dspn-diagram>`
}

// ── Zoom ──────────────────────────────────────────────────────────────────────

const CANVAS_W = 4000
const CANVAS_H = 3000
const canvasContainerRefs = {}

function setCanvasContainerRef(el, tabId) {
  if (el) canvasContainerRefs[tabId] = el
  else delete canvasContainerRefs[tabId]
}

function minZoom(tab) {
  const el = canvasContainerRefs[tab.id]
  if (!el) return 0.1
  return Math.max(el.clientWidth / CANVAS_W, el.clientHeight / CANVAS_H)
}

function sceneWrapperStyle(tab) {
  if (tab.placedItems.length === 0) return {}
  const padding = 100
  const maxX = Math.max(...tab.placedItems.map(i => i.x)) + ITEM_HW + padding
  const maxY = Math.max(...tab.placedItems.map(i => i.y)) + ITEM_HH + padding
  return {
    width:  maxX * tab.zoom + 'px',
    height: maxY * tab.zoom + 'px',
  }
}

function zoomIn(tab) {
  tab.zoom = Math.min(2, +(tab.zoom + 0.1).toFixed(2))
}

function zoomOut(tab) {
  tab.zoom = Math.max(+minZoom(tab).toFixed(2), +(tab.zoom - 0.1).toFixed(2))
}

async function fitToView(tab) {
  await nextTick()
  const container = canvasContainerRefs[tab.id]
  if (!container || tab.placedItems.length === 0) return

  const padding = 60
  const xs = tab.placedItems.map(i => i.x)
  const ys = tab.placedItems.map(i => i.y)
  const left   = Math.min(...xs) - ITEM_HW - padding
  const top    = Math.min(...ys) - ITEM_HH - padding
  const right  = Math.max(...xs) + ITEM_HW + padding
  const bottom = Math.max(...ys) + ITEM_HH + padding

  const scaleX = container.clientWidth  / (right - left)
  const scaleY = container.clientHeight / (bottom - top)
  tab.zoom = Math.min(scaleX, scaleY, 1, +minZoom(tab).toFixed(2) * 4)

  await nextTick()
  container.scrollLeft = left * tab.zoom
  container.scrollTop  = top  * tab.zoom
}

// ── Canvas interactions ───────────────────────────────────────────────────────

function onDragStart(event) {
  const iconName = event.currentTarget.getAttribute('data-icon')
  const type = event.currentTarget.getAttribute('data-type')
  event.dataTransfer.setData('text/plain', JSON.stringify({ iconName, type }))
}

function onCanvasDragOver(event) {
  event.preventDefault()
}

function onCanvasDrop(event, tab) {
  event.preventDefault()
  const data = event.dataTransfer.getData('text/plain')
  try {
    const { iconName, type } = JSON.parse(data)
    const rect = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - rect.left + event.currentTarget.scrollLeft) / tab.zoom
    const y = (event.clientY - rect.top + event.currentTarget.scrollTop) / tab.zoom
    const item = { x, y, iconName, type }
    const count = n => tab.placedItems.filter(i => i.type === n).length + 1
    if (type === 'data-source')         { item.name = `Data Source ${count(type)}`;         item.path = '' }
    if (type === 'data-product')        { item.name = `Data Product ${count(type)}`;        item.openAPIUrl = '' }
    if (type === 'exposed-data')        { item.name = `Exposed Data ${count(type)}` }
    if (type === 'policy-doc')              { item.name = `Data Usage Policy ${count(type)}`;      item.filename = '' }
    if (type === 'transformation-policy')   { item.name = `Transformation Policy ${count(type)}`; item.filename = '' }
    if (type === 'authorization')       { item.name = `Authorization ${count(type)}`;  item.expression = '' }
    if (type === 'user-attributes')     { item.name = `User Attributes ${count(type)}`;   item.attributes = '' }
    if (type === 'request-attributes')  { item.name = `Request Attributes ${count(type)}`; item.attributes = '' }
    if (type === 'system-attributes')   { item.name = `System Attributes ${count(type)}`; item.attributes = '' }
    if (type === 'filter')              { item.name = `Filter ${count(type)}`;              item.expression = '' }
    if (type === 'projection')          { item.name = `Projection ${count(type)}`;          item.expression = '' }
    if (type === 'encryption')          { item.name = `Encryption ${count(type)}`;          item.expression = '' }
    if (type === 'anonymization')       { item.name = `Anonymization ${count(type)}`;       item.mode = 'full'; item.algorithm = '' }
    if (type === 'rename')              { item.name = `Rename ${count(type)}`;              item.expression = '' }
    if (type === 'usage')               { item.name = `Usage ${count(type)}`;               item.expression = '' }
    if (type === 'shared-data-product') { item.name = `Shared Data Product ${count(type)}`; item.endpoint = '' }
    if (type === 'label') { item.text = ''; item.fontSize = 15; item.x = x - 100; item.y = y - 16; item.width = 200; item.height = 32 }
    if (type === 'group') { item.name = `Group ${count(type)}`; item.x = x - 100; item.y = y - 60; item.width = 200; item.height = 120 }
    pushUndo(tab)
    tab.placedItems.push(item)
    if (type === 'label') { tab.editingLabelIndex = tab.placedItems.length - 1 }
    tab.isDirty = true
  } catch (e) {
    console.error('Invalid drop data', e)
  }
}

function isGroupBorderClick(event) {
  const r = event.currentTarget.getBoundingClientRect()
  const lx = event.clientX - r.left
  const ly = event.clientY - r.top
  const tol = 8
  return lx <= tol || ly <= tol || lx >= r.width - tol || ly >= r.height - tol
}

function onItemMouseDown(event, index, tab) {
  if (tab.placedItems[index]?.type === 'group' && !isGroupBorderClick(event)) return
  event.stopPropagation()
  event.preventDefault()
  const canvasEl = event.currentTarget.closest('.canvas-container')
  const rect = canvasEl.getBoundingClientRect()
  const mx0 = (event.clientX - rect.left + canvasEl.scrollLeft) / tab.zoom
  const my0 = (event.clientY - rect.top  + canvasEl.scrollTop)  / tab.zoom

  tab.draggingIndex = index
  tab.hasDragged = false
  const preSnapshot = {
    placedItems: JSON.parse(JSON.stringify(tab.placedItems)),
    connections: JSON.parse(JSON.stringify(tab.connections)),
  }

  const dragIndices = tab.selectedItems.has(index) ? [...tab.selectedItems] : [index]
  const offsets = dragIndices.map(i => ({
    i,
    dx: mx0 - tab.placedItems[i].x,
    dy: my0 - tab.placedItems[i].y,
  }))

  const onMouseMove = (e) => {
    tab.hasDragged = true
    const r = canvasEl.getBoundingClientRect()
    const mx = (e.clientX - r.left + canvasEl.scrollLeft) / tab.zoom
    const my = (e.clientY - r.top  + canvasEl.scrollTop)  / tab.zoom
    for (const { i, dx, dy } of offsets) {
      tab.placedItems[i].x = mx - dx
      tab.placedItems[i].y = my - dy
    }
  }

  const onMouseUp = () => {
    if (tab.hasDragged) {
      tab.undoStack.push(preSnapshot)
      tab.redoStack = []
      tab.isDirty = true
    }
    tab.draggingIndex = null
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

function onItemClick(event, index, tab) {
  if (tab.placedItems[index]?.type === 'group' && !isGroupBorderClick(event)) return
  event.stopPropagation()
  if (tab.hasDragged) {
    tab.hasDragged = false
    return
  }
  if (tab.isConnecting && tab.connectFirst !== null) {
    if (tab.connectFirst !== index) {
      const a = tab.connectFirst
      const b = index
      const alreadyConnected = tab.connections.some(
        c => (c.from === a && c.to === b) || (c.from === b && c.to === a)
      )
      if (!alreadyConnected) {
        let allowed = allowedTypes(a, b, tab)
        // Junction as source: assigned = max 1 outgoing, flow = unlimited
        if (isJunction(tab.placedItems[a].type) && tab.connections.some(c => c.from === a)) {
          allowed = allowed.filter(t => t !== 'assigned')
        }
        if (allowed.length === 0) {
          const fromType = tab.placedItems[a].type
          const toType = tab.placedItems[b].type
          const admissible = Object.entries(connectionRules)
            .filter(([key]) => key.startsWith(fromType + ':'))
            .map(([key, types]) => ({ to: key.split(':')[1], types }))
          tab.invalidConnection = { fromType, toType, admissible }
        } else if (allowed.length === 1) {
          pushUndo(tab)
          tab.connections.push({ from: a, to: b, type: allowed[0] })
          populateRequestAttributes(tab, a, b)
          tab.isDirty = true
        } else {
          tab.pendingConnection = { from: a, to: b, allowed }
        }
      }
    }
    tab.isConnecting = false
    tab.connectFirst = null
    return
  }
  tab.selectedConnection = null
  tab.diagramSelected = false

  if (event.shiftKey) {
    if (tab.selectedItems.has(index)) {
      tab.selectedItems.delete(index)
      if (tab.selectedItem === index) {
        tab.selectedItem = tab.selectedItems.size > 0 ? [...tab.selectedItems].at(-1) : null
      }
    } else {
      tab.selectedItems.add(index)
      tab.selectedItem = index
    }
  } else {
    const onlyThis = tab.selectedItems.size === 1 && tab.selectedItems.has(index)
    tab.selectedItems = onlyThis ? new Set() : new Set([index])
    tab.selectedItem = onlyThis ? null : index
  }
}

function onItemDblClick(event, index, tab) {
  if (tab.placedItems[index]?.type !== 'label') return
  event.stopPropagation()
  pushUndo(tab)
  tab.editingLabelIndex = index
}

function startConnection(index, tab) {
  tab.isConnecting = true
  tab.connectFirst = index
  tab.selectedItem = null
}

function confirmConnection(tab, type) {
  if (tab.pendingConnection) {
    const { from } = tab.pendingConnection
    if (type === 'assigned' && isJunction(tab.placedItems[from]?.type) && tab.connections.some(c => c.from === from)) {
      tab.pendingConnection = null
      return
    }
    pushUndo(tab)
    const { from: pFrom, to: pTo } = tab.pendingConnection
    tab.connections.push({ ...tab.pendingConnection, type })
    populateRequestAttributes(tab, pFrom, pTo)
    tab.pendingConnection = null
    tab.isDirty = true
  }
}

function cancelConnection(tab) {
  tab.pendingConnection = null
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2)
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq))
  return Math.sqrt((px - (x1 + t * dx)) ** 2 + (py - (y1 + t * dy)) ** 2)
}

function toggleSelect(tab) {
  tab.isSelecting = !tab.isSelecting
  if (!tab.isSelecting) tab.selectionRect = null
}

function alignItems(tab, direction) {
  if (tab.selectedItems.size < 2) return
  const indices = [...tab.selectedItems]
  pushUndo(tab)
  const hasBox = item => item.type === 'group' || item.type === 'label'
  const centerX = i => {
    const item = tab.placedItems[i]
    return hasBox(item) ? item.x + item.width / 2 : item.x
  }
  const centerY = i => {
    const item = tab.placedItems[i]
    return hasBox(item) ? item.y + item.height / 2 : item.y
  }
  if (direction === 'horizontal') {
    const avgY = indices.reduce((sum, i) => sum + centerY(i), 0) / indices.length
    indices.forEach(i => {
      const item = tab.placedItems[i]
      item.y = hasBox(item) ? avgY - item.height / 2 : avgY
    })
  } else {
    const avgX = indices.reduce((sum, i) => sum + centerX(i), 0) / indices.length
    indices.forEach(i => {
      const item = tab.placedItems[i]
      item.x = hasBox(item) ? avgX - item.width / 2 : avgX
    })
  }
  tab.isDirty = true
}

function onGroupResizeMouseDown(event, index, corner, tab) {
  event.preventDefault()
  const item = tab.placedItems[index]
  const canvasEl = event.currentTarget.closest('.canvas-container')

  const preSnapshot = {
    placedItems: JSON.parse(JSON.stringify(tab.placedItems)),
    connections: JSON.parse(JSON.stringify(tab.connections)),
  }
  let hasMoved = false

  const onMouseMove = (e) => {
    hasMoved = true
    const r = canvasEl.getBoundingClientRect()
    const mx = (e.clientX - r.left + canvasEl.scrollLeft) / tab.zoom
    const my = (e.clientY - r.top  + canvasEl.scrollTop)  / tab.zoom
    const right  = item.x + item.width
    const bottom = item.y + item.height
    if (corner === 'nw') {
      item.x = Math.min(mx, right - 30);  item.y = Math.min(my, bottom - 30)
      item.width = right - item.x;        item.height = bottom - item.y
    } else if (corner === 'ne') {
      item.y = Math.min(my, bottom - 30)
      item.width  = Math.max(mx - item.x, 30); item.height = bottom - item.y
    } else if (corner === 'sw') {
      item.x = Math.min(mx, right - 30)
      item.width  = right - item.x;  item.height = Math.max(my - item.y, 30)
    } else {
      item.width  = Math.max(mx - item.x, 30); item.height = Math.max(my - item.y, 30)
    }
  }

  const onMouseUp = () => {
    if (hasMoved) {
      tab.undoStack.push(preSnapshot)
      tab.redoStack = []
      tab.isDirty = true
    }
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

function onCanvasMouseDownCapture(event, tab) {
  if (!tab.isSelecting) return
  if (event.target.closest('.placed')) return
  event.stopPropagation()
  event.preventDefault()

  const canvasEl = event.currentTarget
  const r = canvasEl.getBoundingClientRect()
  const x0 = (event.clientX - r.left + canvasEl.scrollLeft) / tab.zoom
  const y0 = (event.clientY - r.top + canvasEl.scrollTop) / tab.zoom

  tab.selectionRect = { x0, y0, x1: x0, y1: y0 }

  const onMouseMove = (e) => {
    const rr = canvasEl.getBoundingClientRect()
    const x1 = (e.clientX - rr.left + canvasEl.scrollLeft) / tab.zoom
    const y1 = (e.clientY - rr.top + canvasEl.scrollTop) / tab.zoom
    tab.selectionRect = { x0, y0, x1, y1 }
  }

  const onMouseUp = () => {
    if (tab.selectionRect) {
      const minX = Math.min(tab.selectionRect.x0, tab.selectionRect.x1)
      const maxX = Math.max(tab.selectionRect.x0, tab.selectionRect.x1)
      const minY = Math.min(tab.selectionRect.y0, tab.selectionRect.y1)
      const maxY = Math.max(tab.selectionRect.y0, tab.selectionRect.y1)
      tab.selectedItems = new Set(
        tab.placedItems
          .map((item, i) => ({ item, i }))
          .filter(({ item }) => {
            if (isJunction(item.type)) {
              return item.x + 10 > minX && item.x - 10 < maxX && item.y + 10 > minY && item.y - 10 < maxY
            }
            if (item.type === 'group') {
              return item.x + item.width > minX && item.x < maxX && item.y + item.height > minY && item.y < maxY
            }
            return item.x + 49.5 > minX && item.x - 49.5 < maxX && item.y + 26 > minY && item.y - 26 < maxY
          })

          .map(({ i }) => i)
      )
      tab.selectionRect = null
    }
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

function onCanvasClick(event, tab) {
  if (tab.isSelecting) return
  const rect = event.currentTarget.getBoundingClientRect()
  const mx = (event.clientX - rect.left + event.currentTarget.scrollLeft) / tab.zoom
  const my = (event.clientY - rect.top + event.currentTarget.scrollTop) / tab.zoom
  for (let i = 0; i < tab.connections.length; i++) {
    const pts = connectionPoints(tab.connections[i], tab)
    if (distToSegment(mx, my, pts.x1, pts.y1, pts.x2, pts.y2) < 6) {
      tab.selectedConnection = i
      tab.selectedItem = null
      tab.diagramSelected = false
      return
    }
  }
  tab.selectedConnection = null
  tab.selectedItem = null
  tab.selectedItems = new Set()
  tab.diagramSelected = true
}

function deleteConnection(tab, index) {
  pushUndo(tab)
  tab.connections.splice(index, 1)
  tab.selectedConnection = null
  tab.isDirty = true
}

function deleteItem(index, tab) {
  pushUndo(tab)
  tab.isDirty = true
  tab.placedItems.splice(index, 1)
  tab.connections = tab.connections
    .filter(c => c.from !== index && c.to !== index)
    .map(c => ({
      ...c,
      from: c.from > index ? c.from - 1 : c.from,
      to:   c.to   > index ? c.to   - 1 : c.to,
    }))
  tab.selectedItem = null
  tab.selectedItems = new Set(
    [...tab.selectedItems]
      .filter(i => i !== index)
      .map(i => i > index ? i - 1 : i)
  )
}

// ── Styling helpers ───────────────────────────────────────────────────────────

function basename(path) {
  return path?.split('/').pop() ?? path
}

function iconColor(type) {
  const colors = {
    'data-source': '#6C8EBF', 'data-product': '#6C8EBF',
    'policy-doc': '#D6B656', 'transformation-policy': '#D6B656', 'usage': '#D6B656', 'filter': '#D6B656',
    'projection': '#D6B656', 'encryption': '#D6B656', 'anonymization': '#D6B656', 'rename': '#D6B656', 'authorization': '#D6B656',
    'exposed-data': '#9673A6', 'shared-data-product': '#9673A6',
    'user-attributes': '#82B366', 'request-attributes': '#82B366', 'system-attributes': '#82B366',
  }
  return colors[type] ?? '#333'
}

function iconBgColor(type) {
  const colors = {
    'data-source': '#DAE8FC', 'data-product': '#DAE8FC',
    'policy-doc': '#FFF2CC', 'transformation-policy': '#FFF2CC', 'usage': '#FFF2CC', 'filter': '#FFF2CC',
    'projection': '#FFF2CC', 'encryption': '#FFF2CC', 'anonymization': '#FFF2CC', 'rename': '#FFF2CC', 'authorization': '#FFF2CC',
    'exposed-data': '#E1D5E7', 'shared-data-product': '#E1D5E7',
    'user-attributes': '#D5E8D4', 'request-attributes': '#D5E8D4', 'system-attributes': '#D5E8D4',
  }
  return colors[type] ?? '#ffffff'
}
</script>

<style scoped>
.editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  box-sizing: border-box;
  padding: 10px;
  gap: 10px;
  background: #d0dce8;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.editor-body {
  display: flex;
  gap: 10px;
  flex: 1;
  overflow: hidden;
}

/* ── Palette ─────────────────────────────────────────────────────────────── */

.palette {
  border-radius: 6px;
  background: #f5f0fa;
  box-shadow: 0 2px 6px rgba(0,0,0,0.12);
  padding: 0.25rem;
  width: 140px;
  flex-shrink: 0;
  background: white;
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
  overflow-y: auto;
}

.palette-section {
  border-top: 1px solid #ddd;
  padding-top: 0.1rem;
}

.palette-section:first-child {
  border-top: none;
  padding-top: 0;
}

.palette-section--data .icon        { color: #6C8EBF; }
.palette-section--others .icon      { color: #888; }
.palette-subsection--transformation .icon { color: #D6B656; }
.palette-section--exposed .icon     { color: #9673A6; }
.palette-section--attributes .icon  { color: #82B366; }

.palette-section h4 {
  margin: 0 0 0.05rem;
  font-size: 0.65rem;
  color: #333;
  font-weight: 600;
}

.transformation-grid {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.palette-subsubsection {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.2rem;
  padding: 0;
}

.palette-subsubsection .label {
  font-size: 0.62rem;
  color: #555;
  line-height: 1.1;
  white-space: nowrap;
}

.icon {
  font-size: 0.75rem;
  cursor: grab;
  padding: 0.15rem;
  border-radius: 4px;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.2rem;
  height: 1.2rem;
  color: #333;
  flex-shrink: 0;
}

.icon:hover {
  background: #f0f0f0;
}

/* ── Tab area ────────────────────────────────────────────────────────────── */

.tab-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 6px;
}

.tab-bar {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  padding: 0.4rem 0.5rem 0;
  background: #1e3a5c;
  border-bottom: 2px solid #2a5298;
  flex-shrink: 0;
  overflow-x: auto;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  border: 1px solid #3a6090;
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  background: #2a4f7a;
  cursor: pointer;
  font-size: 0.78rem;
  color: #a8c4e0;
  transition: background 0.15s;
  white-space: nowrap;
  max-width: 180px;
}

.tab-btn:hover {
  background: #325d8c;
}

.tab-btn.active {
  background: #f0f5fa;
  color: #1a3a5c;
  border-color: #2a5298;
  border-bottom-color: #f0f5fa;
  font-weight: 600;
  position: relative;
  bottom: -2px;
  padding-bottom: 0.45rem;
}

.tab-title {
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.tab-close {
  font-size: 0.9rem;
  line-height: 1;
  color: #7aafd4;
  padding: 0 2px;
  border-radius: 2px;
}

.tab-close:hover {
  background: #3a6090;
  color: #fff;
}

.tab-btn.active .tab-close {
  color: #557;
}

.tab-btn.active .tab-close:hover {
  background: #d0d8e8;
  color: #333;
}

.tab-new {
  padding: 0.25rem 0.6rem;
  border: 1px solid #3a6090;
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  background: transparent;
  cursor: pointer;
  font-size: 1rem;
  color: #a8c4e0;
  line-height: 1;
}

.tab-new:hover {
  background: #2a5298;
  color: #fff;
}

/* ── Canvas wrapper ──────────────────────────────────────────────────────── */

.canvas-area {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.view-toggle {
  position: absolute;
  bottom: 12px;
  left: 12px;
  z-index: 10;
  display: flex;
  gap: 3px;
  border-radius: 5px;
  padding: 3px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  transition: background 0.2s;
}

.view-toggle--dark {
  background: #1a3a5c;
}

.view-toggle--light {
  background: #e8edf3;
}

.view-toggle button {
  padding: 4px 14px;
  font-size: 12px;
  border: none;
  border-radius: 3px;
  background: transparent;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.view-toggle--dark button {
  color: #a0b8d0;
}

.view-toggle--dark button.active {
  background: #2a5298;
  color: #fff;
}

.view-toggle--light button {
  color: #555;
}

.view-toggle--light button.active {
  background: #fff;
  color: #2a5298;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
}

.xml-view {
  position: absolute;
  inset: 0;
  overflow: auto;
  background: #1e1e2e;
  border-radius: 6px;
  padding: 1rem 1rem 3.5rem 1rem;
}

.xml-content {
  margin: 0;
  font-family: 'Fira Code', 'Cascadia Code', monospace;
  font-size: 13px;
  color: #cdd6f4;
  white-space: pre;
  line-height: 1.6;
}

.no-diagram-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  font-size: 1rem;
  text-align: center;
  padding: 2rem;
}

.canvas-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
  gap: 0.5rem;
  overflow: hidden;
  background: #f0f5fa;
}

.canvas-container {
  position: absolute;
  top: 48px;
  right: 0;
  bottom: 0;
  left: 0;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: auto;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.canvas-scene-wrapper {
  position: relative;
  flex-shrink: 0;
  overflow: hidden;
}

.canvas-scene {
  position: absolute;
  top: 0;
  left: 0;
  width: 4000px;
  height: 3000px;
}

.zoom-controls {
  position: absolute;
  bottom: 12px;
  right: 12px;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.zoom-btn {
  width: 28px;
  height: 28px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  transition: background 0.15s;
}

.zoom-btn:hover {
  background: #f0f0f0;
}

.canvas-toolbar {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  pointer-events: none;
}

.canvas-toolbar > * {
  pointer-events: all;
}

.btn-canvas-save,
.btn-canvas-clear,
.btn-canvas-undo,
.btn-canvas-align,
.btn-canvas-select {
  padding: 0.3rem 0.7rem;
  height: 28px;
  box-sizing: border-box;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  transition: background 0.2s;
  flex-shrink: 0;
}


.btn-canvas-align {
  margin-left: auto;
  background-color: #e8e8e8;
  color: #444;
}

.btn-canvas-align + .btn-canvas-align,
.btn-canvas-align + .btn-canvas-select,
.btn-canvas-select + .btn-canvas-undo {
  margin-left: 0;
}

.btn-canvas-align:hover:not(:disabled) {
  background-color: #d0d0d0;
}

.btn-canvas-align:disabled {
  opacity: 0.4;
  cursor: default;
}

.btn-canvas-select {
  background-color: #e8e8e8;
  color: #444;
}

.btn-canvas-select:hover:not(.active) {
  background-color: #d0d0d0;
}

.btn-canvas-select.active {
  background-color: #646cff;
  color: white;
}

.btn-canvas-undo {
  background-color: #e8e8e8;
  color: #444;
}

.btn-canvas-undo + .btn-canvas-undo {
  margin-left: 0;
}

.btn-canvas-undo:hover:not(:disabled) {
  background-color: #d0d0d0;
}

.btn-canvas-undo:disabled {
  opacity: 0.4;
  cursor: default;
}

.btn-canvas-save {
  background-color: #42b883;
  color: white;
}

.btn-canvas-save:hover {
  background-color: #359268;
}

.btn-canvas-clear {
  background-color: #e0e0e0;
  color: #555;
}

.btn-canvas-clear:hover {
  background-color: #c8c8c8;
}

.selecting,
.selecting * {
  cursor: crosshair !important;
}

.selection-rect {
  position: absolute;
  border: 2px dashed #646cff;
  background: rgba(100, 108, 255, 0.07);
  pointer-events: none;
  z-index: 20;
}

.canvas-filename {
  font-size: 0.75rem;
  color: #444;
  font-style: italic;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.canvas-connecting {
  font-size: 0.75rem;
  color: #646cff;
  font-weight: 600;
  animation: pulse 1s infinite;
}

/* ── Properties panel ────────────────────────────────────────────────────── */

.properties-panel {
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  padding: 0.75rem;
  max-height: 150px;
  overflow-y: auto;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.properties-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.properties-content h4 {
  margin: 0 0 0.5rem;
  font-size: 0.85rem;
  color: #333;
}

.property {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
  align-items: center;
  font-size: 0.8rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
}

.property .label {
  font-weight: 600;
  min-width: 80px;
  color: #666;
}

.property .value {
  color: #333;
}

.property .input-value {
  border: 1px solid #ddd;
  border-radius: 3px;
  padding: 0.2rem 0.4rem;
  font-size: 0.75rem;
  width: 200px;
  background: white;
}

.property--fill {
  flex: 1;
  align-items: stretch;
  min-height: 0;
}

.input-value--fill {
  flex: 1;
  width: auto;
  box-sizing: border-box;
}

.input-value--short {
  width: 60px;
}

.input-value--json {
  font-family: monospace;
  font-size: 0.72rem;
  resize: vertical;
  min-height: 60px;
  width: 100%;
  box-sizing: border-box;
}

.input-value--json-invalid {
  border-color: #e06060;
  background: #fff5f5;
  color: #c00;
}

.input-value--multiselect {
  width: 200px;
  height: 80px;
}

.prop-no-api {
  font-size: 0.72rem;
  color: #aaa;
  font-style: italic;
}

.prop-load-btn {
  padding: 0.2rem 0.5rem;
  font-size: 0.72rem;
  border: 1px solid #aac0d8;
  border-radius: 3px;
  background: #e8f0f8;
  color: #2a4f7a;
  cursor: pointer;
  white-space: nowrap;
}
.prop-load-btn:hover:not(:disabled) { background: #c8ddf0; }
.prop-load-btn:disabled { opacity: 0.4; cursor: default; }

.input-textarea {
  flex: 1;
  resize: none;
  font-family: inherit;
  box-sizing: border-box;
  min-height: 0;
}

.properties-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-size: 0.8rem;
}

.properties-empty p {
  margin: 0;
}

/* ── Diagram canvas ──────────────────────────────────────────────────────── */

.diagram-canvas {
  position: absolute;
  inset: 0;
}

.connections {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none;
}

.placed-items {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
}

.placed {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 99px;
  height: 52px;
  border: 1.5px solid #333;
  border-radius: 4px;
  background: white;
  cursor: grab;
  pointer-events: auto;
  transition: all 0.2s ease;
}

.placed.dragging {
  cursor: grabbing;
  transition: none;
  z-index: 10;
}

.placed i {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 0.75rem;
}

.placed.selected {
  outline: 2px solid #646cff;
  outline-offset: 4px;
}

.placed:hover:not(.selected) {
  outline: 1px solid #aaa;
  outline-offset: 2px;
}

/* ── Modals ──────────────────────────────────────────────────────────────── */

.conn-modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.conn-modal {
  background: white;
  border-radius: 6px;
  padding: 1rem 1.5rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 180px;
}

.conn-modal p {
  margin: 0 0 0.25rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #333;
}

.conn-modal button {
  padding: 0.4rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #f5f5f5;
  cursor: pointer;
  font-size: 0.8rem;
  text-transform: capitalize;
  transition: background 0.2s;
}

.conn-modal button:hover {
  background: #e0e0e0;
}

.conn-modal button.cancel {
  border-color: #e74c3c;
  color: #e74c3c;
  background: white;
}

.conn-modal button.cancel:hover {
  background: #fdf0f0;
}

.conn-modal--error {
  min-width: 260px;
  max-width: 360px;
}

.conn-modal-title {
  font-size: 0.95rem !important;
  color: #c0392b !important;
}

.conn-modal-subtitle {
  font-weight: 400 !important;
  color: #555 !important;
}

.conn-modal-list {
  margin: 0;
  padding-left: 1rem;
  font-size: 0.8rem;
  color: #333;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* ── Connection overlays ─────────────────────────────────────────────────── */

.conn-overlays {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none;
}

.conn-delete-btn {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 20px; height: 20px;
  border-radius: 50%;
  border: none;
  background: #e74c3c;
  color: white;
  font-size: 0.55rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  z-index: 6;
  pointer-events: all;
}

.conn-delete-btn:hover {
  background: #c0392b;
}

/* ── Item buttons ────────────────────────────────────────────────────────── */

.delete-btn {
  position: absolute;
  bottom: -22px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px; height: 20px;
  border-radius: 50%;
  border: none;
  background: #e74c3c;
  color: white;
  font-size: 0.55rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  z-index: 5;
}

.delete-btn:hover {
  background: #c0392b;
}

.connect-start-btn {
  position: absolute;
  right: -22px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px; height: 20px;
  border-radius: 50%;
  border: none;
  background: #646cff;
  color: white;
  font-size: 0.55rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  z-index: 5;
}

.connect-start-btn:hover {
  background: #535bf2;
}

.open-policy-btn {
  position: absolute;
  left: -22px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px; height: 20px;
  border-radius: 50%;
  border: none;
  background: #D6B656;
  color: white;
  font-size: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  z-index: 5;
}

.open-policy-btn:hover {
  background: #b8973a;
}

/* ── Junctions ───────────────────────────────────────────────────────────── */

.junction-circle {
  display: inline-block;
  width: 10px; height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.junction-and {
  background: #000;
}

.junction-or {
  background: white;
  border: 1.5px solid #000;
  box-sizing: border-box;
}

.placed--junction {
  width: 20px; height: 20px;
  border: none !important;
  background: transparent !important;
  border-radius: 50%;
}

.placed--label {
  border-radius: 4px;
  overflow: visible;
}

.placed-label-text {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  color: #333;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  padding: 0 4px;
  box-sizing: border-box;
  pointer-events: none;
}

.label-textarea {
  display: block;
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: #333;
  padding: 0 4px;
  box-sizing: border-box;
  font-family: inherit;
}

.placed:not(.placed--group) {
  z-index: 1;
}

.placed--group {
  transform: none;
  border: 2px dashed #888 !important;
  background: rgba(180, 180, 180, 0.08) !important;
  border-radius: 6px;
  z-index: 0;
}

.group-resize-handle {
  position: absolute;
  width: 12px;
  height: 12px;
  background: transparent;
  z-index: 2;
}

.group-resize-handle--nw { top: -5px;    left: -5px;   cursor: nw-resize; }
.group-resize-handle--ne { top: -5px;    right: -5px;  cursor: ne-resize; }
.group-resize-handle--sw { bottom: -5px; left: -5px;   cursor: sw-resize; }
.group-resize-handle--se { bottom: -5px; right: -5px;  cursor: se-resize; }

.placed-group-name {
  position: absolute;
  top: 5px;
  left: 8px;
  font-size: calc(0.7rem + 1px);
  font-weight: 700;
  color: #888;
  pointer-events: none;
}

.junction-in-canvas {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 20px; height: 20px;
}

/* ── Item label ──────────────────────────────────────────────────────────── */

.item-label {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  font-size: calc(0.65rem + 1px);
  font-weight: 700;
  color: #333;
  padding: 0 2px;
  text-align: center;
  word-break: break-word;
  pointer-events: none;
}

.item-expression {
  font-size: calc(0.6rem + 1px);
  color: #555;
  font-style: italic;
}

.item-mode-badge {
  font-size: calc(0.55rem + 1px);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #7a5200;
  background: #ffe0a0;
  border-radius: 3px;
  padding: 0 3px;
  line-height: 1.4;
}

.app-header {
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 40px;
  background: linear-gradient(90deg, #1a3a5c 0%, #2a5298 100%);
  flex-shrink: 0;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.25);
  justify-content: space-between;
}

.app-title {
  font-size: 15px;
  font-weight: 600;
  color: #e8edf3;
  letter-spacing: 0.04em;
}

.app-version {
  font-size: 12px;
  color: #a0b4cc;
  letter-spacing: 0.03em;
}

.app-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  background: linear-gradient(90deg, #1a3a5c 0%, #2a5298 100%);
  flex-shrink: 0;
  border-radius: 6px;
  font-size: 11px;
  color: #a0b4cc;
}

.app-footer a {
  color: #c8d8ea;
  text-decoration: none;
}

.app-footer a:hover {
  text-decoration: underline;
}

.project-manager-panel {
  width: 200px;
  flex-shrink: 0;
  background: #f0f5fa;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.12);
}
</style>
