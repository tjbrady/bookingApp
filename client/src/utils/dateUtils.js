export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const day = d.getUTCDate().toString().padStart(2, '0');
  const month = d.toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' });
  const year = d.getUTCFullYear().toString().slice(-2);
  return `${day}${month}${year}`;
};

export const toUTCKey = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
};

export const createUTCDate = (year, month, day) => {
    return new Date(Date.UTC(year, month, day));
};

export const getStartOfWeekUTC = (date) => {
    const d = new Date(date);
    const day = d.getUTCDay(); // 0 (Sun) to 6 (Sat)
    const diff = d.getUTCDate() - day;
    d.setUTCDate(diff);
    d.setUTCHours(0, 0, 0, 0);
    return d;
};

export const addDaysUTC = (date, days) => {
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() + days);
    return d;
};