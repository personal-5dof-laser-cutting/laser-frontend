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

type MaterialData = {
  id: string
  label: string
  standard_thickness: number
}

interface CutterState {
  axes: AxesState
  cutbed: CutbedState
  materials: MaterialData[]
  activeMaterialId: string
}

interface CutterActions {
  setAxes: (axes: Partial<Record<AxisLabel, Partial<AxisData>>>) => void
  setCutbed: (cutbed: Partial<CutbedState>) => void

  updateAxis: (axis: AxisLabel, updates: Partial<AxisData>) => void
  updateCutbed: (dimension: CutbedLabel, value: number) => void

  setMaterial: (material: Partial<MaterialData>) => void
  updateMaterial: (material_id: string, updates: Partial<MaterialData>) => void
  deleteMaterial: (material_id: string) => void
  setActiveMaterial: (material_id: string) => void
}

type CutterStore = CutterState & CutterActions
const materialResponse = await fetch("http://127.0.0.1:8000/get_materials")
let backendMaterials = []
if (!materialResponse.ok) {
  console.error(materialResponse.statusText)
} else {
  backendMaterials = await materialResponse.json()
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
    width: 398,
    depth: 398,
    height: 15,
  },
  materials: backendMaterials,
  activeMaterialId: backendMaterials[0].id,
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

        setMaterial: (material) =>
          set((state) => {
            const newMaterial: MaterialData = {
              id: material.id || crypto.randomUUID(),
              label: material.label || 'New Material',
              standard_thickness: material.standard_thickness || 5,
            }
            state.materials.push(newMaterial)
          }),

        updateMaterial: (material_id, updates) =>
          set((state) => {
            const materialToUpdate = state.materials.find((m) => m.id === material_id)
            if (materialToUpdate) {
              Object.assign(materialToUpdate, updates)
            }
          }),

        deleteMaterial: (material_id) =>
          set((state) => {
            state.materials = state.materials.filter((m) => m.id !== material_id)

            if (state.activeMaterialId === material_id) {
              state.activeMaterialId = ''
            }
          }),

        setActiveMaterial: (material_id) =>
          set((state) => {
            state.activeMaterialId = material_id
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
