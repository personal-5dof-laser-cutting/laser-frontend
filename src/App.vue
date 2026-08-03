<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useWebsocketStore } from '@/stores/useWebsocketStore'
import { useStore } from '@/stores/useStore'
import { watch } from 'vue'
import type { WebsocketMessage } from '@/types/websocket'
import { useToast } from 'vue-toastification'
import { useProjectStore } from './stores/useProjectStore'
import { useCutterStore } from './stores/useCutterStore'

const websocketStore = useStore(useWebsocketStore)
const projectStore = useStore(useProjectStore)
const cutterStore = useStore(useCutterStore)
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
        const match = message.content?.match(/\|MPos:([-+]?[0-9.]+),([-+]?[0-9.]+)(?:,[-+]?[0-9.]+){1,3}\|/)

        if (match && match[1] && match[2]) {
          const x = parseFloat(match[1])
          const y = parseFloat(match[2])
          cutterStore.value.setToolheadPosition({x, y})
        }
      }
      break
    default:
      console.error(`Message type ${message.type} not implemented`)
  }
})
</script>

<template>
  <RouterView />
</template>

<style scoped></style>
