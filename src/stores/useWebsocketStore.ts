import { createStore } from 'zustand/vanilla'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { WebsocketMessage } from '@/types/websocket'

export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
}

interface ConnectionState {
  status: ConnectionStatus
  lastMessage: any | null
}

interface ConnectionActions {
  connect: (url: string) => void
  disconnect: () => void
  sendMessage: (message: any) => void
  handleMessage: (event: MessageEvent) => void
}

type ConnectionStore = ConnectionState & ConnectionActions

const INITIAL_STATE: ConnectionState = {
  status: ConnectionStatus.DISCONNECTED,
  lastMessage: null,
}

let socket: WebSocket | null = null // INFO: devTools go haywire if this is included in the store

export const useWebsocketStore = createStore<ConnectionStore>()(
  devtools(
    immer((set, get) => ({
      ...INITIAL_STATE,

      connect: (url: string) => {
        if (socket && socket.readyState !== WebSocket.CLOSED) return

        set(
          (state) => {
            state.status = ConnectionStatus.CONNECTING
          },
          false,
          'connect_init',
        )

        socket = new WebSocket(url)

        socket.onopen = () => {
          set(
            (state) => {
              state.status = ConnectionStatus.CONNECTED
            },
            false,
            'connected',
          )
        }

        socket.onclose = () => {
          set(
            (state) => {
              state.status = ConnectionStatus.DISCONNECTED
            },
            false,
            'disconnected',
          )
          socket = null
        }

        socket.onerror = (error) => {
          console.error('WebSocket Error:', error)
        }

        socket.onmessage = (event: MessageEvent) => {
          get().handleMessage(event)
        }
      },

      disconnect: () => {
        if (socket) {
          socket.close()
        }
      },

      sendMessage: (message: WebsocketMessage) => {
        if (!socket || socket.readyState !== WebSocket.OPEN) {
          console.warn('Cannot send message: WebSocket is not connected.')
          return
        }
        const payload = JSON.stringify(message)
        socket.send(payload)
      },

      handleMessage: (event: MessageEvent) => {
        set(
          (state) => {
            try {
              state.lastMessage = JSON.parse(event.data)
            } catch {
              state.lastMessage = event.data
            }
          },
          false,
          'receive_message',
        )
      },
    })),
    {
      name: 'LaserFrontend DevTools',
      enabled: import.meta.env.DEV,
    },
  ),
)
