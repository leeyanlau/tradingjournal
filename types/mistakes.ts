export type Mistake = {
  type: string;
  severity: 'low' | 'medium' | 'high';
  category: 'behavioral' | 'checklist';
};
