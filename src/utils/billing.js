// billing.js - Utilities for bill cycle calculation (client-side)
import { addDays, lastDayOfMonth } from 'date-fns';

/** Clamp a day-of-month to the target month length (1..endOfMonth) */
function clampDayOfMonth(date, day) {
  const end = lastDayOfMonth(date).getDate();
  const clamped = Math.max(1, Math.min(day, end));
  const d = new Date(date.getFullYear(), date.getMonth(), clamped);
  return d;
}

/**
 * Given today and a billGenDay (1-31), return the cycle start date in local TZ.
 * If today >= this month's gen day → this month's gen date; else previous month's gen date.
 */
export function getCycleStart(today, billGenDay) {
  const base = new Date(today.getFullYear(), today.getMonth(), 1);
  const thisMonthStart = clampDayOfMonth(base, billGenDay);
  if (today >= thisMonthStart) return thisMonthStart;
  // previous month
  const prevMonth = new Date(base.getFullYear(), base.getMonth() - 1, 1);
  return clampDayOfMonth(prevMonth, billGenDay);
}

/** Return due date = cycleStart + offsetDays */
export function getDueDate(cycleStart, offsetDays) {
  return addDays(cycleStart, Math.max(1, Number(offsetDays || 15)));
}

/** Cycle key used to mark paid per cycle (YYYY-MM) */
export function getCycleKey(cycleStart) {
  const y = cycleStart.getFullYear();
  const m = String(cycleStart.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Compute status for a card
 * Returns: { state: 'none'|'open'|'overdue', cycleStart:Date, dueDate:Date, cycleKey:string }
 */
export function getStatus(today, billGenDay, billDueOffsetDays, lastPaidCycleKey) {
  if (!billGenDay || !billDueOffsetDays) {
    return { state: 'none', cycleStart: null, dueDate: null, cycleKey: null };
  }
  const start = getCycleStart(today, billGenDay);
  const due = getDueDate(start, billDueOffsetDays);
  const key = getCycleKey(start);
  if (lastPaidCycleKey === key) {
    return { state: 'none', cycleStart: start, dueDate: due, cycleKey: key };
  }
  if (today > due) return { state: 'overdue', cycleStart: start, dueDate: due, cycleKey: key };
  if (today >= start && today <= due) return { state: 'open', cycleStart: start, dueDate: due, cycleKey: key };
  return { state: 'none', cycleStart: start, dueDate: due, cycleKey: key };
}


