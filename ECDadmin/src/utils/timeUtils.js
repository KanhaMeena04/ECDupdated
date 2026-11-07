export const formatTo24h = (timeStr, fallback = "09:00") => {
  if (!timeStr || typeof timeStr !== "string") return fallback;
  const str = timeStr.trim();
  if (str.toUpperCase() === "CLOSED") return fallback;
  const match = str.match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i);
  if (!match) return fallback;
  let h = parseInt(match[1], 10);
  const m = match[2];
  const mod = match[3] ? match[3].toUpperCase() : null;
  if (!mod) {
    return `${String(h).padStart(2, "0")}:${m}`;
  }
  if (mod === "AM") {
    if (h === 12) h = 0;
  } else {
    if (h !== 12) h += 12;
  }
  return `${String(h).padStart(2, "0")}:${m}`;
};

export const formatToAmPm = (timeStr) => {
  if (!timeStr || typeof timeStr !== "string") return "";
  const str = timeStr.trim();
  if (str.toUpperCase() === "CLOSED") return "Closed";
  const match = str.match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i);
  if (!match) return str;
  let h = parseInt(match[1], 10);
  const m = match[2];
  const mod = match[3] ? match[3].toUpperCase() : null;
  if (mod) {
    return `${String(h).padStart(2, "0")}:${m} ${mod}`;
  }
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, "0")}:${m} ${period}`;
};
const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export const normalizeTimingForEdit = (timing) => {
  if (!timing || typeof timing !== "object") return {};
  const result = {};
  if (timing.isHoliday !== undefined) result.isHoliday = Boolean(timing.isHoliday);
  DAY_KEYS.forEach((day) => {
    const t = timing[day];
    if (!t || typeof t !== "object") return;
    result[day] = {
      ...t,
      open: formatTo24h(t.open || "", "09:00"),
      close: formatTo24h(t.close || "", "22:00"),
      isClosed: Boolean(t.isClosed || t.isOpen === false),
      isOpen: !(t.isClosed || t.isOpen === false),
    };
  });
  return result;
};

export const normalizeTimingForSave = (timing) => {
  if (!timing || typeof timing !== "object") return {};
  const result = {};
  if (timing.isHoliday !== undefined) result.isHoliday = Boolean(timing.isHoliday);
  DAY_KEYS.forEach((day) => {
    const t = timing[day];
    if (!t || typeof t !== "object") return;
    result[day] = {
      open: formatTo24h(t.open || "", "09:00"),
      close: formatTo24h(t.close || "", "22:00"),
      isClosed: Boolean(t.isClosed || t.isOpen === false),
      isOpen: !(t.isClosed || t.isOpen === false),
    };
  });
  return result;
};