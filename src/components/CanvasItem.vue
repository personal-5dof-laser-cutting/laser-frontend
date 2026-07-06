<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useProjectStore } from '@/stores/useProjectStore'
import { useStore } from '@/stores/useStore'

const store = useStore(useProjectStore)
const { selectSvg, updateSvg } = useProjectStore.getState()
const selectedId = computed(() => store.value.selectedId)

interface SvgItem {
  id: string | number
  x: number
  y: number
  rotation: number
  content: string
}

const props = defineProps<{
  item: SvgItem
  getMousePosition: (evt: MouseEvent) => { x: number; y: number }
}>()

const contentRef = ref<SVGGElement | null>(null)
const bBox = ref({ x: 0, y: 0, width: 0, height: 0 })

const updateBBox = () => {
  if (contentRef.value) {
    bBox.value = contentRef.value.getBBox()
  }
}

onMounted(() => {
  nextTick(() => updateBBox())
})

watch(
  () => props.item.content,
  () => {
    nextTick(() => updateBBox())
  },
)

const startMove = (evt: MouseEvent) => {
  if (evt.button !== 0) return
  evt.stopPropagation()
  selectSvg(props.item.id as string)

  const startMouse = props.getMousePosition(evt)
  const startX = props.item.x
  const startY = props.item.y

  const onMouseMove = (moveEvt: MouseEvent) => {
    const currentMouse = props.getMousePosition(moveEvt)

    updateSvg(props.item.id as string, {
      x: startX + (currentMouse.x - startMouse.x),
      y: startY + (currentMouse.y - startMouse.y),
    })
  }

  const onMouseUp = () => {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

const startRotate = (evt: MouseEvent) => {
  if (evt.button !== 0) return
  evt.stopPropagation()

  const startMouse = props.getMousePosition(evt)

  const centerX = props.item.x + bBox.value.x + bBox.value.width / 2
  const centerY = props.item.y + bBox.value.y + bBox.value.height / 2

  const initialAngle = Math.atan2(startMouse.y - centerY, startMouse.x - centerX) * (180 / Math.PI)
  const initialRotation = props.item.rotation

  const onMouseMove = (moveEvt: MouseEvent) => {
    const currentMouse = props.getMousePosition(moveEvt)
    const currentAngle =
      Math.atan2(currentMouse.y - centerY, currentMouse.x - centerX) * (180 / Math.PI)

    updateSvg(props.item.id as string, {
      rotation: initialRotation + (currentAngle - initialAngle),
    })
  }

  const onMouseUp = () => {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

const getRotationCenter = computed(() => {
  const cx = bBox.value.x + bBox.value.width / 2 || 0
  const cy = bBox.value.y + bBox.value.height / 2 || 0
  return `${cx}, ${cy}`
})
</script>

<template>
  <g
    :transform="`translate(${item.x}, ${item.y}) rotate(${item.rotation}, ${getRotationCenter})`"
    @mousedown="startMove"
    class="canvas-item"
    :class="{ active: item.id === selectedId }"
  >
    <g v-html="item.content" ref="contentRef" />

    <g v-if="item.id === selectedId" class="interface-overlay">
      <rect
        :x="bBox.x"
        :y="bBox.y"
        :width="bBox.width"
        :height="bBox.height"
        class="selection-box"
      />
      <line
        :x1="bBox.x + bBox.width / 2"
        :y1="bBox.y"
        :x2="bBox.x + bBox.width / 2"
        :y2="bBox.y - 24"
        class="handle-line"
      />
      <circle
        :cx="bBox.x + bBox.width / 2"
        :cy="bBox.y - 24"
        r="5"
        class="rotate-handle"
        @mousedown.stop="startRotate"
      />
    </g>
  </g>
</template>

<style scoped>
.canvas-item {
  cursor: move;
}

.canvas-item :deep(svg) {
  pointer-events: all;
}

.selection-box {
  fill: none;
  stroke: var(--color-accent);
  stroke-width: 1pt;
  vector-effect: non-scaling-stroke;
  pointer-events: none;
}

.handle-line {
  stroke: var(--color-accent);
  stroke-width: 1pt;
  vector-effect: non-scaling-stroke;
  pointer-events: none;
}

.rotate-handle {
  fill: var(--color-background);
  stroke: var(--color-accent);
  stroke-width: 5pt;
  vector-effect: non-scaling-stroke;
  cursor: alias;
}

.rotate-handle:hover {
  fill: var(--color-accent);
  transition: 0.1s ease-out;
}
</style>
