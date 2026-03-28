const CALENDAR_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const LOCAL_DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/;
const OFFSET_DATE_TIME_PATTERN = /(Z|[+-]\d{2}:\d{2})$/i;

export const UTC_TIMEZONE = "UTC";
export const DETECTED_TIMEZONE_COOKIE = "detectedTimezone";

export type TimezoneSource = "user" | "device" | "organization" | "utc";

export interface ResolvedTimezonePreference {
  timezone: string;
  source: TimezoneSource;
  userTimezone: string | null;
  detectedTimezone: string | null;
  organizationTimezone: string;
}

export interface ZonedDateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

interface LocalDateTimeParts extends ZonedDateParts {
  millisecond: number;
}

interface FormatDateOptions extends Intl.DateTimeFormatOptions {
  locale?: string;
  timeZone: string;
}

const dateTimeFormatterCache = new Map<string, Intl.DateTimeFormat>();
const zonedPartsFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getDateTimeFormatter(
  locale: string,
  timeZone: string,
  options: Intl.DateTimeFormatOptions
) {
  const cacheKey = JSON.stringify([locale, timeZone, options]);
  const cached = dateTimeFormatterCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const formatter = new Intl.DateTimeFormat(locale, {
    ...options,
    timeZone,
  });
  dateTimeFormatterCache.set(cacheKey, formatter);
  return formatter;
}

function getZonedPartsFormatter(timeZone: string) {
  const cached = zonedPartsFormatterCache.get(timeZone);

  if (cached) {
    return cached;
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  zonedPartsFormatterCache.set(timeZone, formatter);
  return formatter;
}

function padNumber(value: number, size = 2) {
  return String(value).padStart(size, "0");
}

function buildCalendarDate(year: number, month: number, day: number) {
  return `${padNumber(year, 4)}-${padNumber(month)}-${padNumber(day)}`;
}

function buildDateTimeLocalValue(parts: ZonedDateParts) {
  return `${buildCalendarDate(parts.year, parts.month, parts.day)}T${padNumber(parts.hour)}:${padNumber(parts.minute)}`;
}

function isValidCalendarDateParts(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function parseMillisecond(value: string | undefined) {
  if (!value) {
    return 0;
  }

  return Number(value.padEnd(3, "0"));
}

function parseCalendarDateParts(value: string) {
  const match = CALENDAR_DATE_PATTERN.exec(value.trim());

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!isValidCalendarDateParts(year, month, day)) {
    return null;
  }

  return {
    year,
    month,
    day,
  };
}

function parseLocalDateTimeParts(value: string) {
  const trimmed = value.trim();
  const match = LOCAL_DATE_TIME_PATTERN.exec(trimmed);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4] ?? "0");
  const minute = Number(match[5] ?? "0");
  const second = Number(match[6] ?? "0");
  const millisecond = parseMillisecond(match[7]);

  if (!isValidCalendarDateParts(year, month, day)) {
    return null;
  }

  if (
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59 ||
    second < 0 ||
    second > 59 ||
    millisecond < 0 ||
    millisecond > 999
  ) {
    return null;
  }

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    millisecond,
  } satisfies LocalDateTimeParts;
}

function toDate(value: Date | string) {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("La fecha no es válida");
  }

  return date;
}

function hasExplicitOffset(value: string) {
  return OFFSET_DATE_TIME_PATTERN.test(value.trim());
}

function normalizeTimeZone(value: string | null | undefined) {
  const candidate = value?.trim();

  if (!candidate) {
    return null;
  }

  if (!isValidTimezone(candidate)) {
    return null;
  }

  return candidate;
}

function getCandidateOffsetsInMinutes(utcGuess: number, timeZone: string) {
  const samples = [-36, -12, 0, 12, 36];

  return Array.from(
    new Set(
      samples.map((hours) =>
        getTimeZoneOffsetMinutes(new Date(utcGuess + hours * 60 * 60 * 1000), timeZone)
      )
    )
  );
}

function matchesLocalParts(
  actual: ZonedDateParts,
  expected: LocalDateTimeParts
) {
  return (
    actual.year === expected.year &&
    actual.month === expected.month &&
    actual.day === expected.day &&
    actual.hour === expected.hour &&
    actual.minute === expected.minute &&
    actual.second === expected.second
  );
}

function findUtcCandidatesForLocalDateTime(
  parts: LocalDateTimeParts,
  timeZone: string
) {
  const utcGuess = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    parts.millisecond
  );

  const candidates = getCandidateOffsetsInMinutes(utcGuess, timeZone)
    .map((offsetMinutes) => new Date(utcGuess - offsetMinutes * 60_000))
    .filter((candidate, index, list) => {
      const time = candidate.getTime();
      return (
        list.findIndex((entry) => entry.getTime() === time) === index &&
        matchesLocalParts(toUserTimezone(candidate, timeZone), parts)
      );
    })
    .sort((a, b) => a.getTime() - b.getTime());

  return candidates;
}

