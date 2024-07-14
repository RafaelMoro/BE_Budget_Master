export const getMonthNumber = (month: string): number => {
  const monthNumber = new Date(`${month} 1, 2021`).getMonth();
  return monthNumber;
};
