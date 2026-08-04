<script setup lang="ts">
import SVGCanvas from '@/components/SVGCanvas.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import GCodeTerminal from '@/components/GcodeTerminal.vue'
import AppSidebar from '@/components/AppSidebar.vue'
</script>

<template>
  <div class="app-shell">
    <main class="workspace">
      <SVGCanvas />
      <ProgressBar />
      <GCodeTerminal />
    </main>
    <AppSidebar />
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  gap: var(--margin-mid);
  width: 100%;
  height: 100%;
  padding: var(--margin-mid);
  background: var(--color-background);
}

/* Takes all the width the sidebar does not need, so the square workplane
   inside can grow as large as the viewport allows. */
.workspace {
  position: relative;
  flex: 1;
  min-width: 0;
}
</style>
