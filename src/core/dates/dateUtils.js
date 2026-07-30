export const localISO = (date = new Date()) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

export const startOfWeek = (date = new Date()) => {
  const result = new Date(date);
  const day = result.getDay() || 7;
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - day + 1);
  return result;
};

export const isThisWeek = (value) => {
  const date = new Date(value);
  const start = startOfWeek();
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return date >= start && date < end;
};

export const daysBetween = (from, to) =>
  Math.round((new Date(to).setHours(0, 0, 0, 0) - new Date(from).setHours(0, 0, 0, 0)) / 86400000);

export const formatShortDate = (value) =>
  new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "short" }).format(new Date(value));

