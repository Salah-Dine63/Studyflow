import React, { useMemo } from 'react';
import styles from './Heatmap.module.css';

interface HeatmapProps {
  data: { day: string; minutes: number }[];
}

interface DayCell {
  date: string; // YYYY-MM-DD
  minutes: number;
}

type Week = (DayCell | null)[];

const COLORS: { min: number; color: string }[] = [
  { min: 61, color: '#7c6af7' },
  { min: 41, color: '#6254d4' },
  { min: 21, color: '#4338a0' },
  { min: 1,  color: '#2d2466' },
  { min: 0,  color: '#1a1a2e' },
];

function getColor(minutes: number): string {
  for (const { min, color } of COLORS) {
    if (minutes >= min) return color;
  }
  return '#1a1a2e';
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Returns 0=Mon … 6=Sun (ISO weekday - 1)
function isoWeekday(date: Date): number {
  return (date.getDay() + 6) % 7;
}

const LEGEND_COLORS = ['#1a1a2e', '#2d2466', '#4338a0', '#6254d4', '#7c6af7'];
const LEGEND_LABELS = ['0', '1-20', '21-40', '41-60', '60+'];

const Heatmap: React.FC<HeatmapProps> = ({ data }) => {
  const { weeks, monthLabels } = useMemo(() => {
    // Build lookup map
    const minuteMap = new Map<string, number>();
    for (const entry of data) {
      minuteMap.set(entry.day, entry.minutes);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Generate 112 days back from today
    const totalDays = 112;
    const allDays: DayCell[] = [];
    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = formatDate(d);
      allDays.push({ date: dateStr, minutes: minuteMap.get(dateStr) ?? 0 });
    }

    // Pad the start so the first column begins on Monday
    const firstDate = new Date(allDays[0].date);
    const startPad = isoWeekday(firstDate); // 0=Mon, so pad = weekday index

    // Build weeks (columns of 7, Mon-top Sun-bottom)
    const paddedLength = startPad + allDays.length;
    const weekCount = Math.ceil(paddedLength / 7);
    const builtWeeks: Week[] = [];
    const builtMonthLabels: { weekIndex: number; label: string }[] = [];

    let prevMonth: number | null = null;

    for (let w = 0; w < weekCount; w++) {
      const week: Week = [];
      for (let d = 0; d < 7; d++) {
        const idx = w * 7 + d - startPad;
        if (idx < 0 || idx >= allDays.length) {
          week.push(null);
        } else {
          const cell = allDays[idx];
          week.push(cell);

          // Detect month change for label on first day of week (d === 0) or first appearance
          if (d === 0) {
            const monthNum = new Date(cell.date).getMonth();
            if (monthNum !== prevMonth) {
              builtMonthLabels.push({ weekIndex: w, label: MONTH_NAMES[monthNum] });
              prevMonth = monthNum;
            }
          }
        }
      }
      builtWeeks.push(week);
    }

    return { weeks: builtWeeks, monthLabels: builtMonthLabels };
  }, [data]);

  return (
    <div>
      {/* Month labels row */}
      <div className={styles.months}>
        {weeks.map((_, wi) => {
          const label = monthLabels.find((m) => m.weekIndex === wi);
          return (
            <div
              key={wi}
              className={styles.monthLabel}
              style={{ width: 14, minWidth: 14 }}
            >
              {label ? label.label : ''}
            </div>
          );
        })}
      </div>

      {/* Grid */}
      <div className={styles.grid}>
        {weeks.map((week, wi) => (
          <div key={wi} className={styles.week}>
            {week.map((cell, di) => {
              if (!cell) {
                return (
                  <div
                    key={di}
                    className={styles.cell}
                    style={{ background: 'transparent' }}
                  />
                );
              }
              return (
                <div
                  key={di}
                  className={styles.cell}
                  style={{ backgroundColor: getColor(cell.minutes) }}
                  title={`${cell.date}: ${cell.minutes} min`}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <span>Less</span>
        {LEGEND_COLORS.map((color, i) => (
          <div
            key={i}
            className={styles.cell}
            style={{ backgroundColor: color, cursor: 'default' }}
            title={LEGEND_LABELS[i]}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
};

export default Heatmap;
