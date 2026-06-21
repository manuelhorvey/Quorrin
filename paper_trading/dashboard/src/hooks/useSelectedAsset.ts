import { createContext, useContext } from 'react'

interface SelectedAssetContextValue {
  selectedAsset: string | null
  setSelectedAsset: (name: string | null) => void
}

export const SelectedAssetContext = createContext<SelectedAssetContextValue>({
  selectedAsset: null,
  setSelectedAsset: () => {},
})

export function useSelectedAsset() {
  return useContext(SelectedAssetContext)
}
