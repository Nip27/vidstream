import "@testing-library/jest-dom"
import { vi } from "vitest"

// Mock window.location for redirect tests
Object.defineProperty(window, "location", {
  writable: true,
  value: { href: "", pathname: "/", startsWith: (s) => "/".startsWith(s) },
})

// Suppress console.error from React for expected errors in tests
const originalConsoleError = console.error
console.error = (...args) => {
  if (
    typeof args[0] === "string" &&
    (args[0].includes("Warning:") || args[0].includes("Error:"))
  ) {
    return
  }
  originalConsoleError(...args)
}
