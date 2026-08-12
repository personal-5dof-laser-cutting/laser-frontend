<script setup lang="ts">
import { ref, computed } from 'vue'

import AppIcon from '@/components/AppIcon.vue'

import { useStore } from '@/stores/useStore'
import { useCutterStore } from '@/stores/useCutterStore'
import { useProjectStore } from '@/stores/useProjectStore'

import playIcon from '@/assets/icons/play.svg?raw'
import homingIcon from '@/assets/icons/home.svg?raw'
import abortIcon from '@/assets/icons/abort.svg?raw'

const cutterStore = useStore(useCutterStore)
const projectStore = useStore(useProjectStore)

const materials = computed(() => cutterStore.value.materials)
const activeMaterialId = computed(() => cutterStore.value.activeMaterialId)

const materialThickness = ref(7)
const laserPower = ref(100)
const cutSpeed = ref(20)
const activateLaser = ref(true)
const optimize = ref(true)

const submitJob = () => {
  projectStore.value.resetProgress()
  return projectStore.value.submitJob({
    material: activeMaterialId.value,
    material_thickness: materialThickness.value,
    dpi: 72,
    cut_speed: cutSpeed.value,
    laser_power: laserPower.value / 100,
    laser_off: !activateLaser.value,
    optimize: optimize.value,
  })
}

const homeCutter = () => {
  projectStore.value.resetProgress()
  return projectStore.value.homeCutter()
}

const abortCut = () => {
  projectStore.value.resetProgress()
  return projectStore.value.abortCut()
}

const handleMaterialChange = (event: Event) => {
  const target: HTMLSelectElement = event.target as HTMLSelectElement
  cutterStore.value.setActiveMaterial(target.value)
  const materialData = cutterStore.value.getActiveMaterial()
  if (materialData) {
    cutSpeed.value = materialData.suggested_cutspeed
    laserPower.value = 100
  }
}
</script>

<template>
  <aside class="sidebar">
    <h1 class="sidebar-title">SVG5DoF to GCode</h1>

    <form class="sidebar-form" @submit.prevent>
      <div class="field">
        <label class="field-label" for="material-selector">Material</label>
        <select
          id="material-selector"
          class="control select"
          :value="activeMaterialId"
          @change="handleMaterialChange"
        >
          <option v-for="item in materials" :key="item.id" :value="item.id">
            {{ item.label }}
          </option>
        </select>
      </div>

      <div class="field-row">
        <div class="field">
          <label class="field-label" for="material-height">Thickness (mm)</label>
          <input id="material-height" class="control" type="number" v-model="materialThickness" />
        </div>
      </div>

      <div class="field-row">
        <div class="field">
          <label class="field-label" for="laser-power">Laser power (%)</label>
          <input id="laser-power" class="control" type="number" min="0" max="100" step="any" v-model="laserPower" />
        </div>

        <div class="field">
          <label class="field-label" for="cut-speed">Speed (mm/s)</label>
          <input id="cut-speed" class="control" type="number" v-model="cutSpeed" />
        </div>
      </div>

      <div class="options">
        <label class="option" for="activatae-laser">
          <input type="checkbox" name="activatae-laser" id="activatae-laser" v-model="activateLaser" />
          <span>Activate laser</span>
        </label>
        <label class="option" for="optimize">
          <input type="checkbox" name="optimize" id="optimize" v-model="optimize" />
          <span>Optimize path</span>
        </label>
      </div>

      <div class="actions">
        <div class="actions-row">
          <button type="button" class="btn btn-secondary" title="Home Cutter" @click="homeCutter">
            <AppIcon :svg="homingIcon" />
            <span>Home</span>
          </button>
          <button type="button" class="btn btn-secondary" title="Abort" @click="abortCut">
            <AppIcon :svg="abortIcon" />
            <span>Abort</span>
          </button>
        </div>

        <button type="button" class="btn btn-primary" @click="submitJob">
          <AppIcon :svg="playIcon" />
          <span>Start Cutting</span>
        </button>
      </div>
    </form>
  </aside>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-flow: column;
  flex: none;
  width: 340px;
  padding: var(--padding-mid);
  overflow-y: auto;

  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-panel);
  box-shadow: var(--shadow-panel);
}

.sidebar-title {
  margin: 0 0 26px;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.sidebar-form {
  display: flex;
  flex-flow: column;
  gap: var(--gap-large);
}

.field {
  display: flex;
  flex-flow: column;
  gap: 6px;
  min-width: 0;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--gap-mid);
}

.field-label {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
}

.control {
  width: 100%;
  padding: 11px 14px;
  font-family: inherit;
  font-size: 15px;
  color: var(--color-text);
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  outline: none;
  transition:
    border-color 0.12s ease,
    box-shadow 0.12s ease;
}

.control:focus {
  border-color: var(--color-border-strong);
  box-shadow: 0 0 0 3px rgba(59, 111, 212, 0.12);
}

.select {
  appearance: none;
  cursor: pointer;
  /* chevron matching the number-input steppers */
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5 6 6.5 11 1.5' fill='none' stroke='%2364748b' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  padding-right: 38px;
}

.options {
  display: flex;
  flex-flow: column;
  gap: var(--gap-mid);
}

.option {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.option input {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary);
  cursor: pointer;
}

.actions {
  display: flex;
  flex-flow: column;
  gap: var(--gap-mid);
  margin-top: 6px;
}

.actions-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--gap-mid);
}

.btn {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 13px 16px;

  font-family: inherit;
  font-size: 15px;
  font-weight: 600;
  border-radius: var(--radius-control);
  cursor: pointer;
  transition:
    background-color 0.12s ease,
    border-color 0.12s ease;
}

.btn-secondary {
  color: var(--color-text);
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-border-strong);
}

.btn-primary {
  color: var(--color-on-primary);
  background: var(--color-primary);
  border: 1px solid var(--color-primary);
}

.btn-primary:hover {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}
</style>
