/**
 * Date helpers for the salary domain.
 *
 * All dates are calendar dates ISO-8601 (`YYYY-MM-DD`). They are interpreted
 * in UTC so the calculations are deterministic and timezone-independent.
 */
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }
  const [year, month, day] = value.split('-').map(Number);
  if (month < 1 || month > 12 || day < 1) {
    return false;
  }
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day <= daysInMonth;
}

/**
 * Whole calendar years completed between `joinedAt` and `asOf`.
 * Requires both dates to be valid `YYYY-MM-DD` strings.
 */
export function fullYearsWorked(joinedAt: string, asOf: string): number {
  const [joinYear, joinMonth, joinDay] = joinedAt.split('-').map(Number);
  const [asOfYear, asOfMonth, asOfDay] = asOf.split('-').map(Number);
  let years = asOfYear - joinYear;
  const anniversaryNotReached =
    asOfMonth < joinMonth || (asOfMonth === joinMonth && asOfDay < joinDay);
  if (anniversaryNotReached) {
    years -= 1;
  }
  return Math.max(0, years);
}

/** Lexicographic comparison works because ISO dates are zero-padded. */
export function isDateBefore(dateA: string, dateB: string): boolean {
  return dateA < dateB;
}