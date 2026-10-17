// Build-time "today". Badges and notice archiving are calculated from this date, and the
// site is rebuilt daily (Doc 07 Q08). Set BUILD_DATE=YYYY-MM-DD to preview another day.
export default function () {
  const env = process.env.BUILD_DATE;
  const today = env ? new Date(`${env}T12:00:00+05:00`) : new Date();
  return { today, year: new Date(today.getTime() + 5 * 3600 * 1000).getUTCFullYear() };
}
