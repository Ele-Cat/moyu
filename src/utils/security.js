export function setupSecurityProtection() {
  if (import.meta.env.MODE !== 'production') return

  document.addEventListener('contextmenu', (e) => {
    e.preventDefault()
  })

  document.onkeydown = (e) => {
    if (
      (e.key === 'F5') ||
      (e.key === 'F12') ||
      (e.ctrlKey && e.shiftKey && e.key === 'I') ||
      (e.ctrlKey && e.shiftKey && e.key === 'J') ||
      (e.ctrlKey && e.shiftKey && e.key === 'C') ||
      (e.ctrlKey && e.shiftKey && e.key === 'E') ||
      (e.ctrlKey && e.shiftKey && e.key === 'R') ||
      (e.ctrlKey && e.key === 'r') ||
      (e.ctrlKey && e.key === 'u') ||
      (e.ctrlKey && e.key === 's')
    ) {
      e.preventDefault()
    }
  }
}
