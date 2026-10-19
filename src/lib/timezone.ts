/**
 * Timezone and Attendance Utility functions for ARCH OS.
 * Operates using IANA timezones (e.g. "Asia/Kolkata", "America/New_York", "UTC").
 */

export interface TimezoneTime {
  hours: number;
  minutes: number;
  formatted: string; // HH:mm in target timezone
}

/**
 * Extracts the local hours and minutes of a timestamp in the specified IANA timezone.
 */
export function getTimeInTimezone(dateInput: Date | string, timeZone = "Asia/Kolkata"): TimezoneTime {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) {
    return { hours: 0, minutes: 0, formatted: "—" };
  }

  try {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    let hours = 0;
    let minutes = 0;

    for (const part of parts) {
      if (part.type === "hour") hours = parseInt(part.value, 10) % 24;
      if (part.type === "minute") minutes = parseInt(part.value, 10);
    }

    const formatted = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    return { hours, minutes, formatted };
  } catch {
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const formatted = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    return { hours, minutes, formatted };
  }
}

/**
 * Determines whether a check-in timestamp is classified as "late" according to
 * the firm's configured timezone and office start time threshold.
 *
 * Example: officeStartTime = "09:15"
 * - Check-in at 09:15:00 in firm's timezone => NOT late (on time)
 * - Check-in at 09:15:59 / 09:16:00 in firm's timezone => LATE
 */
export function isCheckInLate(
  checkInTime: Date | string,
  timeZone = "Asia/Kolkata",
  officeStartTime = "09:15"
): { isLate: boolean; checkInFormatted: string; threshold: string } {
  const { hours, minutes, formatted } = getTimeInTimezone(checkInTime, timeZone);
  if (formatted === "—") {
    return { isLate: false, checkInFormatted: "—", threshold: officeStartTime };
  }

  const [threshH = 9, threshM = 15] = (officeStartTime || "09:15").split(":").map(Number);

  const isLate = hours > threshH || (hours === threshH && minutes > threshM);
  return {
    isLate,
    checkInFormatted: formatted,
    threshold: officeStartTime || "09:15"
  };
}

/**
 * Returns the current date (YYYY-MM-DD) in the specified firm timezone.
 */
export function getTodayInTimezone(timeZone = "Asia/Kolkata"): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    return formatter.format(new Date()); // Formats as YYYY-MM-DD
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}
