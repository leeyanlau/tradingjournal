import { Trade } from '@/types/trade';

/**
 * Convert frontend Trade → Supabase row
 */
export const toDBTrade = (trade: Trade) => {
  return {
    id: trade.id,

    date: trade.date,
    entry_time: trade.entryTime,
    exit_time: trade.exitTime,
    session: trade.session,

    direction: trade.direction,
    type: trade.type,
    pair: trade.pair,
    result: trade.result,

    risk: trade.risk,
    amount: trade.amount,

    checklist: trade.checklist,
    checklist_score: trade.checklistScore,
    suggested_risk: trade.suggestedRisk,

    remarks: trade.remarks,
    feeling: trade.feeling,

    moved_stops: trade.movedStops,
    moved_stops_worked: trade.movedStopsWorked,

    behavioral_mistakes: trade.behavioralMistakes,
  };
};

/**
 * Convert Supabase row → frontend Trade
 */
export const fromDBTrade = (row: any): Trade => {
  return {
    id: row.id,

    date: row.date,
    entryTime: row.entry_time,
    exitTime: row.exit_time,
    session: row.session,

    direction: row.direction,
    type: row.type,
    pair: row.pair,
    result: row.result,

    risk: row.risk,
    amount: row.amount,

    checklist: row.checklist ?? {},
    checklistScore: row.checklist_score ?? 0,
    suggestedRisk: row.suggested_risk ?? '',

    remarks: row.remarks ?? '',
    feeling: row.feeling ?? 'Calm',

    movedStops: row.moved_stops ?? false,
    movedStopsWorked: row.moved_stops_worked ?? null,

    behavioralMistakes: row.behavioral_mistakes ?? [],
  };
};
