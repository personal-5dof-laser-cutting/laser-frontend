<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue'

defineProps<{
  title: string
  action: () => void
  icon: string
  alt: string
}>()
</script>

<template>
  <button class="icon-btn" :title="title" @click="action">
    <AppIcon :svg="icon" :label="alt" />
  </button>
</template>

<style scoped>
.icon-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 42px;
  height: 42px;
  padding: 0;
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

.icon-btn:active {
  background-color: var(--color-border);
}
</style>
