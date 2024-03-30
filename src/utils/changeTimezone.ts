export function changeTimezone(date: Date, ianatz: string): Date {
  const invdate = new Date(
    date.toLocaleString('en-US', {
      timeZone: ianatz,
    }),
  );

  const diff = date.getTime() - invdate.getTime();

  return new Date(date.getTime() - diff);
}
