import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SelectedAssetProvider } from './hooks/useSelectedAsset'
import AppShell from './components/layout/AppShell'
import ErrorBoundary from './components/ErrorBoundary'

import DashboardOverview from './pages/DashboardOverview'
import TradingWorkspace from './pages/TradingWorkspace'
import ExecutionWorkspace from './pages/ExecutionWorkspace'
import RiskWorkspace from './pages/RiskWorkspace'

import AssetDetailPanel from './components/AssetDetailPanel'
import AssetDeepDive from './components/AssetDeepDive'
import WeeklyReviewModal from './components/WeeklyReviewModal'

import { usePortfolioState } from './hooks/usePortfolioState'
import { useSelectedAsset } from './hooks/useSelectedAsset'

function AppContent() {
  const { data: state } = usePortfolioState()
  const { selectedAsset, deepDiveAsset } = useSelectedAsset()

  const detailAsset = selectedAsset && state?.assets?.[selectedAsset]

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardOverview />} />
        <Route path="/trading" element={<TradingWorkspace />} />
        <Route path="/execution" element={<ExecutionWorkspace />} />
        <Route path="/risk" element={<RiskWorkspace />} />
      </Routes>

      {detailAsset && (
        <AssetDetailPanel
          asset={detailAsset}
          name={selectedAsset!}
          onClose={() => {}} // URL-backed: setSelectedAsset(null) is the real close
        />
      )}
      {deepDiveAsset && (
        <AssetDeepDive
          name={deepDiveAsset}
          onClose={() => {}}
        />
      )}
      <WeeklyReviewModal />
    </>
  )
}

export default function App() {
  return (
    <ErrorBoundary title="Application">
      <HashRouter>
        <SelectedAssetProvider>
          <AppShell>
            <AppContent />
          </AppShell>
        </SelectedAssetProvider>
      </HashRouter>
    </ErrorBoundary>
  )
}
