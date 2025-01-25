const MONTHS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sept',
  'Oct',
  'Nov',
  'Dic',
];

const WEEKDAY = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

export const formatDateToString = (date: Date) => {
  const day = date.getUTCDate();
  const weekday = date.getUTCDay();
  const month = date.getUTCMonth();
  const hour = date.getUTCHours();
  const year = date.getUTCFullYear();

  const hourString = String(hour).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  const fullDate = `${WEEKDAY[weekday]}, ${day}-${MONTHS[month]}-${year}`;
  const twelveHourPeriod = hour >= 0 && hour <= 11 ? 'am' : 'pm';
  const formattedTime = `${hourString}:${minutes}${twelveHourPeriod}`;

  return {
    fullDate,
    formattedTime,
  };
};
