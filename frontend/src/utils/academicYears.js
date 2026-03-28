const STORAGE_KEY = "student-profile-qr-academic-years";
const defaultYears = ["2025-26"];

function readStoredAcademicYears() {
  if (typeof window === "undefined") return [];

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    const parsed = rawValue ? JSON.parse(rawValue) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function writeStoredAcademicYears(years) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(years));
}

export function normalizeAcademicYearInput(value) {
  const normalized = String(value || "").trim();

  if (!/^\d{4}-\d{2}$/.test(normalized)) {
    throw new Error("Use academic year format YYYY-YY, for example 2026-27.");
  }

  const startYear = Number(normalized.slice(0, 4));
  const endYear = Number(normalized.slice(5, 7));
  const expectedEndYear = (startYear + 1) % 100;

  if (endYear !== expectedEndYear) {
    throw new Error("Academic year must continue correctly, for example 2026-27.");
  }

  return normalized;
}

export function getAcademicYearOptions(existingYears = []) {
  const storedYears = readStoredAcademicYears();

  return [...new Set([...defaultYears, ...storedYears, ...existingYears.filter(Boolean)])].sort(
    (left, right) => left.localeCompare(right),
  );
}

export function addAcademicYearOption(value) {
  const normalized = normalizeAcademicYearInput(value);
  const nextYears = getAcademicYearOptions([normalized]);

  writeStoredAcademicYears(nextYears.filter((year) => !defaultYears.includes(year)));

  return nextYears;
}
