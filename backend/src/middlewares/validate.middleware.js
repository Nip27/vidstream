import { ApiError } from "../utils/ApiError.js"

// ─── Field validators ─────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const URL_REGEX = /^https?:\/\/.+/i

/**
 * Returns a middleware that validates the request body against a schema map.
 *
 * Schema format:
 *   { fieldName: { required?, minLength?, maxLength?, isEmail?, isUrl? } }
 *
 * Usage:
 *   router.post('/login', validate({ email: { required: true, isEmail: true } }), loginUser)
 */
export const validate = (schema) => (req, res, next) => {
  const errors = []

  for (const [field, rules] of Object.entries(schema)) {
    const value = req.body[field]
    const strVal = typeof value === "string" ? value.trim() : value

    if (rules.required && (strVal === undefined || strVal === null || strVal === "")) {
      errors.push(`${field} is required`)
      continue // skip further checks if missing
    }

    if (strVal === undefined || strVal === null || strVal === "") continue

    if (rules.minLength && String(strVal).length < rules.minLength) {
      errors.push(`${field} must be at least ${rules.minLength} characters`)
    }

    if (rules.maxLength && String(strVal).length > rules.maxLength) {
      errors.push(`${field} must be at most ${rules.maxLength} characters`)
    }

    if (rules.isEmail && !EMAIL_REGEX.test(String(strVal))) {
      errors.push(`${field} must be a valid email address`)
    }

    if (rules.isUrl && !URL_REGEX.test(String(strVal))) {
      errors.push(`${field} must be a valid URL starting with http:// or https://`)
    }
  }

  if (errors.length > 0) {
    return next(new ApiError(400, errors[0], errors))
  }

  next()
}

/**
 * Validates that req.params[paramName] is a valid MongoDB ObjectId string.
 */
export const validateObjectId = (paramName) => (req, res, next) => {
  const value = req.params[paramName]
  if (!value || !/^[a-f\d]{24}$/i.test(value)) {
    return next(new ApiError(400, `Invalid ${paramName}`))
  }
  next()
}
