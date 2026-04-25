import { Trade, Checklist } from '@/types/trade';
import { Mistake } from '@/lib/analytics/mistakes';
import { checklistRules } from './checklistRules';

export const detectMistakes = (t: Trade): Mistake[] => {
  const mistakes: Mistake[] = [];

  // ===== CHECKLIST (ONLY penalize on losses) =====
  if (t.result === 'Loss') {
    (Object.keys(checklistRules) as (keyof Checklist)[]).forEach((key) => {
      if (!t.checklist[key]) {
        const rule = checklistRules[key];
        mistakes.push({
          type: rule.type,
          severity: rule.severity,
          category: 'checklist',
        });
      }
    });
  }

  // ===== QUALITY =====
  if (t.checklistScore <= 6) {
    mistakes.push({
      type: 'Low score trade',
      severity: 'high',
      category: 'behavioral',
    });
  }

  if (t.result === 'Loss' && t.checklistScore <= 7) {
    mistakes.push({
      type: 'Low quality loss',
      severity: 'medium',
      category: 'behavioral',
    });
  }

  // ===== BEHAVIOR =====
  if (t.feeling === 'Anxious') {
    mistakes.push({
      type: 'Emotional trading (anxious)',
      severity: 'medium',
      category: 'behavioral',
    });
  }

  if (t.movedStops && t.movedStopsWorked === 'OVERMANAGED') {
    mistakes.push({
      type: 'Over-tightened stop (missed TP)',
      severity: 'medium',
      category: 'behavioral',
    });
  }

  const riskValue = Number((t.risk || '').replace('%', ''));
  if (riskValue > 1) {
    mistakes.push({
      type: 'Over risk (>1%)',
      severity: 'high',
      category: 'behavioral',
    });
  }

  if (t.session === 'Out of KZ') {
    mistakes.push({
      type: 'Outside session',
      severity: 'medium',
      category: 'behavioral',
    });
  }

  return mistakes;
};
