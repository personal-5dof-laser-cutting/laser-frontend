import { createStore } from 'zustand/vanilla'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

import { useCutterStore } from '@/stores/useCutterStore'
import { useWebsocketStore } from '@/stores/useWebsocketStore'

import type { Parameters, SVGData } from '@/types/websocket'
import { useToast } from 'vue-toastification'

interface ProjectState {
  svgs: SVGData[]
  selectedId: string | null
  progressTotal: number
  progress: number | null
}

interface ProjectActions {
  uploadSvg: (event: Event) => void
  updateSvg: (id: string, updates: Partial<SVGData>) => void
  removeSvg: (id: string) => void
  selectSvg: (id: string | null) => void
  duplicateSvg: (id: string) => void
  resetProject: () => void
  generateSvg: () => string
  exportProject: () => void
  submitJob: (params: Parameters) => void
  homeCutter: () => void
  abortCut: () => void
  setProgressTotal: (number_commands: number) => void
  updateProgress: () => void
  resetProgress: () => void
}

type ProjectStore = ProjectState & ProjectActions

export const INITIAL_STATE: ProjectState = {
  svgs: [],
  selectedId: null,
  progressTotal: 0,
  progress: null,
}

function pxToMm(px: number, dpi: number): number {
  return (px / dpi) * 25.4
}

function unitToMm(value: string | null, dpi: number | null = null): number | null {
  if (!value) return null
  const match = value.trim().match(/^([\d.]+)\s*(mm|cm|in|pt|pc)?$/)
  if (!match || !match[1]) return null

  const num = parseFloat(match[1])
  const unit = match[2]

  switch (unit) {
    case 'mm': return num
    case 'cm': return num * 10
    case 'in': return num * 25.4
    case 'pt': return num * (25.4 / 72)
    case 'pc': return num * (25.4 / 6)
    default: return dpi ? pxToMm(num, dpi) : null // px or unitless — not reliable and no dpi provided, caller must decide fallback
  }
}

export const useProjectStore = createStore<ProjectStore>()(
  devtools(
    persist(
      immer((set, get) => ({
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

            const promptForDpi = (): number => {
              let dpi: number
              do {
                dpi = parseFloat(prompt("Please enter the SVG's DPI:") || "")
              } while (isNaN(dpi))
              return dpi
            }

            if (svgElement) {
              svgElement.removeAttribute('x')
              svgElement.removeAttribute('y')

              const vbWidth = svgElement.viewBox?.baseVal?.width
              const vbHeight = svgElement.viewBox?.baseVal?.height

              const w = svgElement.getAttribute('width')
              const h = svgElement.getAttribute('height')

              const hasWidthHeight = Boolean(w && h)
              const hasViewBox = Boolean(vbWidth && vbHeight)

              if (!hasWidthHeight && !hasViewBox) {
                useToast().error(
                  "The uploaded SVG is invalid. Make sure it has a width and height set or a viewBox exists"
                )
                return
              }

              let widthMm = hasWidthHeight ? unitToMm(w!) : null
              let heightMm = hasWidthHeight ? unitToMm(h!) : null

              if (widthMm == null || heightMm == null) {
                const sourceWidth = hasWidthHeight ? w : String(vbWidth)
                const sourceHeight = hasWidthHeight ? h : String(vbHeight)
                const dpi = promptForDpi()
                widthMm = unitToMm(sourceWidth, dpi) as number
                heightMm = unitToMm(sourceHeight, dpi) as number
              }

              svgElement.setAttribute('width', String(widthMm))
              svgElement.setAttribute('height', String(heightMm))

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

        generateSvg: () => {
          const { cutbed } = useCutterStore.getState()
          const { width, depth } = cutbed
          const { svgs } = get()

          let exportedContent = ''

          svgs.forEach((svg) => {
            exportedContent += `
<g transform="translate(${svg.x}, ${svg.y}) rotate(${svg.rotation})">
  ${svg.content}
</g>
            `
          })

          const physicalWidthMm = width
          const physicalHeightMm = depth

          return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${physicalWidthMm}mm"
  height="${physicalHeightMm}mm"
  viewBox="0 0 ${physicalWidthMm} ${physicalHeightMm}"
>
  <defs>
    <clipPath id="cutbed-bounds">
      <rect x="0" y="0" width="${width}" height="${depth}" />
    </clipPath>
  </defs>

  <g clip-path="url(#cutbed-bounds)">
    ${exportedContent}
  </g>
</svg>`
        },

        exportProject: () => {
          const { generateSvg } = get()

          const blob = new Blob([generateSvg()], { type: 'image/svg+xml;charset=utf-8' })
          const url = URL.createObjectURL(blob)

          const link = document.createElement('a')
          link.href = url
          link.download = 'cutbed-export.svg'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)

          URL.revokeObjectURL(url)
        },

        submitJob: (params: Parameters) => {
          const { sendMessage } = useWebsocketStore.getState()
          const { generateSvg } = get()

          const message = { type: "job", input: {svg: generateSvg(), ...params }}

          sendMessage(message)
        },

        homeCutter: () => {
          const { sendMessage } = useWebsocketStore.getState()
          const message = { type: "action", action: "home"}

          sendMessage(message)
        },

        abortCut: () => {
          const { sendMessage } = useWebsocketStore.getState()
          const message = { type: "action", action: "abort"}

          sendMessage(message)
        },

        setProgressTotal: (number_commands) =>
          set((state) => {
            state.progressTotal = number_commands;
            state.progress = 0;
          }),

        updateProgress: () =>
          set((state) => {
            if (state.progress != null && state.progress < state.progressTotal) {
              state.progress++
            }
          }),

        resetProgress: () =>
          set((state) => {
            state.progress = null
            state.progressTotal = 0
          })
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
