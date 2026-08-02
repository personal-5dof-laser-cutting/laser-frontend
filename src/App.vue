<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useWebsocketStore } from '@/stores/useWebsocketStore'
import { useStore } from '@/stores/useStore'
import { watch } from 'vue'
import type { WebsocketMessage } from '@/types/websocket'
import { useToast } from 'vue-toastification'
import { useProjectStore } from './stores/useProjectStore'

const websocketStore = useStore(useWebsocketStore)
const projectStore = useStore(useProjectStore)
const connect = (url: string) => useWebsocketStore.getState().connect(url)
connect('ws://127.0.0.1:8000/ws/main')

watch(() => websocketStore.value.lastMessage, (message: WebsocketMessage | null) => {
  if (!message) return
  const toast = useToast()

  switch (message.type) {
    case 'info':
      if (message.content.startsWith("commands:")) {
        projectStore.value.setProgressTotal(parseInt(message.content.split(':')[1] || "0"))
      } else {
        toast.info(message.content)
      }
      break
    case 'error':
      toast.error(message.content)
      projectStore.value.resetProgress()
      break
    case 'update':
      if (message.form == "progress") {
        projectStore.value.updateProgress()
      } else if (message.form == "status") {
        toast.info(message.content)
      }
      break
  }
})
</script>

<template>
  <RouterView />
</template>

<style scoped></style>
