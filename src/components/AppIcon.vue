<script setup lang="ts">
// Inlines the SVG markup (imported with `?raw`) so the icon inherits
// `currentColor` from its surroundings. Icons loaded as <img> cannot be
// recoloured, which matters for the light buttons and the primary one.
defineProps<{
  svg: string
  label?: string
}>()
</script>

<template>
  <span
    class="app-icon"
    role="img"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
    v-html="svg"
  />
</template>

<style scoped>
.app-icon {
  display: inline-flex;
  flex: none;
  color: inherit;
}

.app-icon :deep(svg) {
  display: block;
  width: 1.25em;
  height: 1.25em;
  fill: currentColor;
}
</style>
