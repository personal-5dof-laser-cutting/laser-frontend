import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useWebsocketStore, ConnectionStatus } from '@/stores/useWebsocketStore'
import { useStore } from '@/stores/useStore'

describe('useWebsocketStore', () => {
  let mockWebSocketInstance: any

  beforeEach(() => {
    useWebsocketStore.setState({
      status: ConnectionStatus.DISCONNECTED,
      lastMessage: null,
    })

    mockWebSocketInstance = {
      readyState: 0, // INFO: CONNECTING
      send: vi.fn(),
      close: vi.fn(function (this: any) {
        if (mockWebSocketInstance.onclose) mockWebSocketInstance.onclose()
      }),
      onopen: null,
      onclose: null,
      onerror: null,
      onmessage: null,
    }

    vi.stubGlobal(
      'WebSocket',
      vi.fn(function () {
        return mockWebSocketInstance
      }),
    )

    ;(global.WebSocket as any).CLOSED = 3
    ;(global.WebSocket as any).OPEN = 1
  })

  it('should initialize with default disconnected state', () => {
    const state = useWebsocketStore.getState()
    expect(state.status).toBe(ConnectionStatus.DISCONNECTED)
    expect(state.lastMessage).toBe(null)
  })

  it('should process and parse JSON incoming messages via handleMessage', () => {
    const store = useWebsocketStore.getState()
    const mockEvent = new MessageEvent('message', {
      data: JSON.stringify({ telemetry: 'data', laserPower: 90 }),
    })

    store.handleMessage(mockEvent)

    expect(useWebsocketStore.getState().lastMessage).toEqual({
      telemetry: 'data',
      laserPower: 90,
    })
  })

  it('should fall back to raw string if incoming data is not JSON', () => {
    const store = useWebsocketStore.getState()
    const mockEvent = new MessageEvent('message', { data: 'PING' })

    store.handleMessage(mockEvent)

    expect(useWebsocketStore.getState().lastMessage).toBe('PING')
  })
})
