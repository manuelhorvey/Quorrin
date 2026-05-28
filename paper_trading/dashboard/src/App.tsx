import { useState } from 'react'
import { usePortfolioState } from './hooks/usePortfolioState'
import Header from './components/Header'
import PortfolioSummary from './components/PortfolioSummary'
import AssetGrid from './components/AssetGrid'
import SignalsTable from './components/SignalsTable'
import MetricsGrid from './components/MetricsGrid'
import HaltConditions from './components/HaltConditions'
import TradeFeed from './components/TradeFeed'
import EquityChart from './components/EquityChart'
import ConfidenceChart from './components/ConfidenceChart'
import VolRegimePanel from './components/VolRegimePanel'
import HealthScores from './components/HealthScores'
import GovernancePanel from './components/GovernancePanel'
import TradeOutcomes from './components/TradeOutcomes'
import GovernanceStateCards from './components/GovernanceStateCards'
import HitRateDrift from './components/HitRateDrift'
import RiskParityPanel from './components/RiskParityPanel'
import PSIDriftCard from './components/PSIDriftCard'
import EngineLogs from './components/EngineLogs'
import AlertFeed from './components/AlertFeed'
import Footer from './components/Footer'
import LoadingScreen from './components/ui/LoadingScreen'
import ErrorScreen from './components/ui/ErrorScreen'
import Section from './components/ui/Section'
import WeeklyReviewPopup from './components/WeeklyReviewPopup'
import { useLastReview } from './hooks/useLastReview'
import type { FilterState } from './components/FilterBar'
import FilterBar from './components/FilterBar'
import ExecutionQualityStrip from './components/execution/ExecutionQualityStrip'
import AttributionBreakdownCard from './components/attribution/AttributionBreakdownCard'
import PnLWaterfall from './components/attribution/PnLWaterfall'
import MaeMfeScatter from './components/attribution/MaeMfeScatter'
import SlippageHistogram from './components/execution/SlippageHistogram'
import FillQualityGauge from './components/execution/FillQualityGauge'
import TradeExecutionTable from './components/execution/TradeExecutionTable'
import ShadowComparisonTable from './components/shadow/ShadowComparisonTable'
import ShadowDivergenceChart from './components/shadow/ShadowDivergenceChart'
import { useAttributionTrades } from './hooks/useAttributionTrades'
import AnchorNav from './components/AnchorNav'
import ErrorBoundary from './components/ErrorBoundary'

export default function App() {
  const { isPending, isError, isFetching } = usePortfolioState()
  const [filters, setFilters] = useState<FilterState>({ archetype: '', regime: '', asset: '' })
  const { data: allTrades } = useAttributionTrades(200)
  const uniqueAssets = [...new Set(allTrades?.map(t => t.asset) ?? [])]

  if (isPending) return <LoadingScreen />
  if (isError) return <ErrorScreen />

  return (
    <ErrorBoundary title="Application">
      <div className="min-h-screen bg-app text-secondary flex flex-col">
        <div className="fixed inset-0 pointer-events-none opacity-[0.35] dark:opacity-[0.2] grid-dot" />
        <Header />
        <AnchorNav />

        <main
        className="flex-1 max-w-[90rem] w-full mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-5 sm:space-y-6 relative animate-fade-in"
        data-fetching={isFetching ? 'true' : undefined}
      >
        <Section id="portfolio" errorTitle="Portfolio">
          <PortfolioSummary />
          <AssetGrid />
          <HaltConditions />
        </Section>

        <Section id="governance" errorTitle="Governance">
          <GovernancePanel />
          <GovernanceStateCards />
          <RiskParityPanel />
          <PSIDriftCard />
        </Section>

        <Section id="signals" errorTitle="Signals">
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-5">
            <div className="xl:col-span-3 min-w-0">
              <SignalsTable />
            </div>
            <div className="xl:col-span-2 min-w-0">
              <EquityChart />
            </div>
          </div>
        </Section>

        <Section id="execution" errorTitle="Execution" className="space-y-4 sm:space-y-5">
          <FilterBar assets={uniqueAssets} onChange={setFilters} />
          <ExecutionQualityStrip />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            <AttributionBreakdownCard />
            <PnLWaterfall />
          </div>
          <MaeMfeScatter />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
            <div className="lg:col-span-2 min-w-0">
              <SlippageHistogram />
            </div>
            <div className="lg:col-span-1 min-w-0">
              <FillQualityGauge />
            </div>
          </div>
          <TradeExecutionTable />
          <ShadowDivergenceChart />
          <ShadowComparisonTable />
        </Section>

        <Section id="risk" errorTitle="Risk">
          <HealthScores />
        </Section>

        <Section id="charts" errorTitle="Charts">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
            <div className="lg:col-span-2 min-w-0">
              <MetricsGrid />
            </div>
            <div className="space-y-4 sm:space-y-5 min-w-0">
              <ConfidenceChart />
              <HitRateDrift />
              <VolRegimePanel />
            </div>
          </div>
        </Section>

        <Section id="trades" errorTitle="Trades">
          <TradeOutcomes />
          <TradeFeed />
        </Section>

        <Section id="alert-feed" errorTitle="Alert Feed">
          <AlertFeed />
        </Section>

        <Section id="engine-logs" errorTitle="Engine Logs">
          <EngineLogs />
        </Section>
      </main>

      <Footer />

      <WeeklyReviewPopupWrapper />
    </div>
    </ErrorBoundary>
  )
}

function WeeklyReviewPopupWrapper() {
  const controls = useLastReview()
  if (!controls.show) return null
  return <WeeklyReviewPopup controls={controls} />
}
