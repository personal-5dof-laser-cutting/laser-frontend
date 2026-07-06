<script setup lang="ts">
import { ref, computed } from 'vue'
import CanvasItem from '@/components/CanvasItem.vue'
import CanvasToolbar from '@/components/CanvasToolbar.vue'
import FloatingSidemenu from '@/components/FloatingSidemenu.vue'
import { useProjectStore, parseUnitToPx } from '@/stores/useProjectStore'
import { useCutterStore } from '@/stores/useCutterStore'
import { useStore } from '@/stores/useStore'

const projectStore = useStore(useProjectStore)
const { uploadSvg, updateSvg, removeSvg, selectSvg, duplicateSvg, resetProject } =
  useProjectStore.getState()
const svgs = computed(() => projectStore.value.svgs)
const selectedId = computed(() => projectStore.value.selectedId)

const cutterStore = useStore(useCutterStore)
const cutbedWidth = computed(() => {
  const valWithUnit = `${cutterStore.value.cutbed.width}mm`
  return parseUnitToPx(valWithUnit)
})
const cutbedDepth = computed(() => {
  const valWithUnit = `${cutterStore.value.cutbed.depth}mm`
  return parseUnitToPx(valWithUnit)
})

const svgRef = ref<SVGSVGElement | null>(null)
const viewportRef = ref<SVGGElement | null>(null)

const pan = ref({ x: 0, y: 0 })
const scale = ref(1)
const isDragging = ref(false)
const dragStart = ref({ mouseX: 0, mouseY: 0, panX: 0, panY: 0 })

const getBaseSVGPosition = (evt: MouseEvent) => {
  if (!svgRef.value) return { x: 0, y: 0 }
  const CTM = svgRef.value.getScreenCTM()
  if (!CTM) return { x: 0, y: 0 }

  const pt = svgRef.value.createSVGPoint()
  pt.x = evt.clientX
  pt.y = evt.clientY
  return pt.matrixTransform(CTM.inverse())
}

const getMousePosition = (evt: MouseEvent) => {
  if (!svgRef.value || !viewportRef.value) return { x: 0, y: 0 }

  const CTM = viewportRef.value.getScreenCTM()
  if (!CTM) return { x: 0, y: 0 }

  const pt = svgRef.value.createSVGPoint()
  pt.x = evt.clientX
  pt.y = evt.clientY

  return pt.matrixTransform(CTM.inverse())
}
const startDragging = (evt: MouseEvent) => {
  if (evt.button !== 0) return

  isDragging.value = true
  const mousePos = getBaseSVGPosition(evt)

  dragStart.value = {
    mouseX: mousePos.x,
    mouseY: mousePos.y,
    panX: pan.value.x,
    panY: pan.value.y,
  }
}

const handleDrag = (evt: MouseEvent) => {
  if (!isDragging.value) return

  const mousePos = getBaseSVGPosition(evt)
  const dx = mousePos.x - dragStart.value.mouseX
  const dy = mousePos.y - dragStart.value.mouseY

  pan.value = {
    x: dragStart.value.panX + dx,
    y: dragStart.value.panY + dy,
  }
}

const stopDragging = () => {
  isDragging.value = false
}

const handleZoom = (evt: WheelEvent) => {
  const zoomSensitivity = 1.1
  const oldScale = scale.value

  const newScale = evt.deltaY < 0 ? oldScale * zoomSensitivity : oldScale / zoomSensitivity

  // INFO: constrain zoom levels (20% to 500%)
  scale.value = Math.max(0.2, Math.min(5, newScale))

  const mousePos = getBaseSVGPosition(evt)

  pan.value = {
    x: mousePos.x - (mousePos.x - pan.value.x) * (scale.value / oldScale),
    y: mousePos.y - (mousePos.y - pan.value.y) * (scale.value / oldScale),
  }
}
</script>

<template>
  <div class="svg-canvas-container">
    <CanvasToolbar />
    <FloatingSidemenu />
    <svg
      viewBox="-50 -50 450 450"
      class="root-svg"
      :class="{ dragging: isDragging }"
      ref="svgRef"
      @mousedown="startDragging"
      @mousemove="handleDrag"
      @mouseup="stopDragging"
      @mouseleave="stopDragging"
      @wheel.prevent="handleZoom"
    >
      <defs>
        <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="#a0a0a0" />
        </pattern>
      </defs>

      <g :transform="`translate(${pan.x}, ${pan.y}) scale(${scale})`" ref="viewportRef">
        <rect
          x="-200000"
          y="-200000"
          width="400000"
          height="400000"
          fill="url(#grid-pattern)"
          @click="selectSvg(null)"
        />

        <CanvasItem
          v-for="item in svgs"
          :key="item.id"
          :item="item"
          :get-mouse-position="getMousePosition"
        />

        <rect
          :x="0"
          :y="0"
          :width="cutbedWidth"
          :height="cutbedDepth"
          rx="1"
          ry="1"
          class="cutbed"
        />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.svg-canvas-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--color-background);
}

.root-svg {
  width: 100%;
  height: 100%;
  display: block;
  user-select: none;
  cursor: grab;
  vector-effect: non-scaling-stroke;
}

.root-svg.dragging {
  cursor: grabbing;
}

.cutbed {
  fill: none;
  stroke: #de6207;
  stroke-width: 1pt;
  vector-effect: non-scaling-stroke;
  stroke-dasharray: 5 5;
}
</style>
