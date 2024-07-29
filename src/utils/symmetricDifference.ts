export function symmetricDifference({
  oldArray,
  newArray,
}: {
  oldArray: string[];
  newArray: string[];
}) {
  const firstDifference = oldArray.filter(
    (oldValue) => !newArray.some((newValue) => oldValue === newValue),
  );
  const secondDifference = newArray.filter(
    (newValue) => !oldArray.some((oldValue) => newValue === oldValue),
  );

  return {
    oldValues: firstDifference,
    newValues: secondDifference,
  };
}
