import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import DiagnosticsTab from '../DiagnosticsTab'
import { buildAssetState } from './mocks'

describe('DiagnosticsTab', () => {
  it('renders feature stability section', () => {
    render(<DiagnosticsTab asset={buildAssetState()} />)
    const jaccards = screen.getAllByText('0.8500')
    expect(jaccards.length).toBeGreaterThanOrEqual(1)      // jaccard
    expect(screen.getByText('0.7200')).toBeInTheDocument()  // spearman
    expect(screen.getByText('0.0500')).toBeInTheDocument()  // penalty
    expect(screen.getByText('w-042')).toBeInTheDocument()   // window id
  })

  it('renders regime model section', () => {
    render(<DiagnosticsTab asset={buildAssetState()} />)
    expect(screen.getByText('TREND')).toBeInTheDocument()          // last regime label
    expect(screen.getByText('0.6200')).toBeInTheDocument()         // regime long prob
  })

  it('renders archetype stats entries', () => {
    render(<DiagnosticsTab asset={buildAssetState()} />)
    expect(screen.getByText(/trend_follow/)).toBeInTheDocument()
    expect(screen.getByText(/mean_reversion/)).toBeInTheDocument()
    // Check formatted values: n=20 WR=65% avgR=0.80
    expect(screen.getByText(/WR=65%/)).toBeInTheDocument()
    expect(screen.getByText(/avgR=0\.80/)).toBeInTheDocument()
  })

  it('shows "None" when archetype stats is empty', () => {
    const asset = buildAssetState({
      metrics: { ...buildAssetState().metrics, archetype_stats: {} },
    })
    render(<DiagnosticsTab asset={asset} />)
    expect(screen.getByText('None')).toBeInTheDocument()
  })

  it('renders statistical metrics section', () => {
    render(<DiagnosticsTab asset={buildAssetState()} />)
    expect(screen.getByText('0.9500')).toBeInTheDocument()  // PSR(>0)
    expect(screen.getByText('0.4500')).toBeInTheDocument()  // PSR(>1)
    expect(screen.getByText('30.5')).toBeInTheDocument()    // MinTRL
    expect(screen.getByText('0.8800')).toBeInTheDocument()  // CRS
    expect(screen.getByText('0.1200')).toBeInTheDocument()  // HHI
  })

  it('renders stop-out section', () => {
    const asset = buildAssetState({
      stop_out_last_side: 'SELL',
      stop_out_last_cycle: 142,
    })
    render(<DiagnosticsTab asset={asset} />)
    expect(screen.getByText('SELL')).toBeInTheDocument()  // last side
    expect(screen.getByText('142')).toBeInTheDocument()   // last cycle
  })

  it('shows — for null stop-out fields', () => {
    render(<DiagnosticsTab asset={buildAssetState()} />)
    // stop_out_last_side and stop_out_last_cycle are null by default
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(2)
  })

  it('does not render penalty/window fields when feature_stability is null', () => {
    const asset = buildAssetState({
      metrics: { ...buildAssetState().metrics, feature_stability: null as any },
    })
    const { container } = render(<DiagnosticsTab asset={asset} />)
    expect(container.textContent).not.toMatch(/w-042/)
  })
})
