import PortfolioSummary from '../components/PortfolioSummary'
import HaltConditions from '../components/HaltConditions'
import MonitoringDashboard from '../components/monitor/MonitoringDashboard'

export default function DashboardOverview() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <MonitoringDashboard />
      <PortfolioSummary />
      <HaltConditions />
    </div>
  )
}
