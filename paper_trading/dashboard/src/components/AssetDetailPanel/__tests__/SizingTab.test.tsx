import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SizingTab from '../SizingTab'
import { buildAssetState } from './mocks'

describe('SizingTab', () => {
  it('renders configuration section', () => {
    render(<SizingTab asset={buildAssetState()} />)
    const slMults = screen.getAllByText('2.5000')
    expect(slMults.length).toBeGreaterThanOrEqual(1) // config sl_mult
    const tpMults = screen.getAllByText('1.5000')
    expect(tpMults.length).toBeGreaterThanOrEqual(1) // config tp_mult
    const nos = screen.getAllByText('No')
    expect(nos.length).toBeGreaterThanOrEqual(1)     // sell only
  })

  it('shows sell_only = Yes when set', () => {
    const asset = buildAssetState({ sell_only: true })
    render(<SizingTab asset={asset} />)
    expect(screen.getByText('Yes')).toBeInTheDocument()
  })

  it('shows tripwire_active = Yes when set', () => {
    const asset = buildAssetState({ tripwire_active: true })
    render(<SizingTab asset={asset} />)
    expect(screen.getByText('Yes')).toBeInTheDocument()
  })

  it('renders regime geometry entries', () => {
    render(<SizingTab asset={buildAssetState()} />)
    expect(screen.getByText(/SL=2\.00x TP=2\.50x/)).toBeInTheDocument() // TREND
    expect(screen.getByText(/SL=3\.00x TP=1\.50x/)).toBeInTheDocument() // RANGING
  })

  it('shows "None" when regime_geometry is empty', () => {
    const asset = buildAssetState({ regime_geometry: {} })
    render(<SizingTab asset={asset} />)
    expect(screen.getByText('None')).toBeInTheDocument()
  })

  it('renders sizing chain when present', () => {
    const asset = buildAssetState({
      validity_exposure: 0.75,
      narrative_size_scalar: 0.9,
      liquidity_size_scalar: 0.8,
      sizing_chain: {
        drawdown_taper: 0.85,
        effective_cap: 85000,
        size_scalar: 0.6,
        position_cap: 5000,
        risk_cap: 3000,
        leverage_budget: 200000,
        final_notional: 4500,
        quantity: 0.045,
      },
    })
    render(<SizingTab asset={asset} />)
    expect(screen.getByText('0.7500')).toBeInTheDocument()    // validity exposure
    expect(screen.getByText(/0\.9000x/)).toBeInTheDocument()  // narrative scalar
    expect(screen.getByText(/0\.8000x/)).toBeInTheDocument()  // liquidity scalar
    expect(screen.getByText(/0\.7200x/)).toBeInTheDocument()  // combined (0.9 * 0.8)
    expect(screen.getByText(/0\.8500x/)).toBeInTheDocument()  // drawdown taper
    expect(screen.getByText(/\$85000\.00/)).toBeInTheDocument()   // effective cap (Number.toFixed, no commas)
    expect(screen.getByText(/\$5000\.00/)).toBeInTheDocument()    // position cap
    expect(screen.getByText(/\$200000\.00/)).toBeInTheDocument()  // leverage budget
    expect(screen.getByText(/\$4500\.00/)).toBeInTheDocument()    // final notional
    expect(screen.getByText('0.045000')).toBeInTheDocument()     // quantity
  })

  it('shows "No entry attempted" when sizing_chain is null', () => {
    const asset = buildAssetState()
    render(<SizingTab asset={asset} />)
    // sizing_chain is null by default in the mock
    expect(screen.getByText('No entry attempted')).toBeInTheDocument()
  })

  it('renders skip reason when present in sizing chain', () => {
    const asset = buildAssetState({
      sizing_chain: {
        drawdown_taper: null,
        effective_cap: null,
        size_scalar: null,
        position_cap: null,
        risk_cap: null,
        leverage_budget: null,
        final_notional: null,
        quantity: null,
        reason: 'MIN_VIABLE_POSITION',
      },
    })
    render(<SizingTab asset={asset} />)
    expect(screen.getByText('MIN_VIABLE_POSITION')).toBeInTheDocument()
  })

  it('renders scale-out tiers when active', () => {
    const asset = buildAssetState({
      metrics: {
        ...buildAssetState().metrics,
        scale_out_active: true,
        scale_out_tiers: [
          { fraction: 0.5, price: 1.1050, filled: true, fill_price: 1.1050 },
          { fraction: 0.5, price: 1.1100, filled: false, fill_price: null },
        ],
        remaining_fraction: 0.5,
      },
    })
    render(<SizingTab asset={asset} />)
    expect(screen.getAllByText(/Scale-Out Tiers/).length).toBeGreaterThanOrEqual(1)
    const pctEls = screen.getAllByText(/50%/)
    expect(pctEls.length).toBeGreaterThanOrEqual(1)     // remaining fraction or tier
    expect(screen.getByText(/Filled @ \$1\.105/)).toBeInTheDocument()  // tier 1 filled (trailing 0 dropped in JS)
    expect(screen.getByText(/Pending @ \$1\.11/)).toBeInTheDocument()    // tier 2 pending
  })

  it('does not render scale-out section when inactive', () => {
    const asset = buildAssetState()
    const { container } = render(<SizingTab asset={asset} />)
    expect(container.textContent).not.toMatch(/Scale-Out Tiers/)
  })
})
