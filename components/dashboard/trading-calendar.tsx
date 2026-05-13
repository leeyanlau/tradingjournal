'use client';

import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export default function TradingCalendar({ trades }: Props) {
  // -------------------------
  // GROUP DAILY PNL
  // -------------------------
  const dailyPnL = trades.reduce(
    (acc, trade) => {
      const normalizeDate = (d: string | Date) => {
        const date = new Date(d);
        return (
          date.getFullYear() +
          '-' +
          String(date.getMonth() + 1).padStart(2, '0') +
          '-' +
          String(date.getDate()).padStart(2, '0')
        );
      };
      const date = normalizeDate(trade.date);
      const pnl = Number(trade.amount) || 0;

      acc[date] = (acc[date] || 0) + pnl;

      return acc;
    },
    {} as Record<string, number>
  );

  const getDateKey = (date: Date) => {
    return (
      date.getFullYear() +
      '-' +
      String(date.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(date.getDate()).padStart(2, '0')
    );
  };

  return (
    <div className="rounded-xl bg-card text-card-foreground shadow-sm p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Daily PnL Calendar</h2>
        <p className="text-sm text-muted-foreground">
          Green = profitable day · Red = losing day
        </p>
      </div>

      <Calendar
        calendarType="gregory"
        tileClassName={({ date, view }) => {
          if (view !== 'month') return '';

          const key = getDateKey(date);
          const pnl = dailyPnL[key];

          if (pnl == null) return '';

          if (pnl > 0) return 'pnl-positive';
          if (pnl < 0) return 'pnl-negative';
          return 'pnl-neutral';
        }}
        tileContent={({ date, view }) => {
          if (view !== 'month') return null;

          const key = getDateKey(date);
          const pnl = dailyPnL[key];

          if (pnl == null) return null;

          return (
            <div className="mt-1 flex justify-center">
              <p
                className={`text-sm font-bold leading-none
    ${pnl > 0 ? 'text-green-700 dark:text-green-200' : ''}
    ${pnl < 0 ? 'text-red-700 dark:text-red-200' : ''}
  `}
              >
                {pnl > 0 ? '+' : ''}${pnl}
              </p>
            </div>
          );
        }}
      />
    </div>
  );
}
