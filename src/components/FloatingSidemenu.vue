<script setup lang="ts">
import { ref, computed } from 'vue'

import { useStore } from '@/stores/useStore'
import { useCutterStore } from '@/stores/useCutterStore'
import { useWebsocketStore } from '@/stores/useWebsocketStore'
import { useProjectStore } from '@/stores/useProjectStore'

const cutterStore = useStore(useCutterStore)
const materials = computed(() => cutterStore.value.materials)
const activeMaterialId = computed(() => cutterStore.value.activeMaterialId)

const submitJob = () => useProjectStore.getState().submitJob()
</script>

<template>
  <div class="menu-container">
    <form>
      <p class="material-section">
        <select id="material-selector">
          <option v-for="item in materials" :key="item.id" value="item.label">
            {{ item.label }}
          </option>
        </select>
      </p>
      <p>
        <button type="button" @click="submitJob">Send</button>
      </p>
    </form>
  </div>
</template>

<style scoped>
.menu-container {
  position: absolute;
  top: var(--margin-mid);
  right: var(--margin-mid);
  z-index: 10;
  display: flex;
  flex-flow: column;
  flex-grow: 1;

  width: 250pt;
  padding: var(--padding-mid);
  margin-left: auto;

  overflow: hidden;

  background: var(--color-background-panel);
  border-radius: var(--broder-radius-panel);
  border: 1pt solid var(--color-border-panel);
}

.material-section {
  display: flex;
  flex-flow: row;
  width: 100%;

  background: var(--color-background-panel-element);
}

#material-selector {
  width: 100%;
  color: var(--color-text);
  padding: var(--padding-small);
  border: 1pt solid var(--color-border-panel-element);
  border-radius: var(--border-radius-panel-element);
}
</style>
