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
  position: absolute;
  bottom: 22px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  display: flex;
  flex-direction: column;
  width: 460px;
  max-width: calc(100% - 44px);

  color: var(--color-text);
  background: var(--color-surface);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  overflow: hidden;
  box-shadow: var(--shadow-panel);
}

.terminal-log {
  max-height: 160px;
  overflow-y: auto;
  padding: 10px 14px;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--color-border);
}

.terminal-log:empty {
  padding: 0;
  border-bottom: none;
}

.terminal-line {
  line-height: 1.5;
}

.terminal-input {
  border: none;
  background: transparent;
  color: var(--color-text);
  font-family: inherit;
  font-size: inherit;
  padding: 11px 14px;
  outline: none;
}

.terminal-input::placeholder {
  color: var(--color-text-muted);
}
</style>