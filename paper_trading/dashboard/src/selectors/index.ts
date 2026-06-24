import {
  selectGovernance,
  selectGovernanceByAsset,
  selectGovernanceSummary,
} from './governance'
import { systemSelectors } from './system'

export {
  selectGovernance,
  selectGovernanceByAsset,
  selectGovernanceSummary,
}

export type { GovernanceState } from './governance'

export const selectors = {
  governance: {
    all: selectGovernance,
    byAsset: selectGovernanceByAsset,
    summary: selectGovernanceSummary,
  },
  system: systemSelectors,
} as const
