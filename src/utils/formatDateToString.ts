const MONTHS = [
  'Jan',
  'Feb',
  'March',
  'April',
  'May',
  'June',
  'July',
  'Aug',
  'Sept',
  'Oct',
  'Nov',
  'Dec',
];

export const formatDateToString = (date: Date) => {
  const day = date.getDate();
  const month = date.getMonth();
  const hour = date.getHours();
  const hourString = String(hour).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const fullDate = `${MONTHS[month]} ${day}`;
  const twelveHourPeriod = hour >= 0 && hour <= 11 ? 'am' : 'pm';
  const formattedTime = `${hourString}:${minutes}${twelveHourPeriod}`;

  return {
    fullDate,
    formattedTime,
  };
};
