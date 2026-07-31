<script setup lang="ts">
import { computed } from 'vue'

import IconButton from '@/components/IconButton.vue'

import { useProjectStore } from '@/stores/useProjectStore'
import { useStore } from '@/stores/useStore'

import homingIconUrl from '@/assets/icons/home.svg'
import abortIconUrl from '@/assets/icons/abort.svg'

const projectStore = useStore(useProjectStore)
useProjectStore.getState()

const homeCutter = () => useProjectStore.getState().homeCutter()
const abortCut = () => useProjectStore.getState().abortCut()
</script>

<template>
  <div class="toolbar">
    <IconButton
      title="Home Cutter"
      :action="homeCutter"
      :iconPath="homingIconUrl"
      alt="Home Cutter"
    />
    <IconButton
      title="Abort"
      :action="abortCut"
      :iconPath="abortIconUrl"
      alt="Delete Element"
    />
  </div>
</template>

<style scoped>
.toolbar {
  position: absolute;
  bottom: var(--margin-mid);
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
