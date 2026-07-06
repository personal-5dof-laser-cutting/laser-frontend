<script setup lang="ts">
defineProps<{
  title: string
  action: () => void
  iconPath: string
  alt: string
}>()
</script>

<template>
  <button class="icon-btn" :title="title" @click="action">
    <img :src="iconPath" class="btn-icon" :alt="alt" />
  </button>
</template>

<style scoped>
.icon-btn {
  background-color: var(--color-background-soft);
  border: 1px solid grey;
  border-radius: 5px;
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
