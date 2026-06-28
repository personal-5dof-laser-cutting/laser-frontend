import { createStore } from 'zustand/vanilla'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

type AxisData = {
  homed: boolean
  current_value: number | null
  target_value: number | null
}

type AxisLabel = 'x' | 'y' | 'z' | 'a' | 'b'
type AxesState = Record<AxisLabel, AxisData>

type CutbedLabel = 'width' | 'depth' | 'height'
type CutbedState = Record<CutbedLabel, number>

interface CutterState {
  axes: AxesState
  cutbed: CutbedState
}

interface CutterActions {
  setAxes: (axes: Partial<Record<AxisLabel, Partial<AxisData>>>) => void
  setCutbed: (cutbed: Partial<CutbedState>) => void

  updateAxis: (axis: AxisLabel, updates: Partial<AxisData>) => void
  updateCutbed: (dimension: CutbedLabel, value: number) => void
}

type CutterStore = CutterState & CutterActions

export const INITIAL_STATE: CutterState = {
  axes: {
    x: { homed: false, current_value: null, target_value: null },
    y: { homed: false, current_value: null, target_value: null },
    z: { homed: false, current_value: null, target_value: null },
    a: { homed: false, current_value: null, target_value: null },
    b: { homed: false, current_value: null, target_value: null },
  },
  cutbed: {
    width: 350,
    depth: 350,
    height: 15,
  },
}

export const useCutterStore = createStore<CutterStore>()(
  devtools(
    persist(
      immer((set) => ({
        ...INITIAL_STATE,

        updateAxis: (axis, updates) =>
          set((state) => {
            Object.assign(state.axes[axis], updates)
          }),

        setAxes: (incomingAxes) =>
          set((state) => {
            for (const [axis, updates] of Object.entries(incomingAxes)) {
              if (updates) {
                Object.assign(state.axes[axis as AxisLabel], updates)
              }
            }
          }),

        updateCutbed: (dimension, value) =>
          set((state) => {
            state.cutbed[dimension] = value
          }),

        setCutbed: (updates) =>
          set((state) => {
            Object.assign(state.cutbed, updates)
          }),
      })),
      {
        name: 'LaserFrontend-Cutter-Storage',
      },
    ),
    {
      name: 'LaserFrontend DevTools',
      enabled: true,
    },
  ),
)
