export function normalizeCalendarDateParam(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    return new Date(today.getTime() - offset * 60_000).toISOString().slice(0, 10);
  }

  return value;
}

export function parseCalendarDateAtMidday(dateValue: string) {
  return new Date(`${dateValue}T12:00:00`);
}
