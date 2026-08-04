<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useWebsocketStore } from '@/stores/useWebsocketStore'
import { useStore } from '@/stores/useStore'
import type { GCodeMessage, UpdateMessage} from '@/types/websocket'

const websocketStore = useStore(useWebsocketStore)

const input = ref('')
const lines = ref<string[]>([])
const logEl = ref<HTMLDivElement | null>(null)

function sendCommand() {
  const command = input.value.trim()
  if (!command) return

  lines.value.push(`> ${command}`)

  const message: GCodeMessage = { type: 'gcode', command: command }
  useWebsocketStore.getState().sendMessage(message)

  input.value = ''
}

watch(
  () => websocketStore.value.lastMessage,
  (message) => {
    if (!message || typeof message !== 'object') return
    if ((message as { type?: string }).type !== 'update') return

    const update = message as UpdateMessage
    if (update.content !== null) {
      lines.value.push(update.content)
    }
  },
)

// auto-scroll to bottom whenever a new line is added
watch(lines, () => {
  nextTick(() => {
    if (logEl.value) {
      logEl.value.scrollTop = logEl.value.scrollHeight
    }
  })
})
</script>

<template>
  <div class="terminal">
    <div ref="logEl" class="terminal-log">
      <div v-for="(line, i) in lines" :key="i" class="terminal-line">{{ line }}</div>
    </div>
    <input
      v-model="input"
      class="terminal-input"
      type="text"
      placeholder="Enter GCode command..."
      autocomplete="off"
      spellcheck="false"
      @keyup.enter="sendCommand"
    />
  </div>
</template>

<style scoped>
.terminal {
  position: fixed;
  bottom: 24px;
  right: 2%;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  width: 500px;
  max-width: 90vw;
  background: #0d0d0d;
  color: #33ff33;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.terminal-log {
  max-height: 160px;
  overflow-y: auto;
  padding: 8px 10px;
  white-space: pre-wrap;
  word-break: break-word;
}

.terminal-log:empty {
  padding: 0;
}

.terminal-line {
  line-height: 1.4;
}

.terminal-input {
  border: none;
  border-top: 1px solid #333;
  background: #000;
  color: #33ff33;
  font-family: inherit;
  font-size: inherit;
  padding: 8px 10px;
  outline: none;
}
</style>