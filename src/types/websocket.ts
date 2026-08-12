export type Parameters = {
  material: string
  material_thickness: number
  dpi: number
  cut_speed: number
  laser_power: number
  laser_off: boolean
  optimize: boolean
}

export type SVGData = {
  id: string
  content: string
  x: number
  y: number
  rotation: number
}

export type InfoMessage = { type: 'info'; content: string }
export type ErrorMessage = { type: 'error'; content: string }
export type ActionMessage = { type: 'action'; action: 'abort' | 'home' }
export type UpdateMessage = { type: 'update'; form: 'progress' | 'status'; content: string | null }
export type JobMessage = { type: 'job'; input: {svg: string} & Parameters}
export type GCodeMessage = { type: 'gcode', command: string }

export type WebsocketMessage = InfoMessage | ErrorMessage | ActionMessage | UpdateMessage | JobMessage | GCodeMessage