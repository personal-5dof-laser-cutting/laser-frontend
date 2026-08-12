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

type ToolheadLabel = 'x' | 'y'
type ToolheadState = Record<ToolheadLabel, number>

type MaterialData = {
  id: string
  label: string
  standard_thickness: number
  suggested_cutspeed: number
}

interface CutterState {
  axes: AxesState
  cutbed: CutbedState
  materials: Record<string, MaterialData>
  activeMaterialId: string
  toolheadPosition: ToolheadState
}

interface CutterActions {
  setAxes: (axes: Partial<Record<AxisLabel, Partial<AxisData>>>) => void
  setCutbed: (cutbed: Partial<CutbedState>) => void
  setMaterial: (material: MaterialData) => void
  setActiveMaterial: (material_id: string) => void
  setToolheadPosition: (position: ToolheadState) => void

  updateAxis: (axis: AxisLabel, updates: Partial<AxisData>) => void
  updateCutbed: (dimension: CutbedLabel, value: number) => void

  updateMaterial: (material_id: string, updates: Partial<MaterialData>) => void
  deleteMaterial: (material_id: string) => void

  getActiveMaterial: () => MaterialData | null
}

type CutterStore = CutterState & CutterActions
const materialResponse = await fetch("http://127.0.0.1:8000/get_materials")
let backendMaterials: Record<string, MaterialData> = {}
if (!materialResponse.ok) {
  console.error(materialResponse.statusText)
} else {
  let materialsArray = await materialResponse.json()
  backendMaterials = Object.fromEntries(
    materialsArray.map((material: MaterialData) => [material.id, material])
  )
}

const cutbedResponse = await fetch("http://127.0.0.1:8000/get_cutbed_dimensions")
let cutbed_width: number = 400
let cutbed_height: number = 400
if (!cutbedResponse.ok) {
  console.error(cutbedResponse.statusText)
} else {
  [cutbed_width, cutbed_height] = await cutbedResponse.json()
}


export const INITIAL_STATE: CutterState = {
  axes: {
    x: { homed: false, current_value: null, target_value: null },
    y: { homed: false, current_value: null, target_value: null },
    z: { homed: false, current_value: null, target_value: null },
    a: { homed: false, current_value: null, target_value: null },
    b: { homed: false, current_value: null, target_value: null },
  },
  cutbed: {
    width: cutbed_width,
    depth: cutbed_height,
    height: 15,
  },
  materials: backendMaterials,
  activeMaterialId: Object.keys(backendMaterials)[0] || '',
  toolheadPosition: {x: 0, y: cutbed_height}
}

export const useCutterStore = createStore<CutterStore>()(
  devtools(
    persist(
      immer((set, get) => ({
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

        setMaterial: (material) =>
          set((state) => {
            state.materials[material.id] = material
          }),

        updateMaterial: (material_id, updates) =>
          set((state) => {
            const materialToUpdate = state.materials[material_id]
            if (materialToUpdate) {
              Object.assign(materialToUpdate, updates)
            }
          }),

        deleteMaterial: (material_id) =>
          set((state) => {
            delete state.materials[material_id]
          }),

        setActiveMaterial: (material_id) =>
          set((state) => {
            state.activeMaterialId = material_id
          }),


        setToolheadPosition: (position: ToolheadState) =>
          set((state) => {
            state.toolheadPosition = {x: position.x, y: position.y}
          }),

        getActiveMaterial: () => {
          const state = get()
          return state.materials[state.activeMaterialId] || null
        },
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
