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
};
