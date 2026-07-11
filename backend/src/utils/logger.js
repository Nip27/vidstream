/**
 * Simple structured logger.
 * - In production:  info/warn/error all write to stdout/stderr.
 * - In test:        all output is suppressed so test output stays clean.
 */

const isTest = process.env.NODE_ENV === "test"

const timestamp = () => new Date().toISOString()

const logger = {
  info: (...args) => {
    if (!isTest) console.log(`[INFO  ${timestamp()}]`, ...args)
  },
  warn: (...args) => {
    if (!isTest) console.warn(`[WARN  ${timestamp()}]`, ...args)
  },
  error: (...args) => {
    if (!isTest) console.error(`[ERROR ${timestamp()}]`, ...args)
  },
}

export default logger
