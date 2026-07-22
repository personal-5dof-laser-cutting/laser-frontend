<script setup lang="ts">
import { ref, computed } from 'vue'

import { useStore } from '@/stores/useStore'
import { useCutterStore } from '@/stores/useCutterStore'
import { useWebsocketStore } from '@/stores/useWebsocketStore'
import { useProjectStore } from '@/stores/useProjectStore'

const cutterStore = useStore(useCutterStore)

const materials = computed(() => cutterStore.value.materials)
const activeMaterialId = computed(() => cutterStore.value.activeMaterialId)

const materialThickness = ref(7)
const submitJob = () => useProjectStore.getState().submitJob({material: "wood", material_thickness: materialThickness.value, dpi: 72, cut_speed: 20, laser_off: true, optimize: false})
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
      <p class="input-section">
        <label for="material-height">Material thickness:</label>
        <input type="number", id="material-height" v-model="materialThickness">
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

  color: var(--color-text-panel);
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

.input-section {
  display: flex;
  flex-flow: row;
  width: 100%;

  font-size: 22px;
}

#material-selector {
  width: 100%;
  color: var(--color-text);
  padding: var(--padding-small);
  border: 1pt solid var(--color-border-panel-element);
  border-radius: var(--border-radius-panel-element);
}

#material-height {
  width: 30%;
  color: var(--color-text);
  margin-left: auto;
  border: 1pt solid var(--color-border-panel-element);
  border-radius: var(--border-radius-panel-element);
  appearance: textfield;
  -moz-appearance: textfield;
  -webkit-appearance: textfield;
}

</style>
