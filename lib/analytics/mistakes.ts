import { Trade } from '@/types/trade';

export type Mistake = {
  type: string;
  severity: 'low' | 'medium' | 'high';
  category: 'behavioral' | 'checklist';
};
