export function pickDailyQuery(queries: string[]): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return queries[dayOfYear % queries.length];
}
