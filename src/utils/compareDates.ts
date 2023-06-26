export const compareDateAndTime = (firstItem, secondItem) => {
  return +new Date(secondItem.date) - +new Date(firstItem.date);
};
