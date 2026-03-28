import { normalizeCalendarDateParam, parseCalendarDateAtMidday } from "@/src/lib/dates";

export type OperationsRangePreset = "day" | "week" | "month" | "custom" | "all";

function normalizeDate(value?: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  return value;
}

function getDayBounds(dateValue: string) {
  const start = parseCalendarDateAtMidday(dateValue);
  start.setHours(0, 0, 0, 0);

  const end = parseCalendarDateAtMidday(dateValue);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function getWeekBounds(dateValue: string) {
  const base = parseCalendarDateAtMidday(dateValue);
  const day = base.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(base);
  start.setDate(base.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function getMonthBounds(dateValue: string) {
  const base = parseCalendarDateAtMidday(dateValue);
  const start = new Date(base.getFullYear(), base.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function toDateInputValue(value: Date) {
  const offset = value.getTimezoneOffset();
  return new Date(value.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export function normalizeRangePreset(value?: string | null): OperationsRangePreset {
  if (
    value === "day" ||
    value === "week" ||
    value === "month" ||
    value === "custom" ||
    value === "all"
  ) {
    return value;
  }

  return "day";
}

export function resolveOperationsDateRange(params: {
  preset?: string | null;
  date?: string | null;
  from?: string | null;
  to?: string | null;
}) {
  const preset = normalizeRangePreset(params.preset);
  const anchorDate = normalizeCalendarDateParam(params.date ?? undefined);
  const customFrom = normalizeDate(params.from);
  const customTo = normalizeDate(params.to);

  if (preset === "all") {
    return {
      preset,
      anchorDate,
      from: null,
      to: null,
      start: null,
      end: null,
    };
  }

  if (preset === "custom") {
    const safeFrom = customFrom ?? anchorDate;
    const safeTo = customTo ?? safeFrom;
    const startDate = safeFrom <= safeTo ? safeFrom : safeTo;
    const endDate = safeFrom <= safeTo ? safeTo : safeFrom;
    const start = parseCalendarDateAtMidday(startDate);
    start.setHours(0, 0, 0, 0);
    const end = parseCalendarDateAtMidday(endDate);
    end.setHours(23, 59, 59, 999);

    return {
      preset,
      anchorDate,
      from: startDate,
      to: endDate,
      start,
      end,
    };
  }

  const bounds =
    preset === "week"
      ? getWeekBounds(anchorDate)
      : preset === "month"
        ? getMonthBounds(anchorDate)
        : getDayBounds(anchorDate);

  return {
    preset,
    anchorDate,
    from: toDateInputValue(bounds.start),
    to: toDateInputValue(bounds.end),
    start: bounds.start,
    end: bounds.end,
  };
}
