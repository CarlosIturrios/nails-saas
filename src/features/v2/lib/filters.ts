import {
  addDaysToCalendarDate,
  endOfDay,
  getMonthEnd,
  getMonthStart,
  getWeekdayFromCalendarDate,
  normalizeCalendarDateParam,
  startOfDay,
} from "@/src/lib/dates";

export type OperationsRangePreset = "day" | "week" | "month" | "custom" | "all";

function normalizeDate(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : null;
}

function getDayBounds(dateValue: string, timeZone: string) {
  return {
    startDate: dateValue,
    endDate: dateValue,
    start: startOfDay(dateValue, timeZone),
    end: endOfDay(dateValue, timeZone),
  };
}

function getWeekBounds(dateValue: string, timeZone: string) {
  const day = getWeekdayFromCalendarDate(dateValue);
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const startDate = addDaysToCalendarDate(dateValue, diffToMonday);
  const endDate = addDaysToCalendarDate(startDate, 6);

  return {
    startDate,
    endDate,
    start: startOfDay(startDate, timeZone),
    end: endOfDay(endDate, timeZone),
  };
}

function getMonthBounds(dateValue: string, timeZone: string) {
  const startDate = getMonthStart(dateValue);
  const endDate = getMonthEnd(dateValue);

  return {
    startDate,
    endDate,
    start: startOfDay(startDate, timeZone),
    end: endOfDay(endDate, timeZone),
  };
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

export function resolveOperationsDateRange(
  params: {
    preset?: string | null;
    date?: string | null;
    from?: string | null;
    to?: string | null;
  },
  timeZone: string
) {
  const preset = normalizeRangePreset(params.preset);
  const anchorDate = normalizeCalendarDateParam(params.date ?? undefined, timeZone);
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

    return {
      preset,
      anchorDate,
      from: startDate,
      to: endDate,
      start: startOfDay(startDate, timeZone),
      end: endOfDay(endDate, timeZone),
    };
  }

  const bounds =
    preset === "week"
      ? getWeekBounds(anchorDate, timeZone)
      : preset === "month"
        ? getMonthBounds(anchorDate, timeZone)
        : getDayBounds(anchorDate, timeZone);

  return {
    preset,
    anchorDate,
    from: bounds.startDate,
    to: bounds.endDate,
    start: bounds.start,
    end: bounds.end,
  };
}
