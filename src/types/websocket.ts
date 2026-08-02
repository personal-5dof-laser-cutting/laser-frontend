type InfoMessage = { type: 'info'; content: string }
type ErrorMessage = { type: 'error'; content: string }
type UpdateMessage = { type: 'update'; form: 'progress' | 'status'; content: string | null }

export type WebsocketMessage = InfoMessage | ErrorMessage | UpdateMessage