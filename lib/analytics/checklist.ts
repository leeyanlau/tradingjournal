export type ChecklistRule = {
  key: string;
  label: string;
  weight: number;
};

export const checklistRules: ChecklistRule[] = [
  { key: 'followedPlan', label: 'Followed trading plan', weight: 2 },
  { key: 'waitedForEntry', label: 'Waited for proper entry', weight: 2 },
  { key: 'riskManaged', label: 'Proper risk management', weight: 3 },
  { key: 'noRevengeTrade', label: 'No revenge trading', weight: 3 },
  { key: 'emotionControlled', label: 'Emotion under control', weight: 2 },
];

export const calculateChecklist = (checklist: Record<string, boolean> = {}) => {
  let score = 0;
  let maxScore = 0;

  checklistRules.forEach((rule) => {
    maxScore += rule.weight;

    if (checklist?.[rule.key]) {
      score += rule.weight;
    }
  });

  return {
    score,
    maxScore,
    percentage: maxScore ? (score / maxScore) * 100 : 0,
  };
};
