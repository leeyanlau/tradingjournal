import { Checklist } from '@/types/trade';
import { Mistake } from '@/lib/analytics/mistakes';

export const checklistRules: Record<
  keyof Checklist,
  { type: string; severity: Mistake['severity'] }
> = {
  bias: { type: 'No daily bias', severity: 'high' },
  timeframeAlignment: { type: 'No timeframe alignment', severity: 'high' },
  sessionProfile: { type: 'No session profile', severity: 'medium' },
  pdArray: { type: 'No PD Array context', severity: 'medium' },
  cisd: { type: 'No CISD confirmation', severity: 'medium' },
  strongHL: { type: 'Weak high/low', severity: 'medium' },
  news: { type: 'Ignored news', severity: 'medium' },
  killzone: { type: 'Outside killzone', severity: 'medium' },
  smt: { type: 'No SMT confirmation', severity: 'low' },
};
