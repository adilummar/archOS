/** Date helpers — all demo data is generated relative to "today" so the demo
 *  always shows overdue tasks, tasks due today, upcoming meetings, etc. */

/** YYYY-MM-DD offset from today. */
export const daysFromNow = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

/** Full ISO timestamp offset from today (in days, can be fractional). */
export const isoDaysFromNow = (n: number): string =>
  new Date(Date.now() + n * 86400000).toISOString();

/** ISO timestamp n hours from now. */
export const isoHoursFromNow = (n: number): string =>
  new Date(Date.now() + n * 3600000).toISOString();
