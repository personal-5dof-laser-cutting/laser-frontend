import { describe, it, expect, beforeEach, vi } from 'vitest'

// INFO: vitest runs on node that doesn't provide local storage
vi.hoisted(() => {
  vi.stubGlobal('localStorage', {
    getItem: vi.fn<() => void>(),
    setItem: vi.fn<() => void>(),
    removeItem: vi.fn<() => void>(),
    clear: vi.fn<() => void>(),
  })
})

import { useCutterStore } from '@/stores/useCutterStore'

// INFO: vitest happily removes functions if INITIAL_STATE from the store is used
const INITIAL_STATE = useCutterStore.getState()

describe('useCutterStore', () => {
  beforeEach(() => {
    useCutterStore.persist.clearStorage()
    useCutterStore.setState(INITIAL_STATE, true)
  })

  it('should initialize with default default state', () => {
    const state = useCutterStore.getState()

    expect(state.axes.x.homed).toBe(false)
    expect(state.axes.a.current_value).toBeNull()
    expect(state.cutbed.width).toBe(0)
  })

  it('should update a single axis via updateAxis without overriding other properties', () => {
    const store = useCutterStore.getState()

    store.updateAxis('x', { homed: true, target_value: 150.5 })

    const state = useCutterStore.getState()
    expect(state.axes.x.homed).toBe(true)
    expect(state.axes.x.target_value).toBe(150.5)
    // INFO: untouched properties remain unchanged
    expect(state.axes.x.current_value).toBeNull()
    // INFO: other axes remain untouched
    expect(state.axes.y.homed).toBe(false)
  })

  it('should update multiple axes concurrently via setAxes', () => {
    const store = useCutterStore.getState()

    store.setAxes({
      y: { current_value: 50 },
      z: { homed: true, target_value: -10 },
    })

    const state = useCutterStore.getState()
    expect(state.axes.y.current_value).toBe(50)
    expect(state.axes.y.homed).toBe(false) // INFO: unchanged property on updated axis

    expect(state.axes.z.homed).toBe(true)
    expect(state.axes.z.target_value).toBe(-10)

    expect(state.axes.x.current_value).toBeNull() // INFO: unchanged axis
  })

  it('should safely ignore undefined axis updates in setAxes', () => {
    const store = useCutterStore.getState()

    // INFO: test undefined behaviour
    store.setAxes({
      a: undefined,
      b: { homed: true },
    })

    const state = useCutterStore.getState()
    expect(state.axes.a.homed).toBe(false) // INFO: unchanged
    expect(state.axes.b.homed).toBe(true) // INFO: updated
  })

  it('should update a single cutbed dimension via updateCutbed', () => {
    const store = useCutterStore.getState()

    store.updateCutbed('width', 1200)

    const state = useCutterStore.getState()
    expect(state.cutbed.width).toBe(1200)
    expect(state.cutbed.depth).toBe(0) // INFO: unchanged
  })

  it('should update multiple cutbed dimensions via setCutbed', () => {
    const store = useCutterStore.getState()

    store.setCutbed({ width: 600, height: 150 })

    const state = useCutterStore.getState()
    expect(state.cutbed.width).toBe(600)
    expect(state.cutbed.height).toBe(150)
    expect(state.cutbed.depth).toBe(0) // INFO: unchanged
  })
})
