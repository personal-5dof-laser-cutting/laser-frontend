import { shallowRef, onUnmounted } from 'vue'
import type { StoreApi } from 'zustand/vanilla'

export function useStore<T>(store: StoreApi<T>) {
  const state = shallowRef(store.getState())

  const unsubscribe = store.subscribe((newState) => {
    state.value = newState
  })

  onUnmounted(() => {
    unsubscribe()
  })

  return state
}
