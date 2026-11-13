const formatTo24h = (timeStr, fallback = "09:00") => {
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

const formatToAmPm = (timeStr) => {
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

module.exports = {
  formatTo24h,
  formatToAmPm,
};
