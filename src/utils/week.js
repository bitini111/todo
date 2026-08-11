const WEEKDAY_MS = 24 * 60 * 60 * 1000

/** Get the Monday (start of week) for the given date in local time */
export function getWeekStart(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Get the Sunday (end of week) */
export function getWeekEnd(date = new Date()) {
  const start = getWeekStart(date)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return end
}

/** Format date as YYYY-MM-DD in local time */
export function formatDate(date) {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Get a human-readable week range string (Mon DD – Sun DD, YYYY) */
export function getWeekRangeStr() {
  const start = getWeekStart()
  const end = getWeekEnd()
  const opts = { month: 'short', day: 'numeric' }
  const startStr = start.toLocaleDateString(undefined, opts)
  const endStr = end.toLocaleDateString(undefined, { ...opts, year: 'numeric' })
  return `${startStr} – ${endStr}`
}