export function isValidTimezone(value: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function sanitizeTimezone(
  value: string | null | undefined,
  fallback: string | null = null
) {
  return normalizeTimeZone(value) ?? fallback;
}

export function getSupportedTimezones() {
  const supportedValuesOf = (
    Intl as typeof Intl & {
      supportedValuesOf?: (key: string) => string[];
    }
  ).supportedValuesOf;

  if (typeof supportedValuesOf === "function") {
    return Array.from(new Set([UTC_TIMEZONE, ...supportedValuesOf("timeZone")]));
  }

  return [UTC_TIMEZONE];
}

export function resolveTimezonePreference(options: {
  userTimezone?: string | null;
  detectedTimezone?: string | null;
  organizationTimezone?: string | null;
}) {
  const userTimezone = normalizeTimeZone(options.userTimezone);
  const detectedTimezone = normalizeTimeZone(options.detectedTimezone);
  const organizationTimezone =
    normalizeTimeZone(options.organizationTimezone) ?? UTC_TIMEZONE;

  if (userTimezone) {
    return {
      timezone: userTimezone,
      source: "user",
      userTimezone,
      detectedTimezone,
      organizationTimezone,
    } satisfies ResolvedTimezonePreference;
  }

  if (detectedTimezone) {
    return {
      timezone: detectedTimezone,
      source: "device",
      userTimezone: null,
      detectedTimezone,
      organizationTimezone,
    } satisfies ResolvedTimezonePreference;
  }

  if (organizationTimezone) {
    return {
      timezone: organizationTimezone,
      source: "organization",
      userTimezone: null,
      detectedTimezone: null,
      organizationTimezone,
    } satisfies ResolvedTimezonePreference;
  }

  return {
    timezone: UTC_TIMEZONE,
    source: "utc",
    userTimezone: null,
    detectedTimezone: null,
    organizationTimezone: UTC_TIMEZONE,
  } satisfies ResolvedTimezonePreference;
}

export function toUserTimezone(value: Date | string, timeZone: string) {
  const date = toDate(value);
  const formatter = getZonedPartsFormatter(timeZone);
  const parts = formatter.formatToParts(date);
  const resolved = {
    year: 0,
    month: 0,
    day: 0,
    hour: 0,
    minute: 0,
    second: 0,
  } satisfies ZonedDateParts;

  for (const part of parts) {
    if (part.type === "year") {
      resolved.year = Number(part.value);
    }

    if (part.type === "month") {
      resolved.month = Number(part.value);
    }

    if (part.type === "day") {
      resolved.day = Number(part.value);
    }

    if (part.type === "hour") {
      resolved.hour = Number(part.value);
    }

    if (part.type === "minute") {
      resolved.minute = Number(part.value);
    }

    if (part.type === "second") {
      resolved.second = Number(part.value);
    }
  }

  return resolved;
}

export function getTimeZoneOffsetMinutes(value: Date | string, timeZone: string) {
  const date = toDate(value);
  const parts = toUserTimezone(date, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    date.getUTCMilliseconds()
  );

  return Math.round((asUtc - date.getTime()) / 60_000);
}

export function parseToUTC(value: Date | string, timeZone = UTC_TIMEZONE) {
  if (value instanceof Date) {
    return toDate(value);
  }

  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("La fecha no es válida");
  }

  if (hasExplicitOffset(trimmed)) {
    return toDate(trimmed);
  }

  const localParts = parseLocalDateTimeParts(trimmed);

  if (!localParts) {
    throw new Error("La fecha no es válida");
  }

  const safeTimeZone = sanitizeTimezone(timeZone, UTC_TIMEZONE) ?? UTC_TIMEZONE;
  const candidates = findUtcCandidatesForLocalDateTime(localParts, safeTimeZone);

  if (candidates.length === 0) {
    throw new Error(
      `La fecha ${trimmed} no existe en la zona horaria ${safeTimeZone}`
    );
  }

  return candidates[0];
}

export function parseNullableToUTC(
  value: Date | string | null | undefined,
  timeZone = UTC_TIMEZONE
) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return parseToUTC(value, timeZone);
}

export function getUtcTimestamp(value: Date | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  return parseToUTC(value).getTime();
}

export function getTodayInTimezone(timeZone: string) {
  const parts = toUserTimezone(new Date(), timeZone);
  return buildCalendarDate(parts.year, parts.month, parts.day);
}

