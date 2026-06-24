import { createContext, useContext, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

interface SelectedAssetContextValue {
  selectedAsset: string | null
  setSelectedAsset: (name: string | null) => void
  deepDiveAsset: string | null
  setDeepDiveAsset: (name: string | null) => void
}

const EMPTY = {
  selectedAsset: null,
  setSelectedAsset: () => {},
  deepDiveAsset: null,
  setDeepDiveAsset: () => {},
} satisfies SelectedAssetContextValue

export const SelectedAssetContext = createContext<SelectedAssetContextValue>(EMPTY)

export function SelectedAssetProvider({ children }: { children: React.ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams()

  const selectedAsset = searchParams.get('asset')
  const deepDiveAsset = searchParams.get('deep')

  const setSelectedAsset = useCallback(
    (name: string | null) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (name) {
            next.set('asset', name)
          } else {
            next.delete('asset')
          }
          next.delete('deep')
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const setDeepDiveAsset = useCallback(
    (name: string | null) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (name) {
            next.set('deep', name)
          } else {
            next.delete('deep')
          }
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  return (
    <SelectedAssetContext.Provider value={{ selectedAsset, setSelectedAsset, deepDiveAsset, setDeepDiveAsset }}>
      {children}
    </SelectedAssetContext.Provider>
  )
}

export function useSelectedAsset() {
  return useContext(SelectedAssetContext)
}
