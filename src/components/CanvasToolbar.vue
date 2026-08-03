<script setup lang="ts">
import { computed } from 'vue'

import IconButton from '@/components/IconButton.vue'

import { useProjectStore } from '@/stores/useProjectStore'
import { useStore } from '@/stores/useStore'

import uploadIconUrl from '@/assets/icons/upload_file.svg'
import resetBoxIconUrl from '@/assets/icons/reset_focus.svg'
import deleteIconUrl from '@/assets/icons/delete.svg'
import copyIconUrl from '@/assets/icons/copy.svg'
import downloadIconUrl from '@/assets/icons/download.svg'

const projectStore = useStore(useProjectStore)
useProjectStore.getState()
const svgs = computed(() => projectStore.value.svgs)
const selectedId = computed(() => projectStore.value.selectedId)

const handleUpload = (event: Event) => useProjectStore.getState().uploadSvg(event)
const handleReset = () => useProjectStore.getState().resetProject()
const handleExport = () => useProjectStore.getState().exportProject()

const duplicateActiveSvg = () => {
  if (!selectedId.value) return
  useProjectStore.getState().duplicateSvg(selectedId.value)
}

const removeActiveSVG = () => {
  if (!selectedId.value) return
  useProjectStore.getState().removeSvg(selectedId.value)
}
</script>

<template>
  <div class="toolbar">
    <label class="icon-btn" title="Upload SVG">
      <img :src="uploadIconUrl" class="btn-icon" alt="Upload Icon" />
      <input type="file" accept=".svg" @change="handleUpload" hidden />
    </label>

    <IconButton
      title="Reset Canvas"
      :action="handleReset"
      :iconPath="resetBoxIconUrl"
      alt="Reset
    Canvas"
    />
    <IconButton
      title="Delete Element"
      :action="removeActiveSVG"
      :iconPath="deleteIconUrl"
      alt="Delete Element"
      v-if="selectedId"
    />
    <IconButton
      title="Duplicate Element"
      :action="duplicateActiveSvg"
      :iconPath="copyIconUrl"
      alt="Duplicate Element"
      v-if="selectedId"
    />
    <IconButton
      title="Export Project"
      :action="handleExport"
      :iconPath="downloadIconUrl"
      alt="Export Project"
    />
  </div>
</template>

<style scoped>
.toolbar {
  position: absolute;
  top: var(--margin-mid);
  left: var(--margin-mid);
  z-index: 10;
  display: flex;
  flex-flow: row;
  gap: var(--gap-mid);
}

.icon-btn {
  background-color: var(--color-background-soft);
  border: 1px solid var(--color-border-panel);
  border-radius: var(--border-radius-panel-element);
  background-color: var(--color-background-panel);
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
