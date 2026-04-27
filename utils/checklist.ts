import { Checklist } from '@/types/trade';

// CHECKLIST SCORE
export const calculateChecklist = (checklist: Checklist) => {
  const score = Object.values(checklist).filter(Boolean).length;

  let risk = '0%';
  if (score >= 8) risk = '1%';
  else if (score === 7) risk = '0.5%';

  return { score, risk };
};
