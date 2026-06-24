import { createStore } from 'zustand/vanilla'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

export type SVGData = {
  id: string
  content: string
  x: number
  y: number
  rotation: number
}

interface ProjectState {
  svgs: SVGData[]
  selectedId: string | null
}

interface ProjectActions {
  uploadSvg: (event: Event) => void
  updateSvg: (id: string, updates: Partial<SVGData>) => void
  removeSvg: (id: string) => void
  selectSvg: (id: string | null) => void
  resetProject: () => void
}

type ProjectStore = ProjectState & ProjectActions

export const INITIAL_STATE: ProjectState = {
  svgs: [],
  selectedId: null,
}

export const useProjectStore = createStore<ProjectStore>()(
  devtools(
    persist(
      immer((set) => ({
        ...INITIAL_STATE,

        uploadSvg: (event: Event) => {
          const target = event.target as HTMLInputElement
          const file = target.files?.[0]
          if (!file) return

          const reader = new FileReader()
          reader.onload = (e) => {
            const text = e.target?.result as string
            const parser = new DOMParser()
            const doc = parser.parseFromString(text, 'image/svg+xml')
            const svgElement = doc.querySelector('svg')

            if (svgElement) {
              svgElement.removeAttribute('x')
              svgElement.removeAttribute('y')

              const newSvg: SVGData = {
                id: crypto.randomUUID(),
                content: svgElement.outerHTML,
                x: 175,
                y: 175,
                rotation: 0,
              }

              set((state) => {
                state.svgs.push(newSvg)
                state.selectedId = newSvg.id
              })
            }
            target.value = ''
          }
          reader.readAsText(file)
        },

        updateSvg: (id, updates) =>
          set((state) => {
            const item = state.svgs.find((s) => s.id === id)
            if (item) {
              Object.assign(item, updates)
            }
          }),

        removeSvg: (id) =>
          set((state) => {
            state.svgs = state.svgs.filter((s) => s.id !== id)
            if (state.selectedId === id) {
              state.selectedId = null
            }
          }),

        selectSvg: (id) =>
          set((state) => {
            state.selectedId = id
          }),

        resetProject: () =>
          set(() => {
            return INITIAL_STATE
          }),
      })),
      {
        name: 'LaserFrontend-Project-Storage',
      },
    ),
    {
      name: 'LaserFrontend DevTools',
      enabled: true,
    },
  ),
)
