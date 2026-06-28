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
  duplicateSvg: (id: string) => void
  resetProject: () => void
}

type ProjectStore = ProjectState & ProjectActions

export const INITIAL_STATE: ProjectState = {
  svgs: [],
  selectedId: null,
}

const parseUnitToPx = (valStr: string | null): string | null => {
  if (!valStr) return null
  const match = valStr.match(/^([\d.]+)(mm|cm|in|pt|pc)?$/)
  if (!match) return valStr

  const value = parseFloat(match[1])
  const unit = match[2]

  switch (unit) {
    case 'mm':
      return `${value * 3.779527559}px`
    case 'cm':
      return `${value * 37.79527559}px`
    case 'in':
      return `${value * 96}px`
    case 'pt':
      return `${value * 1.333333}px`
    case 'pc':
      return `${value * 16}px`
    default:
      return `${value}px`
  }
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

              const w = svgElement.getAttribute('width')
              const h = svgElement.getAttribute('height')
              if (w) svgElement.setAttribute('width', parseUnitToPx(w) || w)
              if (h) svgElement.setAttribute('height', parseUnitToPx(h) || h)

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

        duplicateSvg: (id) =>
          set((state) => {
            const itemToCopy = state.svgs.find((s) => s.id === id)
            if (!itemToCopy) return

            const newId = crypto.randomUUID()
            state.svgs.push({
              ...itemToCopy,
              id: newId,
              x: itemToCopy.x + 20, // INFO: offset position slightly for new svg
              y: itemToCopy.y + 20,
            })
            state.selectedId = newId
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
