<script setup lang="ts">
import { computed } from 'vue'

import { useProjectStore } from '@/stores/useProjectStore'
import { useCutterStore } from '@/stores/useCutterStore'
import { useStore } from '@/stores/useStore'

import uploadIconUrl from '@/assets/icons/upload_file.svg'
import resetBoxIconUrl from '@/assets/icons/reset_focus.svg'
import deleteIconUrl from '@/assets/icons/delete.svg'
import copyIconUrl from '@/assets/icons/copy.svg'
import downloadIconUrl from '@/assets/icons/download.svg'

const projectStore = useStore(useProjectStore)
const { uploadSvg, updateSvg, removeSvg, selectSvg, duplicateSvg, resetProject } =
  useProjectStore.getState()
const svgs = computed(() => projectStore.value.svgs)
const selectedId = computed(() => projectStore.value.selectedId)

const duplicateActiveSvg = () => {
  if (!selectedId.value) return

  duplicateSvg(selectedId.value)
}

const removeActiveSVG = () => {
  if (!selectedId.value) return

  removeSvg(selectedId.value)
}

</script>

<template>
  <div class="toolbar">
    <label class="icon-btn" title="Upload SVG">
      <img :src="uploadIconUrl" class="btn-icon" alt="Upload Icon" />
      <input type="file" accept=".svg" @change="uploadSvg" hidden />
    </label>

    <button class="icon-btn" title="Reset Canvas" @click="resetProject">
      <img :src="resetBoxIconUrl" class="btn-icon" alt="Reset Canvas Icon" />
    </button>

    <button class="icon-btn" title="Delete Element" @click="removeActiveSVG" v-if="selectedId">
      <img :src="deleteIconUrl" class="btn-icon" alt="Delete Element" />
    </button>

    <button
      class="icon-btn"
      title="Duplicate Element"
      @click="duplicateActiveSvg"
      v-if="selectedId"
    >
      <img :src="copyIconUrl" class="btn-icon" alt="Duplicate Element" />
    </button>

    <button class="icon-btn" title="Export Project" @click="exportToSvg">
      <img :src="downloadIconUrl" class="btn-icon" alt="Export Project" v-if="svgs" />
    </button>
  </div>
</template>

<style scoped>
.toolbar {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 10;
  display: flex;
  flex-flow: row;
  gap: 12px;
}

.icon-btn {
  background-color: var(--color-background-soft);
  border: 1px solid grey;
  border-radius: 5px;
  color: var(--color-text);
  cursor: pointer;
  width: 48pt;
  height: 48pt;
  padding: 8pt;
  display: flex;
  justify-content: center;
  align-items: center;
}

.icon-btn:hover {
  border-color: var(--color-border-hover);
}

.btn-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
