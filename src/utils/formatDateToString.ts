const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sept',
  'Oct',
  'Nov',
  'Dec',
];

const WEEKDAY = ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'];

export const formatDateToString = (date: Date) => {
  const day = date.getDate();
  const weekday = date.getDay();
  const month = date.getMonth();
  const hour = date.getHours();
  const year = date.getFullYear();

  const hourString = String(hour).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  const fullDate = `${WEEKDAY[weekday]}, ${MONTHS[month]} ${day}, ${year}`;
  const twelveHourPeriod = hour >= 0 && hour <= 11 ? 'am' : 'pm';
  const formattedTime = `${hourString}:${minutes}${twelveHourPeriod}`;

  return {
    fullDate,
    formattedTime,
  };
};
