<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useWebsocketStore } from '@/stores/useWebsocketStore'
import { useStore } from '@/stores/useStore'

const websocketStore = useStore(useWebsocketStore)
const connect = (url: string) => useWebsocketStore.getState().connect(url)
connect("ws://127.0.0.1:8000/ws/main")
</script>

<template>
  <RouterView />
</template>

<style scoped></style>
