<script setup lang="ts">
import { computed } from 'vue'

import AppIcon from '@/components/AppIcon.vue'
import IconButton from '@/components/IconButton.vue'

import { useProjectStore } from '@/stores/useProjectStore'
import { useStore } from '@/stores/useStore'

import uploadIcon from '@/assets/icons/upload_file.svg?raw'
import resetBoxIcon from '@/assets/icons/reset_focus.svg?raw'
import deleteIcon from '@/assets/icons/delete.svg?raw'
import copyIcon from '@/assets/icons/copy.svg?raw'
import downloadIcon from '@/assets/icons/download.svg?raw'

const projectStore = useStore(useProjectStore)
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
      <AppIcon :svg="uploadIcon" label="Upload SVG" />
      <input type="file" accept=".svg" @change="handleUpload" hidden />
    </label>

    <IconButton
      title="Reset Canvas"
      :action="handleReset"
      :icon="resetBoxIcon"
      alt="Reset Canvas"
    />
    <IconButton
      title="Delete Element"
      :action="removeActiveSVG"
      :icon="deleteIcon"
      alt="Delete Element"
      v-if="selectedId"
    />
    <IconButton
      title="Duplicate Element"
      :action="duplicateActiveSvg"
      :icon="copyIcon"
      alt="Duplicate Element"
      v-if="selectedId"
    />
    <IconButton
      title="Export Project"
      :action="handleExport"
      :icon="downloadIcon"
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

/* Mirrors IconButton's styling; the upload control has to be a <label>
   so it can wrap the hidden file input. */
.icon-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 42px;
  height: 42px;
  font-size: 20px;

  color: var(--color-text);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  box-shadow: var(--shadow-control);
  cursor: pointer;
  transition:
    background-color 0.12s ease,
    border-color 0.12s ease;
}

.icon-btn:hover {
  background-color: var(--color-surface-hover);
  border-color: var(--color-border-strong);
}
</style>
