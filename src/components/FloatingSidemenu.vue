<script setup lang="ts">
import { ref, computed } from 'vue'

import { useStore } from '@/stores/useStore'
import { useCutterStore } from '@/stores/useCutterStore'

const cutterStore = useStore(useCutterStore)
const materials = computed(() => cutterStore.value.materials)
const activeMaterialId = computed(() => cutterStore.value.activeMaterialId)
</script>

<template>
  <div class="menu-container">
    <form>
      <p>
        <select id="material-selector">
          <option v-for="item in materials" :key="item.id" value="item.label">
            {{ item.label }}
          </option>
        </select>
        <button></button>
      </p>
    </form>
  </div>
</template>

<style scoped>
.menu-container {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10;
  display: flex;
  flex-flow: column;
  flex-grow: 1;
  gap: 12px;

  width: 300px;
  padding: 15pt;
  margin-left: auto;

  overflow: hidden;

  background: black;
}

#material-selector {
  width: 100%;
  background: var(--color-background-mute);
  color: var(--color-text);
  padding: 5pt;
  border: 1pt solid var(--color-border);
  border-radius: 5pt;
}
</style>
