<script setup lang="ts">
import { ref, computed } from 'vue'
import CanvasItem from '@/components/CanvasItem.vue'
import CanvasToolbar from '@/components/CanvasToolbar.vue'
import { useProjectStore } from '@/stores/useProjectStore'
import { useCutterStore } from '@/stores/useCutterStore'
import { useStore } from '@/stores/useStore'

import laserpointerIconUrl from '@/assets/icons/laser_pointer.svg'

const projectStore = useStore(useProjectStore)
const { selectSvg } =
  useProjectStore.getState()
const svgs = computed(() => projectStore.value.svgs)

const cutterStore = useStore(useCutterStore)
const cutbedWidth = computed(() => cutterStore.value.cutbed.width)
const cutbedDepth = computed(() => cutterStore.value.cutbed.depth)

const toolheadPosition = computed(() => cutterStore.value.toolheadPosition)
const laserpointerDim = 20

// Frame the cutbed with a small even margin so the workplane fills as much of
// the canvas as it can; `preserveAspectRatio` then centres it in whatever
// aspect ratio the viewport happens to have.
const viewBox = computed(() => {
  const width = cutbedWidth.value || 400
  const depth = cutbedDepth.value || 400
  const margin = Math.max(width, depth) * 0.06

  return `${-margin} ${-margin} ${width + 2 * margin} ${depth + 2 * margin}`
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
    <svg
      :viewBox="viewBox"
      preserveAspectRatio="xMidYMid meet"
      class="root-svg"
      :class="{ dragging: isDragging }"
      ref="svgRef"
      @mousedown="startDragging"
      @mousemove="handleDrag"
      @mouseup="stopDragging"
      @mouseleave="stopDragging"
      @wheel.prevent="handleZoom"
    >
      <g :transform="`translate(${pan.x}, ${pan.y}) scale(${scale})`" ref="viewportRef">
        <!-- Catches clicks on empty space to clear the selection. -->
        <rect
          x="-200000"
          y="-200000"
          width="400000"
          height="400000"
          fill="transparent"
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

        <image
          :href="laserpointerIconUrl"
          :x="toolheadPosition.x - laserpointerDim/2"
          :y="cutbedDepth - (toolheadPosition.y - laserpointerDim/2)"
          :width="laserpointerDim"
          :height="laserpointerDim"
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

  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-panel);
  box-shadow: var(--shadow-panel);
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
  stroke: var(--color-cutbed);
  stroke-width: 1.5px;
  vector-effect: non-scaling-stroke;
  stroke-dasharray: 6 6;
}
</style>
