export const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

export const normalizeEnd = (start, end) => {
  const s = timeToMinutes(start);
  let e = timeToMinutes(end);
  if (e <= s) e += 24 * 60; // spans midnight, add 24hrs
  return e;
};