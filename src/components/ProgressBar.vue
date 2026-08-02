<script setup lang="ts">
import { computed } from 'vue'
import { useProjectStore } from '@/stores/useProjectStore'
import { useStore } from '@/stores/useStore'

// Assumes useCutterStore exposes:
//   progress: number
//   progressTotal: number
// Adjust field names below if yours differ.

const projectStore = useStore(useProjectStore)

const percent = computed(() => {
  const total = projectStore.value.progressTotal
  const current = projectStore.value.progress
  
  if (!total || total <= 0) return 0
  return Math.min(100, Math.round(((current || 0) / total) * 100))
})
</script>

<template>
  <div class="progress-bar-wrapper" v-if="projectStore.progress != null">
    <div class="progress-bar-track">
      <div class="progress-bar-fill" :style="{ width: percent + '%' }" />
    </div>
    <span class="progress-bar-label">{{ percent }}%</span>
  </div>
</template>

<style scoped>
.progress-bar-wrapper {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  width: 320px;
  z-index: 1000;
}

.progress-bar-track {
  flex: 1;
  height: 10px;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 6px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: #3b82f6;
  transition: width 0.2s ease;
}

.progress-bar-label {
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  min-width: 36px;
  text-align: right;
}
</style>