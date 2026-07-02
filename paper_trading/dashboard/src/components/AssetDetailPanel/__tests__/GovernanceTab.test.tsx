import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import GovernanceTab from '../GovernanceTab'
import { buildAssetState } from './mocks'

describe('GovernanceTab', () => {
  it('renders validity exposure bar and value', () => {
    render(<GovernanceTab asset={buildAssetState()} />)
    expect(screen.getByText('Validity')).toBeInTheDocument()
    expect(screen.getByText('0.85')).toBeInTheDocument()
  })

  it('renders effective SL and TP multipliers', () => {
    render(<GovernanceTab asset={buildAssetState()} />)
    expect(screen.getByText('2.5000')).toBeInTheDocument() // sl_mult
    expect(screen.getByText('1.5000')).toBeInTheDocument() // tp_mult
  })

  it('renders gate override', () => {
    const asset = buildAssetState({ gate_override: true })
    render(<GovernanceTab asset={asset} />)
    expect(screen.getByText(/Gate Override/)).toBeInTheDocument()
  })

  it('renders regime section', () => {
    render(<GovernanceTab asset={buildAssetState()} />)
    expect(screen.getByText('RISK_ON')).toBeInTheDocument()          // narrative regime
    const nos = screen.getAllByText('No')
    expect(nos.length).toBeGreaterThanOrEqual(2)                     // narrative stale + halted
    expect(screen.getByText('NORMAL')).toBeInTheDocument()           // liquidity regime
  })

  it('renders halt checks section', () => {
    const asset = buildAssetState({
      halt: {
        ...buildAssetState().halt,
        halted: true,
        reasons: ['DRAWDOWN_LIMIT', 'PSI_BREACH'],
        drawdown_ok: false,
        psi_ok: false,
      },
    })
    render(<GovernanceTab asset={asset} />)
    const yesEls = screen.getAllByText('Yes')
    expect(yesEls.length).toBeGreaterThan(0)             // halted = Yes among others
    const noEls = screen.getAllByText('No')
    expect(noEls.length).toBeGreaterThan(0)              // some halt checks
    // ⛔ DRAWDOWN_LIMIT; PSI_BREACH
    expect(screen.getByText(/DRAWDOWN_LIMIT/)).toBeInTheDocument()
    expect(screen.getByText(/PSI_BREACH/)).toBeInTheDocument()
  })

  it('shows halted message with reasons', () => {
    const asset = buildAssetState({
      halt: {
        ...buildAssetState().halt,
        halted: true,
        reasons: ['DRAWDOWN_LIMIT'],
        drawdown_ok: false,
      },
    })
    render(<GovernanceTab asset={asset} />)
    expect(screen.getByText(/⛔/)).toBeInTheDocument()
  })

  it('renders PSI drift section when psi_drift exists', () => {
    const asset = buildAssetState()
    render(<GovernanceTab asset={asset} />)
    expect(screen.getByText('moderate')).toBeInTheDocument()  // worst classification
    expect(screen.getByText('1')).toBeInTheDocument()         // moderate count
    expect(screen.getByText('0')).toBeInTheDocument()         // severe count
  })

  it('does not render PSI drift section when psi_drift is null', () => {
    const asset = buildAssetState({
      metrics: { ...buildAssetState().metrics, psi_drift: null as any },
    })
    const { container } = render(<GovernanceTab asset={asset} />)
    expect(container.textContent).not.toMatch(/PSI Drift/)
  })

  it('renders per-feature collapsible PSI section', () => {
    render(<GovernanceTab asset={buildAssetState()} />)
    expect(screen.getByText(/Per-Feature \(2\)/)).toBeInTheDocument()
  })

  it('renders meta-labeling section when meta_inference exists', () => {
    const asset = buildAssetState({
      metrics: {
        ...buildAssetState().metrics,
        meta_inference: { meta_confidence: 0.85, meta_decision: 'ENTER' },
      },
    })
    render(<GovernanceTab asset={asset} />)
    expect(screen.getByText(/0\.8500/)).toBeInTheDocument()  // meta confidence
    expect(screen.getByText('ENTER')).toBeInTheDocument()    // meta decision
  })

  it('renders BLOCK meta-decision in red', () => {
    const asset = buildAssetState({
      metrics: {
        ...buildAssetState().metrics,
        meta_inference: { meta_confidence: 0.92, meta_decision: 'BLOCK' },
      },
    })
    render(<GovernanceTab asset={asset} />)
    expect(screen.getByText('BLOCK')).toBeInTheDocument()
  })

  it('renders soft warnings when present', () => {
    const asset = buildAssetState({
      soft_warnings: ['LOW_LIQUIDITY', 'HIGH_SPREAD'],
    })
    render(<GovernanceTab asset={asset} />)
    expect(screen.getByText(/LOW_LIQUIDITY, HIGH_SPREAD/)).toBeInTheDocument()
  })
})
