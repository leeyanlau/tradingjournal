import { Mistake } from '@/lib/analytics/mistakes';

export type MovedStopResult = 'PROTECTED' | 'OVERMANAGED' | 'IRRELEVANT' | null;

export type Trade = {
  id: string;
  date: string;
  entryTime: string;
  exitTime: string;
  session: string;
  direction: string;
  type: string;
  pair: string;
  result: string;
  risk: string;
  amount: string;
  checklist: Checklist;
  checklistScore: number;
  suggestedRisk: string;
  remarks: string;
  feeling: string;
  movedStops: boolean;
  movedStopsWorked: MovedStopResult;
  behavioralMistakes: Mistake[];
};

export type Checklist = {
  bias: boolean;
  timeframeAlignment: boolean;
  sessionProfile: boolean;
  pdArray: boolean;
  cisd: boolean;
  strongHL: boolean;
  news: boolean;
  killzone: boolean;
  smt: boolean;
};
