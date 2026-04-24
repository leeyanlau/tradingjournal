// SESSION LOGIC
export const getSession = (time: string) => {
  if (!time || !time.includes(':')) return '';

  const hour = Number(time.split(':')[0]);

  if (isNaN(hour)) return '';

  // Asia: 8pm - 11:59pm
  if (hour >= 20 && hour <= 23) return 'Asia';

  // London: 2am - 5am
  if (hour >= 2 && hour <= 5) return 'London';

  // NYAM: 7am - 10am
  if (hour >= 7 && hour <= 10) return 'NYAM';

  return 'Out of KZ';
};
