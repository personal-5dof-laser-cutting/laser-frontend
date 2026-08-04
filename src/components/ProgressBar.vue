<script setup lang="ts">
import { computed } from 'vue'
import { useProjectStore } from '@/stores/useProjectStore'
import { useStore } from '@/stores/useStore'

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
  position: absolute;
  top: 22px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;

  display: flex;
  align-items: center;
  gap: 12px;
  width: 320px;
  padding: 10px 16px;

  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  box-shadow: var(--shadow-control);
}

.progress-bar-track {
  flex: 1;
  height: 8px;
  background: var(--color-border);
  border-radius: 999px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.2s ease;
}

.progress-bar-label {
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  min-width: 36px;
  text-align: right;
}
</style>
