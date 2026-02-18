export function id(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function now(): string {
  return new Date().toISOString()
}