export function getCalendarDateInTimezone(value: Date | string, timeZone: string) {
  const parts = toUserTimezone(value, timeZone);
  return buildCalendarDate(parts.year, parts.month, parts.day);
}

export function toDateInputValue(value: Date | string | null, timeZone: string) {
  if (!value) {
    return "";
  }

  return getCalendarDateInTimezone(value, timeZone);
}

export function toDatetimeLocalValue(value: Date | string | null, timeZone: string) {
  if (!value) {
    return "";
  }

  return buildDateTimeLocalValue(toUserTimezone(value, timeZone));
}

export function serializeDateTimeForApi(
  value: Date | string | null | undefined,
  timeZone: string
) {
  if (!value) {
    return null;
  }

  return parseToUTC(value, timeZone).toISOString();
}

export function startOfDay(value: Date | string, timeZone: string) {
  const calendarDate =
    typeof value === "string" && parseCalendarDateParts(value)
      ? value
      : getCalendarDateInTimezone(value, timeZone);

  return parseToUTC(`${calendarDate}T00:00:00.000`, timeZone);
}

export function endOfDay(value: Date | string, timeZone: string) {
  const calendarDate =
    typeof value === "string" && parseCalendarDateParts(value)
      ? value
      : getCalendarDateInTimezone(value, timeZone);

  return parseToUTC(`${calendarDate}T23:59:59.999`, timeZone);
}

export function addDaysToCalendarDate(value: string, diff: number) {
  const parts = parseCalendarDateParts(value);

  if (!parts) {
    throw new Error("La fecha de calendario no es válida");
  }

  const nextDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + diff, 12, 0, 0, 0));
  return buildCalendarDate(
    nextDate.getUTCFullYear(),
    nextDate.getUTCMonth() + 1,
    nextDate.getUTCDate()
  );
}

export function getWeekdayFromCalendarDate(value: string) {
  const parts = parseCalendarDateParts(value);

  if (!parts) {
    throw new Error("La fecha de calendario no es válida");
  }

  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0, 0, 0)).getUTCDay();
}

export function getMonthStart(value: string) {
  const parts = parseCalendarDateParts(value);

  if (!parts) {
    throw new Error("La fecha de calendario no es válida");
  }

  return buildCalendarDate(parts.year, parts.month, 1);
}

export function getMonthEnd(value: string) {
  const parts = parseCalendarDateParts(value);

  if (!parts) {
    throw new Error("La fecha de calendario no es válida");
  }

  const lastDay = new Date(Date.UTC(parts.year, parts.month, 0, 12, 0, 0, 0)).getUTCDate();
  return buildCalendarDate(parts.year, parts.month, lastDay);
}

export function formatDate(
  value: Date | string | null | undefined,
  options: FormatDateOptions
) {
  if (!value) {
    return "";
  }

  const locale = options.locale ?? "es-MX";
  const { timeZone, ...intlOptions } = options;

  return getDateTimeFormatter(locale, timeZone, intlOptions).format(toDate(value));
}

export function formatCalendarDate(
  value: string | null | undefined,
  options: Omit<FormatDateOptions, "timeZone"> & {
    locale?: string;
  }
) {
  if (!value) {
    return "";
  }

  const parts = parseCalendarDateParts(value);

  if (!parts) {
    return "";
  }

  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0, 0, 0));
  const locale = options.locale ?? "es-MX";
  const hasExplicitDateParts = Boolean(
    options.weekday || options.year || options.month || options.day
  );
  const intlOptions = hasExplicitDateParts
    ? {
        weekday: options.weekday,
        year: options.year,
        month: options.month,
        day: options.day,
      }
    : {
        dateStyle: options.dateStyle ?? "medium",
      };

  return getDateTimeFormatter(locale, UTC_TIMEZONE, intlOptions).format(date);
}

export function normalizeCalendarDateParam(
  value: string | undefined,
  timeZone = UTC_TIMEZONE
) {
  const trimmed = value?.trim();

  if (!trimmed || !parseCalendarDateParts(trimmed)) {
    return getTodayInTimezone(timeZone);
  }

  return trimmed;
}

export function parseCalendarDateAtMidday(
  dateValue: string,
  timeZone = UTC_TIMEZONE
) {
  return parseToUTC(`${dateValue}T12:00:00.000`, timeZone);
}

export function formatTimezoneOffsetLabel(timeZone: string) {
  const offsetMinutes = getTimeZoneOffsetMinutes(new Date(), timeZone);
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteOffset = Math.abs(offsetMinutes);
  const hours = Math.floor(absoluteOffset / 60);
  const minutes = absoluteOffset % 60;

  return `UTC${sign}${padNumber(hours)}:${padNumber(minutes)}`;
}
