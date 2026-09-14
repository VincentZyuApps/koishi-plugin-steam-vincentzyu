export function displayHours(minutes = 0) {
  return `${(minutes / 60).toFixed(1)} 小时`
}

export function defaultReplayYear() {
  const now = new Date()
  return now.getMonth() === 11 ? now.getFullYear() : now.getFullYear() - 1
}
