import { Trade } from '@/types/trade';

const emptyChecklist = {
  bias: false,
  timeframeAlignment: false,
  sessionProfile: false,
  pdArray: false,
  cisd: false,
  strongHL: false,
  news: false,
  killzone: false,
  smt: false,
};

export const createDefaultTrade = (): Trade => ({
  id: crypto.randomUUID(),
  date: '',
  entryTime: '',
  exitTime: '',
  session: '',
  direction: 'Buy',
  type: 'Scalp',
  pair: '',
  result: 'Win',
  risk: '',
  amount: '',
  checklist: { ...emptyChecklist },
  checklistScore: 0,
  suggestedRisk: '0%',
  remarks: '',
  feeling: 'Calm',
  movedStops: false,
  movedStopsWorked: null,
  behavioralMistakes: [],
});
